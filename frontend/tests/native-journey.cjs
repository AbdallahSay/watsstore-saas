const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,firefox,webkit,expect}=require('@playwright/test');
const root=path.resolve(__dirname,'../..'),site=process.env.E2E_SITE_URL||'http://localhost:3001',api=process.env.E2E_API_URL||'http://localhost:5000/api';
assert.equal(new URL(site).hostname,'localhost');assert.equal(new URL(api).hostname,'localhost');
const fixtures=JSON.parse(fs.readFileSync(path.join(root,'work/e2e-fixtures.json'),'utf8')),out=path.join(root,'work/transformation/journey');fs.mkdirSync(out,{recursive:true});
async function json(route,token,method='GET',body){const response=await fetch(api+route,{method,headers:{...(token?{Authorization:`Bearer ${token}`} : {}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});assert.equal(response.status,200,`${method} ${route}`);return response.json();}
async function bounds(page){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'No document overflow');}
async function checkoutBounds(page){const original=page.viewportSize();for(const width of [320,344,360,375,390,393,412,414,430,480,540,600,768,820,1024,1280,1440,1920])for(const height of [844,390]){await page.setViewportSize({width,height});await bounds(page);const rectangle=await page.locator('.ws-cart').evaluate(element=>{const r=element.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:innerWidth,height:innerHeight};});await expect.poll(async()=>{const r=await page.locator('.ws-cart').boundingBox();return !!r&&r.x>=-1&&r.y>=-1&&r.x+r.width<=width+1&&r.y+r.height<=height+1;},{message:`Checkout fits ${width}x${height}; initial bounds ${JSON.stringify(rectangle)}`}).toBe(true);}await page.setViewportSize(original);}
(async()=>{const report=[];for(const engine of (process.env.AUDIT_ENGINES||'chrome,firefox,webkit').split(',')){
 const browser=engine==='chrome'?await chromium.launch({channel:'chrome'}):await {firefox,webkit}[engine].launch();
 try{for(const [index,fixture]of ['editorial-luxe','street-pulse','pure-beauty','tech-grid','fresh-market','living-space','golden-atelier','active-motion','little-joy','crafted-story'].map((theme,i)=>({...fixtures[i%fixtures.length],theme})).entries()){
  const settingsBefore=await json('/merchant/commerce/settings',fixture.token);
  await json('/merchant/commerce/settings',fixture.token,'PUT',{...settingsBefore,draftTheme:fixture.theme});
  await json('/merchant/commerce/theme/publish',fixture.token,'POST');
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,...(engine==='firefox'?{}:{isMobile:true}),reducedMotion:'reduce'});
  await context.addInitScript(()=>{localStorage.setItem('watsstore_lang','en');localStorage.setItem('watsstore_theme','light');});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const store=await json(`/public/stores/${fixture.slug}`),product=store.products.find(p=>p.id===fixture.productId);
  const before=await json('/merchant/orders',fixture.token),stockBefore=(await json('/merchant/commerce/inventory',fixture.token)).find(s=>s.productId===product.id).quantity;
  await page.goto(site+`/s/${fixture.slug}`,{waitUntil:'networkidle'});await expect(page.locator('.ws-storefront')).toHaveAttribute('data-theme',fixture.theme);
  await page.getByRole('searchbox',{name:'Search products'}).fill('no matching technical test');await expect(page.getByRole('heading',{name:'No matching products'})).toBeVisible();
  await page.getByRole('button',{name:'Reset filters'}).click();await page.getByLabel('In stock',{exact:true}).check();
  await page.getByLabel('Search products').fill(product.name);await page.getByLabel('Sort by').selectOption('price-up');
  await page.locator('.ws-product-page-link').first().click();await expect(page.locator('#product-title')).toHaveText(product.name);await bounds(page);
  await page.getByRole('button',{name:'L',exact:true}).click();await page.getByLabel('Quantity',{exact:true}).fill('2');
  await page.screenshot({path:path.join(out,`${engine}-${fixture.theme}-product.png`)});
  await page.getByRole('button',{name:'Add to bag',exact:true}).click();await expect(page.locator('.ws-cart')).toBeVisible();await checkoutBounds(page);await page.getByRole('button',{name:'Close',exact:true}).click();
  await page.reload({waitUntil:'networkidle'});await page.getByRole('button',{name:/Shopping bag/}).click();await expect(page.locator('.ws-cart-items')).toContainText('L');await expect(page.locator('.ws-quantity span')).toHaveText('2');
  await page.getByRole('button',{name:'Decrease quantity'}).click();await expect(page.locator('.ws-quantity span')).toHaveText('1');
  await page.getByRole('button',{name:'Continue to checkout'}).click();
  await page.getByLabel('Full name',{exact:true}).fill('Isolated native journey');await page.getByLabel('Egyptian mobile number').fill('01000000000');await page.getByLabel('Delivery address',{exact:true}).fill('Technical isolated address. Do not ship.');await page.getByLabel('Governorate & delivery zone').selectOption('cairo');
  await expect(page.getByRole('combobox',{name:'Payment method',exact:true})).toHaveValue('cod');await checkoutBounds(page);
  // Hold the actual response after committing once; the browser must freeze and replay its original key.
  let original,committed;const loseResponse=engine==='chrome'&&index===0;
  if(loseResponse)await page.route('**/orders',async route=>{if(route.request().method()!=='POST'){await route.continue();return;}original=route.request().postDataJSON();const response=await route.fetch();assert.equal(response.status(),200);committed=await response.json();await route.abort('failed');await page.unroute('**/orders');});
  const confirmed=page.waitForResponse(r=>r.request().method()==='POST'&&r.url().endsWith('/orders')&&r.status()===200);confirmed.catch(()=>{});
  await page.getByRole('button',{name:'Place order',exact:true}).click();
  if(loseResponse){await expect(page.locator('.ws-error')).toBeVisible();await expect(page.getByLabel('Full name',{exact:true})).toHaveValue('Isolated native journey');assert.ok(committed.orderId);assert.equal((await json('/merchant/orders',fixture.token)).total,before.total+1);await page.screenshot({path:path.join(out,`${engine}-uncertain.png`)});await page.reload({waitUntil:'networkidle'});await page.getByRole('button',{name:/Shopping bag/}).click();const replay=page.waitForRequest(r=>r.method()==='POST'&&r.url().endsWith('/orders'));await page.getByRole('button',{name:'Check the same order again'}).click();assert.deepEqual((await replay).postDataJSON(),original);}
  const created=await(await confirmed).json();await expect(page.locator('.ws-confirmation')).toBeVisible();
  const snapshot=await json(`/public/stores/${fixture.slug}/orders/track/${created.trackingToken}`);assert.equal(snapshot.items[0].quantity,1);assert.equal(snapshot.items[0].selectedVariants['المقاس'],'L');
  assert.equal((await json('/merchant/orders',fixture.token)).total,before.total+1);assert.equal((await json('/merchant/commerce/inventory',fixture.token)).find(s=>s.productId===product.id).quantity,stockBefore-1);
  await checkoutBounds(page);await page.screenshot({path:path.join(out,`${engine}-${fixture.theme}-confirmation.png`)});
  await page.goto(site+`/s/${fixture.slug}/my-orders`,{waitUntil:'networkidle'});await expect(page.locator(`a[href="/s/${fixture.slug}/orders/${created.trackingToken}"]`)).toBeVisible();
  const trackingPath=`/public/stores/${fixture.slug}/orders/track/${created.trackingToken}`;
  const tracking=await json(trackingPath);for(const key of ['customerPhone','customerAddress','customerName','customerNotes'])assert.equal(tracking[key],undefined);
  const foreign=await fetch(api+`/merchant/orders/${created.orderId}`,{headers:{Authorization:`Bearer ${fixtures[(index+1)%fixtures.length].token}`}});assert.equal(foreign.status,403);assert.ok(!(await foreign.text()).includes('Isolated native journey'));
  await context.addInitScript(f=>{localStorage.setItem('watsstore_merchant_token',f.token);localStorage.setItem('watsstore_user',JSON.stringify(f.user));},fixture);
  await page.goto(site+`/dashboard/orders/${created.orderId}`,{waitUntil:'networkidle'});await page.locator('button[data-status=Confirmed]').click();await expect(page.getByRole('status')).toContainText(/Order updated(?: to Confirmed)?\./);await expect.poll(async()=>(await json(`/merchant/orders/${created.orderId}`,fixture.token)).status).toBe('Confirmed');
  await page.goto(site+`/s/${fixture.slug}/orders/${created.trackingToken}`,{waitUntil:'networkidle'});await expect(page.locator('body')).toContainText('Your order was confirmed');
  await page.setViewportSize({width:844,height:390});await bounds(page);await page.screenshot({path:path.join(out,`${engine}-${fixture.theme}-tracking-landscape.png`)});
  await page.setViewportSize({width:390,height:844});await page.goto(site+`/s/${fixture.slug}/p/${encodeURIComponent(product.slug)}`,{waitUntil:'networkidle'});await page.getByRole('button',{name:'Buy now',exact:true}).click();await expect(page.locator('.ws-checkout-form')).toBeVisible();await expect(page.getByRole('button',{name:'Continue to checkout'})).toHaveCount(0);await page.getByLabel('Full name',{exact:true}).fill('Preserved local input');await page.getByRole('button',{name:'Close',exact:true}).click();await page.getByRole('button',{name:/Shopping bag/}).click();await page.getByRole('button',{name:'Continue to checkout'}).click();await expect(page.getByLabel('Full name',{exact:true})).toHaveValue('Preserved local input');
  assert.deepEqual(errors,[]);report.push({engine,theme:fixture.theme,status:'PASS',orderNumber:created.orderNumber,lostResponseReplay:loseResponse});fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify(report,null,2));console.log(report.at(-1));await context.close();await json('/merchant/commerce/theme/restore',fixture.token,'POST');await json('/merchant/commerce/settings',fixture.token,'PUT',settingsBefore);
 }}catch(error){for(const page of await Promise.all(browser.contexts().map(async context=>context.pages())).then(pages=>pages.flat())){await page.screenshot({path:path.join(out,`${engine}-failure.png`)}).catch(()=>{});console.error({engine,url:page.url(),body:(await page.locator('body').innerText().catch(()=>'' )).slice(0,1200)});}throw error;}finally{await browser.close();}
}})().catch(error=>{console.error(error);process.exitCode=1;});

