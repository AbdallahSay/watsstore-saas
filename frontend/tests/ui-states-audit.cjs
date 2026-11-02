const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('@playwright/test');
const root=path.resolve(__dirname,'../..'),fixture=JSON.parse(fs.readFileSync(path.join(root,'work/e2e-fixtures.json'),'utf8'))[0],stage=process.env.AUDIT_STAGE||'before',site=process.env.E2E_SITE_URL||'http://localhost:3001';
assert.equal(new URL(site).hostname,'localhost');const output=path.join(root,'work/transformation',stage);fs.mkdirSync(output,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{for(const [name,route,button]of [['navigation','/',/فتح القائمة/],['merchant-navigation','/dashboard',/^القائمة$/],['product-editor','/dashboard/products',/إضافة منتج جديد/],['category-editor','/dashboard/categories',/إضافة قسم جديد/],['coupon-editor','/dashboard/coupons',/كوبون جديد|إضافة كوبون|إنشاء كوبون|إنشاء كود خصم جديد/]]){
const context=await browser.newContext({viewport:{width:390,height:900},reducedMotion:'reduce'});await context.addInitScript(f=>{localStorage.setItem('watsstore_lang','ar');localStorage.setItem('watsstore_theme','light');localStorage.setItem('watsstore_merchant_token',f.token);localStorage.setItem('watsstore_user',JSON.stringify(f.user));},fixture);const page=await context.newPage();await page.goto(site+route,{waitUntil:'networkidle'});const trigger=page.getByRole('button',{name:button}).first();await trigger.click();
if(stage==='after')await page.getByRole('dialog').waitFor();
for(const width of stage==='after'?[320,360,375,390,414,430,768,1024,1280,1440,1920]:[390])for(const height of [900,420]){
 // Navigation drawers only exist below their desktop breakpoint.
 if((name==='navigation'&&width>=1280)||(name==='merchant-navigation'&&width>=768))continue;
 await page.setViewportSize({width,height});await page.evaluate(async()=>{await document.fonts.ready;await Promise.all(document.getAnimations().filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));});
 if(stage==='after'){
  const dimensions=await page.getByRole('dialog').evaluate(element=>{const rect=element.getBoundingClientRect();return {left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom,overflow:document.documentElement.scrollWidth>innerWidth+1};});
  assert.ok(dimensions.left>=-1&&dimensions.right<=width+1&&dimensions.top>=-1&&dimensions.bottom<=height+1,`${name} stays inside ${width}x${height}`);assert.equal(dimensions.overflow,false);
  await page.keyboard.press('Tab');assert.equal(await page.getByRole('dialog').evaluate(element=>element.contains(document.activeElement)),true);
 }
 if([390,1440].includes(width))await page.screenshot({path:path.join(output,`chrome-ar-${name}-${width}x${height}.png`)});
}
if(stage==='after'){await page.setViewportSize({width:390,height:900});await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'detached'});assert.equal(await trigger.evaluate(element=>element===document.activeElement),true,'Focus returns to the trigger');if(['navigation','merchant-navigation'].includes(name)){await trigger.click();await page.setViewportSize({width:name==='navigation'?1280:844,height:390});await page.getByRole('dialog').waitFor({state:'detached'});assert.notEqual(await page.evaluate(()=>document.body.style.overflow),'hidden','Desktop/landscape resize releases the hidden drawer scroll lock');}}
console.log(stage+': captured and verified '+name);await context.close();}}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});

