(()=>{
 let banner;
 function get(){if(banner)return banner;banner=document.createElement('div');banner.id='connection-status';banner.setAttribute('role','status');banner.style.cssText='position:fixed;z-index:30;bottom:12px;left:12px;right:12px;max-width:700px;margin:auto;padding:12px 16px;border:1px solid #d8b56d;border-radius:12px;background:#fff5d9;color:#554215;font:14px/1.5 Arial,sans-serif;box-shadow:0 4px 20px #0002';document.body.append(banner);return banner}
 window.KioskConnection={cached(t){const b=get();b.hidden=false;b.textContent='Offline or connection unavailable. Showing a saved catalog'+(t?' from '+new Date(t).toLocaleString():'')+'. Copy counts may be out of date. Admin saves and book requests need internet.'},live(){if(banner)banner.hidden=true}};
 addEventListener('offline',()=>window.KioskConnection.cached());
 if('serviceWorker' in navigator&&isSecureContext){navigator.serviceWorker.register('./6-sw.js',{updateViaCache:'none'}).then(r=>{r.update().catch(()=>{});if(navigator.storage?.persist)navigator.storage.persist().catch(()=>{})}).catch(()=>{})}
})();

// Display-only owner request. Catalog and source records are not modified.
(()=>{const s=document.createElement("style");s.id="hide-source-displays";s.textContent=".book-body > details, main > footer > details {display:none!important}";document.head.appendChild(s);})();
