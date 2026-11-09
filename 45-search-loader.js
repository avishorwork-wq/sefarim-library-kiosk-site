/* Exact pinned search assets, SHA-256 checked before use. No catalog or vector changes. */
window.loadPinnedSearchModel=async function(){
 const manifest=await fetch(new URL('./44-search-assets.json',location.href)).then(r=>{if(!r.ok)throw new Error('asset manifest unavailable');return r.json()});
 const verified=async(name)=>{
  const f=manifest.files[name];if(!f)throw new Error('unknown search asset');
  const r=await fetch(new URL(name,location.href));if(!r.ok)throw new Error('search asset unavailable');
  const b=await r.arrayBuffer();const h=[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(x=>x.toString(16).padStart(2,'0')).join('');
  if(h!==f.sha256||b.byteLength!==f.bytes)throw new Error('search asset verification failed');return new Uint8Array(b);
 };
 const combine=async(list,expected)=>{
  const chunks=await Promise.all(list.map(verified));const blob=new Blob(chunks);const b=await blob.arrayBuffer();
  const h=[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(x=>x.toString(16).padStart(2,'0')).join('');
  if(h!==expected)throw new Error('combined search asset verification failed');return new Uint8Array(b);
 };
 const wasm=await combine(manifest.wasm.parts,manifest.wasm.sha256);
 const mod=await import('./36-transformers.min.js');
 mod.env.backends.onnx.wasm.wasmPaths={mjs:new URL('./37-ort-wasm-simd-threaded.jsep.mjs',location.href).href};
 mod.env.backends.onnx.wasm.wasmBinary=wasm;
 mod.env.allowLocalModels=false;
 let model;
 const mapping={'config.json':'38-config.json','tokenizer.json':'39-tokenizer.json','tokenizer_config.json':'40-tokenizer_config.json'};
 mod.env.useCustomCache=true;
 mod.env.customCache={async match(request){
  const name=String(request.url||request).split('/').pop();
  if(name==='model_quantized.onnx'){
   model||=combine(manifest.model.parts,manifest.model.sha256);return new Response(await model);
  }
  if(mapping[name])return new Response(await verified(mapping[name]));return undefined;
 },async put(){}};
 return mod.pipeline('feature-extraction','Xenova/all-MiniLM-L6-v2',{dtype:'q8',revision:'751bff37182d3f1213fa05d7196b954e230abad9'});
};
