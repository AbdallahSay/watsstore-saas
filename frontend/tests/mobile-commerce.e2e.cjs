const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),puppeteer=require('puppeteer-core');
const root=path.resolve(__dirname,'../..'),fixtures=JSON.parse(fs.readFileSync(path.join(root,'work/e2e-fixtures.json'),'utf8'));
const api=process.env.E2E_API_URL||'http://localhost:5000/api',site=process.env.E2E_SITE_URL||'http://localhost:3000';
const output=path.join(root,'work/mobile-commerce/e2e');fs.mkdirSync(output,{recursive:true});
assert.ok(new URL(api).hostname==='localhost'&&new URL(site).hostname==='localhost','This suite must only use the isolated local host.');
const executablePath=process.env.CHROME_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':'/usr/bin/google-chrome');
async function json(url,token){const r=await fetch(api+url,{headers:token?{Authorization:`Bearer ${token}`}:{}});assert.equal(r.status,200);return r.json();}
async function until(check){const deadline=Date.now()+30000;while(!check()){assert.ok(Date.now()<deadline,'Expected intercepted request did not arrive');await new Promise(r=>setTimeout(r,20));}}
async function click(page,selector,text){await page.waitForFunction((selector,text)=>[...document.querySelectorAll(selector)].some(x=>x.textContent.trim().includes(text)&&!x.disabled),{},selector,text);await page.evaluate((selector,text)=>[...document.querySelectorAll(selector)].find(x=>x.textContent.trim().includes(text)&&!x.disabled).click(),selector,text);}
async function fill(page,selector,value){await page.$eval(selector,(el,value)=>{const proto=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));},value);}
async function width(page,width,height=1000){await page.setViewport({width,height,isMobile:true,hasTouch:true});if(page.url()!=='about:blank')await page.waitForFunction(width=>innerWidth===width,{},width);await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});}
async function bounds(page){const result=await page.evaluate(()=>{const modal=document.querySelector('.ws-cart');return {overflow:modal.scrollWidth>modal.clientWidth+1,outside:[...modal.querySelectorAll('input,select,textarea,button,.ws-checkout-review')].filter(x=>{const r=x.getBoundingClientRect();return r.width>0&&(r.left< -1||r.right>innerWidth+1);}).map(x=>x.tagName+':'+x.textContent.slice(0,25))};});assert.equal(result.overflow,false,JSON.stringify(result));assert.deepEqual(result.outside,[]);}
(async()=>{const browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox']});const results=[];try{
 for(const [index,fixture]of fixtures.entries()){
  const context=await browser.createBrowserContext();const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));let heldCoupon,heldOrder;let pauseCoupon=false,pauseOrder=false;
  await page.setRequestInterception(true);page.on('request',request=>{if(request.method()==='POST'&&request.url().endsWith('/apply-coupon')&&pauseCoupon){pauseCoupon=false;heldCoupon=request;}else if(request.method()==='POST'&&request.url().endsWith('/orders')&&pauseOrder){pauseOrder=false;heldOrder=request;}else request.continue();});
  await width(page,375,844);await page.goto(`${site}/s/${fixture.slug}`,{waitUntil:'networkidle0'});await page.waitForSelector('.ws-product-info h3 a');
  // Product selection now opens a full page, not a modal; variants and quantities stay accessible.
  await click(page,'.ws-product-info h3 a','منتج اختبار — تصميم عربي');await page.waitForSelector('.ws-product-detail');
  await click(page,'.ws-product-options button','L');
  const touch=await page.$eval('.ws-product-options button',x=>({width:x.getBoundingClientRect().width,height:x.getBoundingClientRect().height}));assert.ok(touch.width>=44&&touch.height>=44);
  await fill(page,'.ws-product-quantity input','2');await click(page,'.ws-product-actions button[type=submit]','أضف إلى الحقيبة');await page.waitForSelector('.ws-cart');
  assert.equal(await page.evaluate(()=>document.body.style.overflow),'hidden');await page.click('.ws-cart>header button');
  await page.goto(`${site}/s/${fixture.slug}`,{waitUntil:'networkidle0'});await page.waitForSelector('.ws-product-info h3 a');
  await click(page,'.ws-product-info h3 a','منتج الاختبار 1');await page.waitForSelector('.ws-product-detail');
  await click(page,'.ws-product-actions button[type=submit]','أضف إلى الحقيبة');await page.waitForSelector('.ws-cart-items li:nth-child(2)');
  // Before a delivery zone is selected, never present a numeric grand total.
  assert.ok((await page.$eval('.ws-totals',x=>x.innerText)).includes('يظهر بعد اختيار منطقة التوصيل'));
  await page.click('.ws-cart>header button');
  await page.goto(`${site}/s/${fixture.slug}`,{waitUntil:'networkidle0'});await page.waitForSelector('.ws-product-info h3 a');
  await click(page,'.ws-product-info h3 a','WWWW');await page.waitForSelector('.ws-product-detail');
  await click(page,'.ws-product-actions button[type=submit]','أضف إلى الحقيبة');await page.waitForSelector('.ws-cart-items li:nth-child(3)');
  await width(page,320);await bounds(page);await click(page,'.ws-cart-items li:nth-child(3) button','حذف');
  // A stale coupon response must not overwrite the estimate for a changed cart.
  await fill(page,'#coupon','MOBILE10');pauseCoupon=true;await click(page,'.ws-coupon button','تطبيق');
  await until(()=>heldCoupon);
  await page.click('.ws-cart-items li:first-child button[aria-label="زيادة الكمية"]');
  const stale=page.waitForResponse(r=>r.url().endsWith('/apply-coupon'));await heldCoupon.continue();await stale;
  await page.waitForFunction(()=>!document.querySelector('.ws-coupon button').disabled);assert.ok(!(await page.$eval('.ws-totals',x=>x.innerText)).includes('الخصم'));
  await page.click('.ws-cart-items li:first-child button[aria-label="تقليل الكمية"]');const coupon=page.waitForResponse(r=>r.url().endsWith('/apply-coupon'));await click(page,'.ws-coupon button','تطبيق');assert.equal((await coupon).status(),200);await page.waitForFunction(()=>document.querySelector('.ws-totals').textContent.includes('30.50'));
  await click(page,'.ws-cart button','المتابعة لإتمام الطلب');await page.waitForFunction(()=>document.activeElement?.getAttribute('name')==='name');
  await fill(page,'.ws-checkout-form [name=name]','اختبار تجارة متنقلة معزول');await fill(page,'.ws-checkout-form [name=phone]','01000000000');await fill(page,'.ws-checkout-form [name=address]','عنوان اختبار معزول — لا يتم الشحن');await page.select('.ws-checkout-form select','cairo');
  await page.waitForFunction(()=>document.querySelector('.ws-checkout-review').textContent.includes('319.50'));assert.ok((await page.$eval('.ws-checkout-review',x=>x.innerText)).includes('3 منتجات'));
  for(const pixels of [320,375,390,768,1024,1440,1920]){await width(page,pixels);await bounds(page);if(pixels<768)assert.ok(await page.$$eval('.ws-checkout-form input,.ws-checkout-form select,.ws-checkout-form textarea',els=>els.every(x=>parseFloat(getComputedStyle(x).fontSize)>=16)));}
  await width(page,390,420);await page.$eval('[name=notes]',x=>{x.focus();x.scrollIntoView({block:'center'});});assert.ok(await page.$eval('[name=notes]',x=>x.getBoundingClientRect().top>=0&&x.getBoundingClientRect().bottom<=innerHeight+1));
  // Dialog focus stays inside it in both keyboard directions.
  await page.focus('.ws-checkout-form button[type=submit]');await page.keyboard.press('Tab');assert.ok(await page.$eval('.ws-cart>header button',x=>x===document.activeElement));await page.keyboard.down('Shift');await page.keyboard.press('Tab');await page.keyboard.up('Shift');assert.ok(await page.$eval('.ws-checkout-form button[type=submit]',x=>x===document.activeElement));
  await width(page,390,1000);await page.$eval('.ws-checkout-review',x=>x.scrollIntoView({block:'center'}));await page.screenshot({path:path.join(output,`${fixture.theme}-mobile-review.png`)});
  const before=await json('/merchant/orders',fixture.token),stockBefore=(await json('/merchant/commerce/inventory',fixture.token)).find(x=>x.productId===fixture.productId).quantity;
  pauseOrder=true;const orderResponse=page.waitForResponse(r=>r.request().method()==='POST'&&r.url().endsWith('/orders'));orderResponse.catch(()=>{});await click(page,'.ws-checkout-form button[type=submit]','تأكيد الطلب');await until(()=>heldOrder);
  await page.keyboard.press('Escape');assert.ok(await page.$('.ws-cart'),'Escape must not close checkout during submission');assert.equal(await page.$eval('.ws-cart',x=>x.getAttribute('aria-busy')),'true');await page.keyboard.press('Tab');assert.ok(await page.evaluate(()=>document.querySelector('.ws-cart').contains(document.activeElement)));
  const payload=JSON.parse(heldOrder.postData());assert.equal(payload.items.length,2);assert.equal(payload.items.find(x=>x.productId===fixture.productId).quantity,2);assert.equal(payload.items.find(x=>x.productId===fixture.productId).selectedVariants['المقاس'],'L');
  await heldOrder.continue();const response=await orderResponse;assert.equal(response.status(),200);const created=await response.json();assert.equal(created.subtotal,305);assert.equal(created.discountAmount,30.5);assert.equal(created.deliveryFee,45);assert.equal(created.totalAmount,319.5);await page.waitForSelector('.ws-confirmation');await page.waitForFunction(()=>document.querySelectorAll('.ws-confirmation li').length===2);assert.equal((await json('/merchant/orders',fixture.token)).total,before.total+1);assert.equal((await json('/merchant/commerce/inventory',fixture.token)).find(x=>x.productId===fixture.productId).quantity,stockBefore-2);
  assert.ok((await page.$eval('.ws-confirmed-status',x=>x.innerText)).includes('تم استلام طلبك'));await page.screenshot({path:path.join(output,`${fixture.theme}-mobile-success.png`)});await click(page,'.ws-confirmation button','متابعة التسوق');
  await page.evaluate(()=>{localStorage.setItem('watsstore_lang','en');});
  // Continue shopping closes the confirmation on the current product route. Return to the
  // catalog explicitly, then exercise the same real product-page path in English.
  await page.goto(`${site}/s/${fixture.slug}`,{waitUntil:'networkidle0'});
  await page.waitForFunction(()=>document.documentElement.dir==='ltr');
  await click(page,'.ws-product-info h3 a','منتج الاختبار 1');
  await page.waitForFunction(()=>document.querySelector('#product-title')?.textContent==='منتج الاختبار 1');
  assert.ok(new URL(page.url()).pathname.includes('/p/'),'English product selection opens a dedicated route');
  assert.equal(await page.$('[role=dialog]'),null,'Product selection must not open the retired product modal');
  await click(page,'.ws-product-actions button[type=submit]','Add to bag');
  await click(page,'.ws-cart button','Continue to checkout');await bounds(page);
  assert.ok((await page.$eval('.ws-checkout-review',x=>x.innerText)).includes('Order review'));
  await page.screenshot({path:path.join(output,`${fixture.theme}-english-checkout.png`)});
  assert.deepEqual(errors,[]);results.push({theme:fixture.theme,result:'PASS',widths:[320,375,390,768,1024,1440,1920],checks:['two products','variant L','quantity 2','coupon stale-response protection','server total 319.50','inventory deducted twice','long SKU','16px inputs','44px controls','short viewport','keyboard trap','busy Escape guard','Arabic RTL','English LTR']});await context.close();
 }
 fs.writeFileSync(path.join(output,'summary.json'),JSON.stringify(results,null,2));console.log(results);
}catch(error){const pages=await browser.pages();const page=pages.at(-1);if(page){console.error(await page.evaluate(()=>({totals:document.querySelector('.ws-totals')?.innerText,items:document.querySelector('.ws-cart-items')?.innerText,error:document.querySelector('.ws-error')?.textContent})));await page.screenshot({path:path.join(output,'failure.png')});}throw error;}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
