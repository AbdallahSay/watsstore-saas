import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const site=process.env.E2E_SITE_URL || 'http://localhost:3001';
if (new URL(site).hostname!=='localhost') throw new Error('This fixture audit must use localhost.');
const fixture=JSON.parse(fs.readFileSync(path.join(root,'work/e2e-fixtures.json')))[0];
const store=await fetch(`http://localhost:5000/api/public/stores/${fixture.slug}`).then(r=>r.json());
const product=store.products.find(p=>p.id===fixture.productId);
if(!product)throw new Error('The dedicated measurement product is missing.');
const commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const method=process.env.LIGHTHOUSE_METHOD || 'simulate';
const output=path.join(root,'work/transformation',method==='simulate'?'lighthouse':'lighthouse-'+method);fs.mkdirSync(output,{recursive:true});
const reports=[];
for(const [name,route]of [['landing','/'],['store',`/s/${fixture.slug}`],['product',`/s/${fixture.slug}/p/${encodeURIComponent(product.slug)}`]]) {
  if (process.env.LIGHTHOUSE_PAGE && process.env.LIGHTHOUSE_PAGE !== name) continue;
  for(let repeat=1;repeat<=Number(process.env.LIGHTHOUSE_REPEATS || 3);repeat++) {
    const chrome=await launch({chromePath:process.env.CHROME_PATH || (process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':'/usr/bin/google-chrome'),chromeFlags:['--headless','--no-sandbox']});
    try {
      const result=await lighthouse(site+route,{port:chrome.port,output:['json','html'],onlyCategories:['performance','accessibility'],logLevel:'error'},{extends:'lighthouse:default',settings:{formFactor:'mobile',screenEmulation:{mobile:true,width:390,height:844,deviceScaleFactor:1,disabled:false},throttlingMethod:method}});
      for(const [index,extension]of ['json','html'].entries())fs.writeFileSync(path.join(output,`${name}-${repeat}.${extension}`),result.report[index]);
      const lhr=result.lhr;
      const summary={page:name,repeat,commit,throttlingMethod:method,throttling:lhr.configSettings.throttling,performance:lhr.categories.performance.score*100,accessibility:lhr.categories.accessibility.score*100,lcp:lhr.audits['largest-contentful-paint'].numericValue,cls:lhr.audits['cumulative-layout-shift'].numericValue,tbt:lhr.audits['total-blocking-time'].numericValue,failedAccessibility:lhr.categories.accessibility.auditRefs.map(r=>lhr.audits[r.id]).filter(a=>a.score!==null&&a.score<1).map(a=>({id:a.id,title:a.title,details:a.details?.items}))};
      reports.push(summary);console.log(JSON.stringify({...summary,failedAccessibility:summary.failedAccessibility.map(a=>a.id)}));
      fs.writeFileSync(path.join(output,'summary.json'),JSON.stringify(reports,null,2));
    }finally{await chrome.kill();}
  }
}
