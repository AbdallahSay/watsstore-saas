import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import puppeteer from 'puppeteer-core';
import {startFlow} from 'lighthouse';
const root=path.resolve(import.meta.dirname,'../..'),site=process.env.E2E_SITE_URL||'http://localhost:3001',api='http://localhost:5000/api';
if(new URL(site).hostname!=='localhost')throw Error('Isolated localhost only');
const f=JSON.parse(fs.readFileSync(path.join(root,'work/e2e-fixtures.json')))[0],store=await fetch(api+'/public/stores/'+f.slug).then(r=>r.json()),p=store.products.find(p=>p.id===f.productId),simple=store.products.find(p=>!p.variantsJson);
const res=await fetch(api+'/public/stores/'+f.slug+'/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({channel:'online',idempotencyKey:crypto.randomUUID(),customerName:'Isolated performance fixture',customerPhone:'01000000000',customerAddress:'Isolated test only. Do not ship.',paymentMethod:'cod',items:[{productId:simple.id,quantity:1,selectedVariants:{}}]})});if(!res.ok)throw Error('Isolated tracking fixture creation failed: '+res.status);const order=await res.json();
const results=[],out=path.join(root,'work/transformation/phase05');fs.mkdirSync(out,{recursive:true});
const repeats=Number(process.env.PHASE05_PERF_REPEATS||3),methods=(process.env.PHASE05_PERF_METHODS||'devtools,simulate').split(',');
for(const method of methods)for(let repeat=1;repeat<=repeats;repeat++){
 const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
 try{const page=await browser.newPage();await page.evaluateOnNewDocument(f=>{localStorage.setItem('watsstore_lang','en');localStorage.setItem('watsstore_theme','light');localStorage.setItem('watsstore_merchant_token',f.token);localStorage.setItem('watsstore_user',JSON.stringify(f.user))},f);
 const flow=await startFlow(page,{config:{extends:'lighthouse:default',settings:{onlyCategories:['performance','accessibility'],formFactor:'mobile',screenEmulation:{mobile:true,width:390,height:844,deviceScaleFactor:1,disabled:false},throttlingMethod:method,disableStorageReset:true}}});
 for(const [name,route]of [['landing','/'],['dashboard','/dashboard/setup'],['store','/s/'+f.slug],['product','/s/'+f.slug+'/p/'+encodeURIComponent(p.slug)],['tracking','/s/'+f.slug+'/orders/'+order.trackingToken]])await flow.navigate(site+route,{stepName:name});
 await page.goto(site+'/s/'+f.slug+'/p/'+encodeURIComponent(p.slug),{waitUntil:'networkidle0'});
 await flow.startTimespan({stepName:'cart-opening'});await page.locator('button[type=submit].ws-primary-action').click();await page.waitForSelector('.ws-cart');await flow.endTimespan();await flow.snapshot({stepName:'cart-accessibility'});
 await flow.startTimespan({stepName:'checkout-opening'});await page.locator('button').filter(element=>element.textContent?.includes('Continue to checkout')).click();await page.waitForSelector('.ws-checkout-form');await flow.endTimespan();await flow.snapshot({stepName:'checkout-accessibility'});
 const result=await flow.createFlowResult();for(const step of result.steps){const lhr=step.lhr;const value={page:step.name,repeat,method,mode:lhr.gatherMode,performance:lhr.categories.performance?.score==null?null:lhr.categories.performance.score*100,accessibility:lhr.categories.accessibility?.score==null?null:lhr.categories.accessibility.score*100,lcp:lhr.audits['largest-contentful-paint']?.numericValue??null,cls:lhr.audits['cumulative-layout-shift']?.numericValue??null,tbt:lhr.audits['total-blocking-time']?.numericValue??null,viewport:{width:390,height:844,dpr:1},throttling:lhr.configSettings.throttling,failedAccessibility:(lhr.categories.accessibility?.auditRefs||[]).map(a=>lhr.audits[a.id]).filter(a=>a.score!==null&&a.score<1).map(a=>a.id)};results.push(value);console.log(value.page,method,repeat,value.lcp,value.accessibility)}
 // Only allowlisted numeric summaries are retained. No auth headers, bodies or private URLs in artifacts.
 fs.writeFileSync(path.join(out,'performance.json'),JSON.stringify({isolated:true,fieldINP:null,results},null,2));
 }finally{await browser.close()}
}
