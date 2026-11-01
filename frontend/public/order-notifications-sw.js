/* No fetch handler: never cache customer pages, order tokens or API responses. */
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
const labels={Confirmed:'المتجر أكّد طلبك.',Preparing:'طلبك بيتجهّز.',Shipped:'طلبك اتشحن.',Delivered:'طلبك اتسلّم.',Cancelled:'طلبك اتلغى.',Rejected:'المتجر رفض الطلب.'};
function database(){return new Promise((resolve,reject)=>{const request=indexedDB.open('ws-push-events',1);request.onupgradeneeded=()=>request.result.createObjectStore('events',{keyPath:'id'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
self.addEventListener('push',event=>event.waitUntil((async()=>{
  let data;try{data=event.data.json();}catch{return;}
  if(!/^[a-f0-9]{32}$/.test(data.eventId)||!labels[data.status])return;
  const url=new URL(data.url,self.location.origin);
  if(url.origin!==self.location.origin||!/^\/s\/[^/]+\/my-orders$/.test(url.pathname)||url.search||url.hash)return;
  const db=await database();
  const claimed=await new Promise((resolve,reject)=>{const tx=db.transaction('events','readwrite');const store=tx.objectStore('events');const get=store.get(data.eventId);let fresh=false;get.onsuccess=()=>{if(!get.result){fresh=true;store.put({id:data.eventId,at:Date.now()});}};tx.oncomplete=()=>resolve(fresh);tx.onerror=()=>reject(tx.error);});
  if(!claimed){db.close();return;}
  try{await self.registration.showNotification('تحديث طلبك · WatsStore',{body:labels[data.status],tag:'ws-'+data.eventId,renotify:false,data:{url:url.pathname},dir:'rtl',lang:'ar'});}
  catch(error){const tx=db.transaction('events','readwrite');tx.objectStore('events').delete(data.eventId);throw error;}
  finally{db.close();}
})()));
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil((async()=>{
    const url=new URL(event.notification.data?.url||'/',self.location.origin);
    if(url.origin!==self.location.origin||!/^\/s\/[^/]+\/my-orders$/.test(url.pathname)||url.search||url.hash)return;
    const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    const existing=clients.find(client=>new URL(client.url).origin===url.origin&&new URL(client.url).pathname===url.pathname);
    if(existing)return existing.focus();
    return self.clients.openWindow(url.href);
  })());
});
