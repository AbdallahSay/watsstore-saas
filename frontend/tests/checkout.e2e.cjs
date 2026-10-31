const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer-core');
const root = path.resolve(__dirname, '../..');
const fixtures = JSON.parse(fs.readFileSync(path.join(root,'work/e2e-fixtures.json'),'utf8'));
const api = process.env.E2E_API_URL || 'http://localhost:5000/api';
const site = process.env.E2E_SITE_URL || 'http://localhost:3000';
const output = path.join(root,'work/p0-checkout/e2e');
fs.mkdirSync(output,{recursive:true});
const executablePath = process.env.CHROME_PATH || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : '/usr/bin/google-chrome');

async function json(url,token) {
  const response=await fetch(url,{headers:token?{Authorization:`Bearer ${token}`}:{}});
  assert.equal(response.status,200,`API check failed: ${response.status}`);
  return response.json();
}
async function clickText(page,selector,text) {
  await page.waitForFunction((selector,text)=>Array.from(document.querySelectorAll(selector)).some(x=>x.textContent.includes(text)),{},selector,text);
  await page.evaluate((selector,text)=>Array.from(document.querySelectorAll(selector)).find(x=>x.textContent.includes(text)).click(),selector,text);
}
async function fill(page,name,value) {
  await page.$eval(`.ws-checkout-form [name="${name}"]`,(input,value)=>{
    const proto=input.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto,'value').set.call(input,value);
    input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));
  },value);
}
async function openCheckout(page,fixture,width) {
  await page.setViewport({width,height:width<768?844:1000,isMobile:width<768,hasTouch:width<768});
  await page.goto(`${site}/s/${fixture.slug}`,{waitUntil:'networkidle0'});
  await page.waitForSelector('.ws-product-image');
  await clickText(page,'.ws-product-info h3 button','منتج اختبار — تصميم عربي');
  await clickText(page,'[role=dialog] button','إضافة إلى السلة');
  await clickText(page,'.ws-cart button','المتابعة لإتمام الطلب');
  await fill(page,'name','اختبار P0 معزول');await fill(page,'phone','01000000000');await fill(page,'address','عنوان الاختبار المعزول — لا يتم الشحن');
  await page.select('.ws-checkout-form select','cairo');
}

(async()=>{
  const browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox']});
  const summary=[];
  try {
    const fixture=fixtures[0];const page=await browser.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    let firstBody;let commit;let loseResponse=true;
    await page.setRequestInterception(true);
    page.on('request',async request=>{
      if(request.method()==='POST'&&request.url().endsWith('/orders')&&loseResponse) {
        loseResponse=false;firstBody=JSON.parse(request.postData());
        try {
          const response=await fetch(request.url(),{method:'POST',headers:{'Content-Type':'application/json'},body:request.postData()});
          assert.equal(response.status,200);commit=await response.json();
          await request.abort('failed'); // Simulate response loss AFTER actual database commit.
        } catch(e) {summary.push({failure:e.message});await request.abort('failed');}
      } else await request.continue();
    });
    await openCheckout(page,fixture,390);
    await clickText(page,'.ws-checkout-form button[type=submit]','تأكيد الطلب');
    await page.waitForFunction(()=>document.querySelector('.ws-error')?.textContent.includes('قد يكون الطلب قد سُجّل'));
    assert.ok(commit?.orderId,'API must have committed the isolated order before response loss');
    assert.equal(await page.$eval('.ws-checkout-form input[name=name]',x=>x.value),'اختبار P0 معزول');
    assert.equal(await page.$eval('.ws-checkout-form fieldset',x=>x.disabled),true);
    const before=await json(`${api}/merchant/orders`,fixture.token);
    assert.equal(before.orders.length,1);
    const stocks=await json(`${api}/merchant/commerce/inventory`,fixture.token);
    assert.equal(stocks.find(x=>x.productId===fixture.productId).quantity,24);
    await page.screenshot({path:path.join(output,'mobile-uncertain.png')});
    await page.reload({waitUntil:'networkidle0'});await page.click('.ws-bag');
    assert.equal(await page.$eval('.ws-checkout-form input[name=name]',x=>x.value),'اختبار P0 معزول');
    const replayRequest=page.waitForRequest(r=>r.method()==='POST'&&r.url().endsWith('/orders'));
    await clickText(page,'.ws-checkout-form button[type=submit]','إعادة التحقق من نفس الطلب');
    const sent=await replayRequest;assert.deepEqual(JSON.parse(sent.postData()),firstBody);
    await page.waitForSelector('.ws-confirmation');
    const after=await json(`${api}/merchant/orders`,fixture.token);assert.equal(after.orders.length,1);
    assert.equal((await json(`${api}/merchant/commerce/inventory`,fixture.token)).find(x=>x.productId===fixture.productId).quantity,24);
    const detail=await json(`${api}/merchant/orders/${commit.orderId}`,fixture.token);assert.equal(detail.status,'Pending');
    const tracking=await json(`${api}/public/stores/${fixture.slug}/orders/track/${commit.trackingToken}`);
    assert.equal(tracking.orderNumber,commit.orderNumber);assert.equal(tracking.customerPhone,undefined);
    const trackingLink=await page.$eval('.ws-confirmation a',x=>x.href);await page.goto(trackingLink,{waitUntil:'networkidle0'});
    assert.ok((await page.$eval('body',x=>x.innerText)).includes('متابعة الطلب'));
    assert.ok(!JSON.stringify(errors).includes('localhost:5000/api/public/stores/a9'));
    summary.push({case:'Chrome mobile: committed response lost, reload, same-key replay, one order, one stock deduction, merchant visibility and tracking',status:'PASS'});
    for(const [i,width] of [[1,1440],[2,375]]) {
      const next=await browser.newPage();await openCheckout(next,fixtures[i],width);
      const responses=next.waitForResponse(r=>r.request().method()==='POST'&&r.url().endsWith('/orders'));
      await next.evaluate(()=>{const form=document.querySelector('.ws-checkout-form');form.requestSubmit();form.requestSubmit();});
      assert.equal((await responses).status(),200);await next.waitForSelector('.ws-confirmation');
      assert.equal((await json(`${api}/merchant/orders`,fixtures[i].token)).orders.length,1);
      assert.equal((await json(`${api}/merchant/commerce/inventory`,fixtures[i].token)).find(x=>x.productId===fixtures[i].productId).quantity,24);
      await next.screenshot({path:path.join(output,`success-${width}.png`)});
      summary.push({case:`Chrome ${width}px: checkout + duplicate-click protection`,status:'PASS'});await next.close();
    }
    assert.equal(errors.length,0,JSON.stringify(errors));
    fs.writeFileSync(path.join(output,'summary.json'),JSON.stringify(summary,null,2));console.log(summary);
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
