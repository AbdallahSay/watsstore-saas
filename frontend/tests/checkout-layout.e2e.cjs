const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,expect}=require('@playwright/test');
const site=process.env.E2E_SITE_URL||'http://localhost:3002';
assert.equal(new URL(site).hostname,'localhost');
const root=path.resolve(__dirname,'../..'),fixture=JSON.parse(fs.readFileSync(path.join(root,'work/e2e-fixtures.json')))[0];
const themes=['editorial-luxe','street-pulse','pure-beauty','tech-grid','fresh-market','living-space','golden-atelier','active-motion','little-joy','crafted-story'];
const widths=[320,360,390,430,768,1024,1440],results=[];
(async()=>{const browser=await chromium.launch({channel:'chrome'});try{
for(const language of ['ar','en'])for(const theme of themes){
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 await context.addInitScript(language=>localStorage.setItem('watsstore_lang',language),language);
 // This geometry regression must never submit an order, even to the isolated API.
 await context.route('**/orders',route=>route.request().method()==='POST'?route.abort():route.continue());
 const page=await context.newPage();
 await page.goto(`${site}/s/${fixture.slug}?theme=${theme}`);
 await page.locator('.ws-product-info h3 a').first().click();
 await expect(page.locator('#product-title')).toBeVisible();
 await page.getByRole('button',{name:language==='ar'?'اشترِ الآن':'Buy now',exact:true}).click();
 await expect(page.locator('.ws-checkout-form')).toBeVisible();
 for(const width of widths){await page.setViewportSize({width,height:844});
 const issues=await page.locator('.ws-checkout-fields').evaluateAll(fields=>fields.flatMap(field=>{
  const errors=[],labels=[...field.querySelectorAll(':scope > label')];
  let previousBottom=-Infinity;
  for(const label of labels){const control=label.querySelector('input,select,textarea');if(!control)continue;
   const r=label.getBoundingClientRect(),c=control.getBoundingClientRect();
   const text=[...label.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());
   if(text){const range=document.createRange();range.selectNode(text);const t=range.getBoundingClientRect();if(t.bottom>c.top+1)errors.push('label/control overlap');}
   if(r.top<previousBottom-1)errors.push('adjacent fields overlap');previousBottom=r.bottom;
   if(c.left<0||c.right>innerWidth+1||c.width<100)errors.push('field outside viewport');
  }return errors;
 }));assert.deepEqual(issues,[],`${theme}/${language}/${width}`);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 results.push({theme,language,width,passed:true});}
 if(theme==='street-pulse'){const out=path.join(root,'work/release-evidence');fs.mkdirSync(out,{recursive:true});await page.setViewportSize({width:390,height:844});await page.locator('#checkout-customer').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,`${language}-checkout.png`)});}
 await context.close();console.log(`${theme}/${language}: 7 widths PASS`);
}
fs.mkdirSync(path.join(root,'work/release-evidence'),{recursive:true});fs.writeFileSync(path.join(root,'work/release-evidence/checkout-layout.json'),JSON.stringify({isolated:true,orderSubmissions:0,results},null,2));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
