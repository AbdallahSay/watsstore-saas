import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const site=process.env.E2E_SITE_URL || 'http://localhost:3001';
if (new URL(site).hostname!=='localhost') throw new Error('This fixture audit must use localhost.');
const fixture=JSON.parse(fs.readFileSync(path.join(root,'work/e2e-fixtures.json')))[0];
const store=await fetch(`http://localhost:5000/api/public/stores/${fixture.slug}`).then(r=>r.json());
const method=process.env.LIGHTHOUSE_METHOD || 'simulate';
const output=path.join(root,'work/transformation',method==='simulate'?'lighthouse':'lighthouse-'+method);fs.mkdirSync(output,{recursive:true});
const reports=[];
for(const [name,route]of [['landing','/'],['store',`/s/${fixture.slug}`],['product',`/s/${fixture.slug}/p/${encodeURIComponent(store.products[0].slug)}`]]) {
  if (process.env.LIGHTHOUSE_PAGE && process.env.LIGHTHOUSE_PAGE !== name) continue;
  for(let repeat=1;repeat<=Number(process.env.LIGHTHOUSE_REPEATS || 3);repeat++) {
    const chrome=await launch({chromePath:process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',chromeFlags:['--headless','--no-sandbox']});
    try {
      const result=await lighthouse(site+route,{port:chrome.port,output:['json','html'],onlyCategories:['performance','accessibility'],logLevel:'error'},{extends:'lighthouse:default',settings:{formFactor:'mobile',screenEmulation:{mobile:true,width:390,height:844,deviceScaleFactor:1,disabled:false},throttlingMethod:method}});
      for(const [index,extension]of ['json','html'].entries())fs.writeFileSync(path.join(output,`${name}-${repeat}.${extension}`),result.report[index]);
      const lhr=result.lhr;
      const summary={page:name,repeat,performance:lhr.categories.performance.score*100,accessibility:lhr.categories.accessibility.score*100,lcp:lhr.audits['largest-contentful-paint'].numericValue,cls:lhr.audits['cumulative-layout-shift'].numericValue,failedAccessibility:lhr.categories.accessibility.auditRefs.map(r=>lhr.audits[r.id]).filter(a=>a.score!==null&&a.score<1).map(a=>({id:a.id,title:a.title,details:a.details?.items}))};
      reports.push(summary);console.log(JSON.stringify({...summary,failedAccessibility:summary.failedAccessibility.map(a=>a.id)}));
      fs.writeFileSync(path.join(output,'summary.json'),JSON.stringify(reports,null,2));
    }finally{await chrome.kill();}
  }
}
