(()=>{
 let banner;
 function get(){if(banner)return banner;banner=document.createElement('div');banner.id='connection-status';banner.setAttribute('role','status');banner.style.cssText='position:fixed;z-index:30;bottom:12px;left:12px;right:12px;max-width:700px;margin:auto;padding:12px 16px;border:1px solid #d8b56d;border-radius:12px;background:#fff5d9;color:#554215;font:14px/1.5 Arial,sans-serif;box-shadow:0 4px 20px #0002';document.body.append(banner);return banner}
 window.KioskConnection={cached(t){const b=get();b.hidden=false;b.textContent='Offline or connection unavailable. Showing a saved catalog'+(t?' from '+new Date(t).toLocaleString():'')+'. Copy counts may be out of date. Admin saves and book requests need internet.'},live(){if(banner)banner.hidden=true}};
 addEventListener('offline',()=>window.KioskConnection.cached());
 if('serviceWorker' in navigator&&isSecureContext){navigator.serviceWorker.register('./6-sw.js',{updateViaCache:'none'}).then(r=>{r.update().catch(()=>{});if(navigator.storage?.persist)navigator.storage.persist().catch(()=>{})}).catch(()=>{})}
})();

// Display-only owner request. Catalog and source records are not modified.
(()=>{const s=document.createElement("style");s.id="hide-source-displays";s.textContent=".book-body > details, main > footer > details, main > footer > p:has(> a[href$=\"46-THIRD-PARTY-NOTICES.txt\"]) {display:none!important}";document.head.appendChild(s);})();

// Load the nightly maintenance policy, separate from catalog code.
(()=>{const s=document.createElement("script");s.src="./48-nightly-reload.js";s.defer=true;document.head.append(s)})();

// Owner-forced reload signal, authenticated trigger lives in GitHub Actions.
(()=>{const s=document.createElement("script");s.src="./49-remote-reload.js";s.defer=true;document.head.append(s)})();

// Display-only totals for merged records on the same shelf. Never alter catalog data.
(()=>{
 function total(text){
  const parts=text.replace(/ \(separate records\)$/,'').split('; ');
  if(parts.length<2)return null;
  const entries=parts.map(p=>p.match(/^(.+): (\d+)$/));
  if(entries.some(e=>!e)||!entries.every(e=>e[1].trim()===entries[0][1].trim())||entries[0][1]==='Shelf not recorded')return null;
  const n=entries.reduce((sum,e)=>sum+Number(e[2]),0);
  return Number.isSafeInteger(n)?n:null;
 }
 function update(){
  for(const dt of document.querySelectorAll('article dl dt')){
   if(!['Copies by shelf','עותקים לפי מדף'].includes(dt.textContent.trim()))continue;
   const dd=dt.nextElementSibling;if(dd?.tagName!=='DD')continue;
   const n=total(dd.textContent.trim());if(n===null)continue;
   dt.textContent='Listed quantity';dd.textContent=String(n);
  }
 }
 let pending=false;
 new MutationObserver(()=>{if(!pending){pending=true;queueMicrotask(()=>{pending=false;update()})}}).observe(document.body,{subtree:true,childList:true,characterData:true});
 update();
 window.KioskQuantityDisplay={total};
})();
