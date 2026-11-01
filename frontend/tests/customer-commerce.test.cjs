const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
function loader(){const cache={};return function load(name){if(cache[name])return cache[name];const module={exports:{}};cache[name]=module.exports;const source=fs.readFileSync(path.join(__dirname,'../src/lib',name+'.ts'),'utf8');const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function('module','exports','require',js)(module,module.exports,id=>id.startsWith('./')?load(id.slice(2)):require(id));return module.exports;};}
function browser(){const data=new Map();global.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};global.window={dispatchEvent:()=>{}};Object.defineProperty(global,'navigator',{value:{},configurable:true});return data;}
const token=n=>n.toString(16).padStart(64,'0');
test('device history is store scoped, bounded and preserves metadata on idempotent replay',()=>{
 browser();const lib=loader()('customer-orders');for(let n=1;n<=35;n++)lib.rememberDeviceOrder('a',token(n),n);
 assert.equal(lib.readDeviceOrders('a').length,30);assert.deepEqual(lib.readDeviceOrders('b'),[]);
 lib.updateDeviceOrder('a',token(35),{status:'Confirmed',unread:true,notifiedVersion:'event1'});
 const previous=lib.readDeviceOrders('a')[0];lib.rememberDeviceOrder('a',token(35),35);
 assert.deepEqual(lib.readDeviceOrders('a')[0],previous);assert.equal(lib.readDeviceOrders('a').length,30);
 lib.removeDeviceOrder('a',token(35));assert.equal(lib.readDeviceOrders('a').length,29);
});
test('corrupt and invalid browser history cannot create tracking references',()=>{
 browser();const {readDeviceOrders}=loader()('customer-orders');
 for(const value of ['{bad','null','{}',JSON.stringify([{token:token(1),number:1,createdAt:'bad'},{token:'javascript:alert(1)',number:2,createdAt:new Date().toISOString()}])]){localStorage.setItem('ws_customer_orders_a',value);assert.deepEqual(readDeviceOrders('a'),[]);}
});
test('foreground notifications require explicit opt in and permission; dedup survives module reload',async()=>{
 browser();let calls=0;global.Notification=class{static permission='granted';constructor(){calls++;}};window.Notification=Notification;
 let load=loader();load('customer-orders').rememberDeviceOrder('a',token(1),1);
 await load('foreground-notifications').notifyOrderChange('a',token(1),'Confirmed','v1',false);assert.equal(calls,0);
 localStorage.setItem('ws_foreground_a','enabled');Notification.permission='denied';
 await load('foreground-notifications').notifyOrderChange('a',token(1),'Confirmed','v1',false);assert.equal(calls,0);
 Notification.permission='granted';await load('foreground-notifications').notifyOrderChange('a',token(1),'Confirmed','v1',false);assert.equal(calls,1);
 load=loader();await load('foreground-notifications').notifyOrderChange('a',token(1),'Confirmed','v1',false);assert.equal(calls,1);
 await load('foreground-notifications').notifyOrderChange('b',token(1),'Confirmed','v2',false);assert.equal(calls,1);
 await load('foreground-notifications').notifyOrderChange('a',token(1),'Shipped','v2',false);assert.equal(calls,2);
});
test('terminal status semantics stop delivered, cancelled and rejected orders only',()=>{
 const {terminalOrder}=loader()('order-status');for(const status of ['Delivered','Cancelled','Rejected'])assert.equal(terminalOrder(status),true);
 for(const status of [undefined,'Pending','Confirmed','Preparing','Shipped'])assert.equal(terminalOrder(status),false);
});
test('mobile foreground alerts use a service worker when Notification construction is unsupported',async()=>{
 browser();let displayed=0;window.isSecureContext=true;global.Notification=class{static permission='granted';constructor(){throw new TypeError('Use a service worker');}};window.Notification=Notification;
 navigator.serviceWorker={register:async()=>{},ready:Promise.resolve({showNotification:async(title,options)=>{displayed++;assert.equal(options.data.url,'/s/a/my-orders');assert.ok(!JSON.stringify(options).includes(token(1)));}})};
 const load=loader();load('customer-orders').rememberDeviceOrder('a',token(1),1);localStorage.setItem('ws_foreground_a','enabled');
 await load('foreground-notifications').notifyOrderChange('a',token(1),'Confirmed','v1',false);assert.equal(displayed,1);
 await load('foreground-notifications').notifyOrderChange('a',token(1),'Confirmed','v1',false);assert.equal(displayed,1);
});
test('service worker deduplicates events and rejects private or cross-origin click URLs',async()=>{
 const vm=require('node:vm');const handlers={},events=new Map(),shown=[],opened=[];
 const db={close(){},transaction(){const tx={objectStore:()=>({get(id){const r={};setTimeout(()=>{r.result=events.get(id);r.onsuccess();tx.oncomplete();},0);return r;},put(value){events.set(value.id,value);},delete(id){events.delete(id);}})};return tx;}};
 const self={location:{origin:'https://store.example'},addEventListener:(type,fn)=>handlers[type]=fn,registration:{showNotification:async(title,options)=>shown.push(options)},clients:{matchAll:async()=>[],openWindow:async url=>opened.push(url)}};
 const indexedDB={open(){const r={result:db};setTimeout(()=>r.onsuccess(),0);return r;}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/order-notifications-sw.js'),'utf8'),{self,indexedDB,URL,Date,Promise});
 const send=async data=>{let pending;handlers.push({data:{json:()=>data},waitUntil:p=>pending=p});await pending;};
 const event={eventId:'a'.repeat(32),status:'Confirmed',url:'/s/a/my-orders'};
 await send(event);await send(event);assert.equal(shown.length,1);assert.equal(shown[0].data.url,'/s/a/my-orders');assert.ok(!JSON.stringify(shown).includes('trackingToken'));
 for(const url of ['https://evil.example/s/a/my-orders','/s/a/orders/'+'b'.repeat(64),'/s/a/my-orders?token=private'])await send({...event,eventId:'b'.repeat(32),url});assert.equal(shown.length,1);
 let pending;handlers.notificationclick({notification:{close(){},data:{url:'/s/a/my-orders'}},waitUntil:p=>pending=p});await pending;assert.deepEqual(opened,['https://store.example/s/a/my-orders']);
});
