/* Public app shell only. Never cache API traffic, POSTs, admin or Google sign-in. */
const SHELL='netiv-shell-20261109d',MODEL='netiv-model-20261109b';
const APP=['./index.html','./1-idle-kiosk.html','./idle-test.html','./config.js','./fixes.css','./4-pwa.js','./5-idle-main.js','./3-manifest.webmanifest','./1-icon-192.png','./2-icon-512.png','./1-he303-v2-readonly.json'];
const ASSETS=['./24-model-00.bin', './25-model-01.bin', './26-model-02.bin', './27-model-03.bin', './28-model-04.bin', './29-model-05.bin', './30-wasm-00.bin', './31-wasm-01.bin', './32-wasm-02.bin', './33-wasm-03.bin', './34-wasm-04.bin', './35-wasm-05.bin', './36-transformers.min.js', './37-ort-wasm-simd-threaded.jsep.mjs', './38-config.json', './39-tokenizer.json', './40-tokenizer_config.json', './44-search-assets.json', './45-search-loader.js'];
const root=new URL('./',self.location.href);
const urls=APP.map(p=>new URL(p,root).href);
const modelUrls=ASSETS.map(p=>new URL(p,root).href);
self.addEventListener('install',e=>e.waitUntil(Promise.all([caches.open(SHELL).then(c=>c.addAll(urls)),caches.open(MODEL).then(c=>c.addAll(modelUrls))])));
// Do not replace an open session mid-search or mid-save. Activate on the next full launch.
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('netiv-')&&![SHELL,MODEL].includes(k))await caches.delete(k);await self.clients.claim()})()));
self.addEventListener('fetch',e=>{
 const r=e.request,u=new URL(r.url);if(r.method!=='GET')return;
 const key=u.origin+(u.origin===root.origin&&u.pathname===root.pathname?root.pathname+'index.html':u.pathname);
 if(u.origin===root.origin&&urls.includes(key)){
  e.respondWith((async()=>{const c=await caches.open(SHELL);try{const res=await fetch(r);if(res.ok)await c.put(key,res.clone());return res}catch(err){const hit=await c.match(key);if(hit)return hit;throw err}})());return;
 }
 const model=modelUrls.includes(u.origin+u.pathname)||(u.hostname==='cdn.jsdelivr.net'&&u.pathname.includes('/@huggingface/transformers@3.7.6'))||((u.hostname==='huggingface.co'||u.hostname.endsWith('.huggingface.co')||u.hostname==='cdn-lfs.huggingface.co')&&u.pathname.includes('all-MiniLM-L6-v2'));
 if(model){e.respondWith((async()=>{const c=await caches.open(MODEL),hit=await c.match(r);if(hit)return hit;const res=await fetch(r);if(res.ok&&res.type!=='opaque')await c.put(r,res.clone());return res})())}
});
