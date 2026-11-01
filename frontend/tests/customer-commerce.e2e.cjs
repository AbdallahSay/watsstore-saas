const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const puppeteer=require('puppeteer-core');
const root=path.resolve(__dirname,'../..');const fixtures=JSON.parse(fs.readFileSync(path.join(root,'work/e2e-fixtures.json'),'utf8'));
const api=process.env.E2E_API_URL||'http://localhost:5000/api',site=process.env.E2E_SITE_URL||'http://localhost:3000';
const out=path.join(root,'work/customer-commerce/e2e');fs.mkdirSync(out,{recursive:true});
const executablePath=process.env.CHROME_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':'/usr/bin/google-chrome');
async function request(url,token,method='GET',body){const r=await fetch(api+url,{method,headers:{...(token?{Authorization:`Bearer ${token}`} : {}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});assert.equal(r.status,200,`${method} ${url}: ${r.status} ${await (r.status===200?Promise.resolve(''):r.text())}`);return r.json();}
async function click(page,text){await page.waitForFunction(text=>[...document.querySelectorAll('button,a')].some(x=>x.textContent===text&&!x.disabled),{},text);await page.evaluate(text=>[...document.querySelectorAll('button,a')].find(x=>x.textContent===text&&!x.disabled).click(),text);}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function viewport(page,width){await page.setViewport({width,height:1000,isMobile:false});await page.waitForFunction(width=>innerWidth===width,{},width);await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));scrollTo(0,0);});assert.ok(await page.evaluate(()=>[...document.querySelectorAll('.cc-container,.cc-panel')].every(x=>{const r=x.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1;})),`content bounds at ${width}`);}
(async()=>{const browser=await puppeteer.launch({executablePath,headless:true,args:['--no-sandbox']});const summary=[];try{
 for(const fixture of fixtures){
  const order=await request(`/public/stores/${fixture.slug}/orders`,null,'POST',{channel:'online',idempotencyKey:crypto.randomUUID(),customerName:'اختبار عميل معزول',customerPhone:'01000000000',customerAddress:'عنوان لا يتم الشحن إليه',paymentMethod:'cod',shippingZoneId:'cairo',governorate:'القاهرة',items:[{productId:fixture.productId,quantity:1,selectedVariants:{'المقاس':'M'}}]});
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.evaluateOnNewDocument(()=>{window.__notices=[];window.__permissionRequests=0;window.Notification=class{static permission='default';static async requestPermission(){window.__permissionRequests++;this.permission='granted';return 'granted';}constructor(title,options){window.__notices.push({title,options});}};const original=window.setInterval;window.setInterval=(fn,ms,...args)=>original(fn,ms>=30000?400:ms,...args);});
  await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true});await page.goto(`${site}/s/${fixture.slug}/my-orders`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.body.innerText.includes('لسه مفيش طلبات'));assert.equal(await page.evaluate(()=>window.__permissionRequests),0);
  await page.evaluate((slug,order)=>localStorage.setItem(`ws_customer_orders_${slug}`,JSON.stringify([{token:order.trackingToken,number:order.orderNumber,createdAt:new Date().toISOString()}])),fixture.slug,order);
  await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelector('.cc-order-row')?.textContent.includes('تم استلام طلبك'));
  await click(page,'تفعيل تنبيهات المتصفح');assert.equal(await page.evaluate(()=>window.__permissionRequests),1);
  await request(`/merchant/commerce/orders/${order.orderId}/status`,fixture.token,'PATCH',{status:'Confirmed'});
  await page.waitForFunction(()=>document.querySelector('[aria-label="تحديث غير مقروء"]'));
  await page.waitForFunction(()=>window.__notices.length===1);await click(page,'تحديث الآن');await sleep(600);assert.equal(await page.evaluate(()=>window.__notices.length),1);
  await page.reload({waitUntil:'domcontentloaded'});assert.equal(await page.evaluate(()=>window.__notices.length),0);assert.ok(await page.$('[aria-label="تحديث غير مقروء"]'));
  // A hidden page makes no automatic API calls. Resume refreshes immediately.
  let tracks=0;page.on('request',r=>{if(r.url().includes('/orders/track/'))tracks++;});
  await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true});document.dispatchEvent(new Event('visibilitychange'));});await sleep(500);const hidden=tracks;await sleep(1000);assert.equal(tracks,hidden);
  await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
  await click(page,'متابعة الطلب');await page.waitForSelector('.cc-progress');
  assert.equal(await page.evaluate(slug=>JSON.parse(localStorage.getItem(`ws_customer_orders_${slug}`))[0].unread,fixture.slug),false);
  for(const status of ['Preparing','Shipped','Delivered']){await request(`/merchant/commerce/orders/${order.orderId}/status`,fixture.token,'PATCH',{status});await page.waitForFunction(status=>document.querySelector('.cc-title [role=status]')?.textContent===status,{},({Preparing:'طلبك بيتجهّز',Shipped:'طلبك اتشحن',Delivered:'طلبك اتسلّم'})[status]);}
  const detail=await request(`/merchant/orders/${order.orderId}`,fixture.token);assert.equal(detail.status,'Delivered');
  await sleep(600);const final=tracks;await sleep(1200);assert.equal(tracks,final,'terminal tracking must stop polling');
  assert.equal(await page.$$eval('.cc-progress [data-complete=true]',x=>x.length),5);
  const text=await page.$eval('body',x=>x.innerText);assert.ok(!text.includes('01000000000'));assert.ok(!text.includes('عنوان لا يتم الشحن إليه'));assert.ok(text.includes('غير مفعلة حالياً'));
  for(const width of [320,375,390,768,1024,1440,1920]){await viewport(page,width);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${fixture.theme} tracking overflow ${width}`);if([390,1440].includes(width))await page.screenshot({path:path.join(out,`${fixture.theme}-tracking-${width}.png`)});}
  await page.goto(`${site}/s/${fixture.slug}/my-orders`,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('.cc-order-row');
  for(const width of [320,375,390,768,1024,1440,1920]){await viewport(page,width);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${fixture.theme} history overflow ${width}`);if(width===390)await page.screenshot({path:path.join(out,`${fixture.theme}-my-orders-${width}.png`)});}
  await click(page,'إزالة من الجهاز');await page.waitForFunction(()=>document.body.innerText.includes('لسه مفيش طلبات'));assert.equal((await request(`/merchant/orders/${order.orderId}`,fixture.token)).status,'Delivered','local removal never cancels order');
  assert.deepEqual(errors,[]);summary.push({theme:fixture.theme,status:'PASS',widths:[320,375,390,768,1024,1440,1920],checks:['same-device history','merchant status lifecycle','persistent unread','explicit permission','foreground dedup','hidden polling stops','terminal polling stops','tracking privacy','local removal']});await page.close();
 }
 fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify(summary,null,2));console.log(summary);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});


