const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require('@playwright/test');
const root=path.resolve(__dirname,'../..'),site=process.env.E2E_SITE_URL||'http://localhost:3001';
assert.equal(new URL(site).hostname,'localhost');
const fixture=JSON.parse(fs.readFileSync(path.join(root,'work/e2e-fixtures.json')))[0],out=path.join(root,'work/transformation/phase05');fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'chrome'}),report=[];try{for(const appearance of ['light','dark'])for(const language of ['ar','en']){
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});await context.addInitScript(({fixture,appearance,language})=>{localStorage.setItem('watsstore_theme',appearance);localStorage.setItem('watsstore_lang',language);localStorage.setItem('watsstore_merchant_token',fixture.token);localStorage.setItem('watsstore_user',JSON.stringify(fixture.user))},{fixture,appearance,language});const page=await context.newPage();
 for(const [name,route,selector]of [['setup','/dashboard/setup','.merchant-setup'],['register','/register','form'],['studio','/dashboard/themes','main'],['products','/dashboard/products','main'],...['editorial-luxe','street-pulse','pure-beauty','tech-grid','fresh-market','living-space','golden-atelier','active-motion','little-joy','crafted-story'].map(id=>['store-'+id,`/s/${fixture.slug}?theme=${id}`,'.ws-storefront'])]){
  await page.goto(site+route,{waitUntil:'networkidle'});await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  const results=await page.evaluate(async selector=>window.axe.run(document.querySelector(selector),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}),selector);
  const violations=results.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}));
  report.push({name,appearance,language,violations,incomplete:results.incomplete.map(v=>({id:v.id,nodes:v.nodes.length}))});fs.writeFileSync(path.join(out,'accessibility.json'),JSON.stringify(report,null,2));console.log(name,appearance,language,violations.map(v=>v.id));
 }
 await context.close();
}}finally{await browser.close()}assert.deepEqual(report.filter(r=>r.violations.length).map(r=>({name:r.name,appearance:r.appearance,language:r.language,violations:r.violations.map(v=>v.id)})),[],'WCAG violations must be resolved, never skipped');})().catch(e=>{console.error(e);process.exitCode=1});
