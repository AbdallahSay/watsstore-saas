const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(name) {
  const filename = path.join(__dirname, '../src/lib', `${name}.ts`);
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const module = {exports:{}};
  new Function('module','exports','require',output)(module,module.exports,id => id === './api-base' ? load('api-base') : require(id));
  return module.exports;
}

test('catalog and checkout share the live API default when Vercel has no public API variable', () => {
  const {resolveApiBaseUrl,PRODUCTION_API_URL} = load('api-base');
  assert.equal(resolveApiBaseUrl(undefined),'https://watsstore.runasp.net/api');
  assert.equal(resolveApiBaseUrl(''),PRODUCTION_API_URL);
  assert.equal(resolveApiBaseUrl(' https://watsstore.runasp.net/api/ '),PRODUCTION_API_URL);
  assert.equal(resolveApiBaseUrl('http://localhost:5000/api/'),'http://localhost:5000/api');
  assert.throws(()=>resolveApiBaseUrl('javascript:alert(1)'));
  assert.throws(()=>resolveApiBaseUrl('https://username:password@example.com/api'));
});

test('hosted builds reject a localhost or insecure API override', () => {
  const {spawnSync} = require('node:child_process');
  for(const url of ['http://localhost:5000/api','https://127.0.0.1/api','http://watsstore.runasp.net/api']) {
    const result=spawnSync(process.execPath,['-e',"require('./next.config.js')"],{cwd:path.join(__dirname,'..'),env:{...process.env,VERCEL:'1',NEXT_PUBLIC_API_URL:url},encoding:'utf8'});
    assert.notEqual(result.status,0);
    assert.match(result.stderr,/Hosted deployments require/);
  }
});

test('transport failures including Safari Load failed are localized and remain uncertain', async () => {
  const original=global.fetch;
  try {
    global.fetch=async()=>{throw new TypeError('Load failed');};
    const {commerceApi,CommerceApiError}=load('commerce-api');
    await assert.rejects(commerceApi('/public/stores/a9/orders',undefined,'POST',{}), e=>e instanceof CommerceApiError && e.uncertain && /قد يكون الطلب قد سُجّل/.test(e.message) && !e.message.includes('Load failed'));
  } finally {global.fetch=original;}
});

test('HTTP validation errors are readable; server errors and incomplete success preserve uncertainty', async () => {
  const original=global.fetch;
  try {
    const {commerceApi}=load('commerce-api');
    global.fetch=async()=>new Response(JSON.stringify({errors:{CustomerPhone:['رقم الهاتف غير صالح']}}),{status:400});
    await assert.rejects(commerceApi('/orders',undefined,'POST',{}),e=>e.status===400&&!e.uncertain&&e.message==='رقم الهاتف غير صالح');
    for(const status of [408,409,500,502,503]) {
      global.fetch=async()=>new Response('',{status});
      await assert.rejects(commerceApi('/orders',undefined,'POST',{}),e=>e.status===status&&e.uncertain);
    }
    global.fetch=async()=>new Response('{broken',{status:200});
    await assert.rejects(commerceApi('/orders',undefined,'POST',{}),e=>e.uncertain);
  } finally {global.fetch=original;}
});

test('checkout POST sends JSON to the configured API and refuses redirects; GET adds no JSON preflight header', async () => {
  const original=global.fetch;
  try {
    const calls=[];
    global.fetch=async(url,options)=>{calls.push({url,options});return new Response('{}',{status:200});};
    const {createOrder,commerceApi}=load('commerce-api');
    await createOrder('a9',{idempotencyKey:'same-key-for-retries'});
    assert.match(calls[0].url,/\/api\/public\/stores\/a9\/orders$/);
    assert.equal(calls[0].options.method,'POST');
    assert.equal(calls[0].options.redirect,'error');
    assert.equal(calls[0].options.headers['Content-Type'],'application/json');
    await commerceApi('/public/stores/a9');
    assert.equal(calls[1].options.headers['Content-Type'],undefined);
  } finally {global.fetch=original;}
});

const payload={customerName:'Test',customerPhone:'01000000000',customerAddress:'Test only',channel:'whatsapp',items:[{productId:'test-product',quantity:1,selectedVariants:{}}]};
test('an uncertain checkout freezes its original key and request across edits and reloads', () => {
  const {prepareCheckoutAttempt,readCheckoutAttempt}=load('checkout-attempt');
  const first=prepareCheckoutAttempt(payload,null,()=> 'a-dedicated-key-12345');
  const recovered=readCheckoutAttempt(JSON.stringify(first));
  const retry=prepareCheckoutAttempt({...payload,customerAddress:'Changed',items:[]},recovered,()=>assert.fail('must not generate a new key'));
  assert.deepEqual(retry,first);
  assert.equal(retry.payload.customerAddress,'Test only');
});
test('older saved checkout attempts remain replayable with their original idempotency key', () => {
  const {readCheckoutAttempt}=load('checkout-attempt');
  const recovered=readCheckoutAttempt(JSON.stringify({key:'original-key-1234567',hash:JSON.stringify(payload)}));
  assert.equal(recovered.key,'original-key-1234567');assert.equal(recovered.pending,true);assert.deepEqual(recovered.payload,payload);
  assert.equal(readCheckoutAttempt('{bad'),null);
});
test('a definitive validation rejection permits corrections; unchanged resubmission keeps its key', () => {
  const {prepareCheckoutAttempt}=load('checkout-attempt');
  const first=prepareCheckoutAttempt(payload,null,()=> 'original-key-1234567');first.pending=false;
  assert.equal(prepareCheckoutAttempt(payload,first,()=>assert.fail()).key,first.key);
  assert.equal(prepareCheckoutAttempt({...payload,customerAddress:'Corrected address'},first,()=> 'new-key-1234567890').key,'new-key-1234567890');
});
