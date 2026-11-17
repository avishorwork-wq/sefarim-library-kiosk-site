(()=>{
 let banner;
 function get(){if(banner)return banner;banner=document.createElement('div');banner.id='connection-status';banner.setAttribute('role','status');banner.style.cssText='position:fixed;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;opacity:0;pointer-events:none';document.body.append(banner);return banner}
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

// Display-only totals for merged records, same or different shelves. Never alter catalog data.
(()=>{
 function total(text){
  const parts=text.replace(/ \(separate records\)$/,'').split('; ');
  if(parts.length<2)return null;
  const entries=parts.map(p=>p.match(/^(.+): (\d+)$/));
  if(entries.some(e=>!e)||entries.some(e=>e[1].trim()==='Shelf not recorded'))return null;
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
