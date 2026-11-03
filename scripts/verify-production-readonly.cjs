// Public release smoke test. Every browser write request is aborted, including orders.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,firefox,webkit,expect}=require('../frontend/node_modules/@playwright/test');
const site=process.env.E2E_SITE_URL||'https://watsstore.vercel.app',api=process.env.E2E_API_URL||'https://watsstore.runasp.net/api',slug=process.env.E2E_STORE_SLUG||'a9';
assert.ok(['localhost','watsstore.vercel.app','frontend-bay-ten-58.vercel.app'].includes(new URL(site).hostname));assert.ok(['localhost','watsstore.runasp.net'].includes(new URL(api).hostname));
const out=path.resolve(__dirname,'../work/transformation/production-readonly');fs.mkdirSync(out,{recursive:true});
async function bounds(page){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'No document overflow');}
(async()=>{const response=await fetch(`${api}/public/stores/${encodeURIComponent(slug)}`);assert.equal(response.status,200);const store=await response.json(),product=store.products.find(p=>p.isAvailable);assert.ok(product,'A publicly available product is required for the checkout UI smoke test.');
const results=[];for(const engine of (process.env.AUDIT_ENGINES||'chrome,firefox,webkit').split(',')){
 const browser=engine==='chrome'?await chromium.launch({channel:'chrome'}):await {firefox,webkit}[engine].launch();
 try{for(const language of ['ar','en']){
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,...(engine==='firefox'?{}:{isMobile:true}),reducedMotion:'reduce'});
  const writes=[],errors=[],images=[];
  await context.route('**/*',async route=>{const request=route.request();if(!['GET','HEAD','OPTIONS'].includes(request.method())){writes.push({method:request.method(),host:new URL(request.url()).hostname,path:new URL(request.url()).pathname});await route.abort('blockedbyclient');}else await route.continue();});
  await context.addInitScript(language=>{localStorage.setItem('watsstore_lang',language);localStorage.setItem('watsstore_theme','light');},language);
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',response=>{if(response.url().includes('/_next/image?'))images.push({status:response.status(),type:response.headers()['content-type'],bytes:response.headers()['content-length']});});
  await page.goto(`${site}/s/${encodeURIComponent(slug)}`,{waitUntil:'networkidle'});await expect(page.locator('.ws-storefront')).toBeVisible();
  for(const width of [320,360,375,390,414,430,768,1024,1280,1440,1920]){await page.setViewportSize({width,height:844});await bounds(page);}
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,`${engine}-${language}-store.png`)});
  const search=page.getByRole('searchbox');await search.fill('technical-empty-search-74f3');await expect(page.locator('.ws-empty-state')).toBeVisible();await search.fill('');
  await page.goto(`${site}/s/${encodeURIComponent(slug)}/p/${encodeURIComponent(product.slug)}`,{waitUntil:'networkidle'});await expect(page.locator('#product-title')).toHaveText(product.name);await bounds(page);await page.screenshot({path:path.join(out,`${engine}-${language}-product.png`)});
  await page.getByRole('button',{name:language==='ar'?'اشترِ الآن':'Buy now',exact:true}).click();await expect(page.locator('.ws-checkout-form')).toBeVisible();
  await page.locator('input[name=name]').fill('اختبار واجهة فقط — لا يُرسل');await page.locator('input[name=phone]').fill('01000000000');await page.locator('textarea[name=address]').fill('عنوان اختبار واجهة فقط. لا يتم إنشاء طلب ولا يتم الشحن.');
  for(const width of [320,360,375,390,414,430,768,1024,1280,1440,1920]){await page.setViewportSize({width,height:390});await bounds(page);const rectangle=await page.locator('.ws-cart').evaluate(element=>{const r=element.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:innerWidth,height:innerHeight};});assert.ok(rectangle.left>=-1&&rectangle.right<=rectangle.width+1&&rectangle.top>=-1&&rectangle.bottom<=rectangle.height+1);}
  await page.setViewportSize({width:390,height:844});await page.locator('.ws-checkout-review').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,`${engine}-${language}-checkout-not-submitted.png`)});
  await page.getByRole('button',{name:language==='ar'?'إغلاق':'Close',exact:true}).click();await page.getByRole('button',{name:language==='ar'?/حقيبة التسوق/:/Shopping bag/}).click();await page.getByRole('button',{name:language==='ar'?'المتابعة لإتمام الطلب':'Continue to checkout',exact:true}).click();await expect(page.locator('input[name=name]')).toHaveValue('اختبار واجهة فقط — لا يُرسل');
  await page.getByRole('button',{name:language==='ar'?'إغلاق':'Close',exact:true}).click();await page.goto(`${site}/s/${encodeURIComponent(slug)}/my-orders`,{waitUntil:'networkidle'});await bounds(page);await expect(page.locator('body')).toContainText(language==='ar'?'طلباتي':'My orders');
  assert.deepEqual(errors,[]);assert.deepEqual(writes.filter(r=>r.path.endsWith('/orders')),[],'No order submission may even be attempted');
  const value={engine,language,status:'PASS',store:slug,configuredCheckoutMode:store.checkoutMode,orderRequests:0,blockedOtherWrites:writes,optimizedImageResponses:images.filter((image,index,all)=>all.findIndex(other=>JSON.stringify(other)===JSON.stringify(image))===index)};results.push(value);console.log({engine,language,status:'PASS',orderRequests:0,checkoutMode:store.checkoutMode});fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify({site,verifiedAt:new Date().toISOString(),readOnly:true,results},null,2));await context.close();
 }}finally{await browser.close();}
}
})().catch(error=>{console.error(error);process.exitCode=1;});
