/* Authorized owner-forced reload. No credential in this public code. */
(function(root){
 'use strict';
 const KEY='kiosk-owner-reload-seen-v1';
 function accept(command,seen,now){
  if(!command||command.schema!==1||command.kind!=='force-reload'||typeof command.id!=='string'||!/^[0-9]+-[0-9]+$/.test(command.id))return false;
  const issued=Date.parse(command.issuedAt),until=Date.parse(command.expiresAt);
  return command.id!==seen&&Number.isFinite(issued)&&Number.isFinite(until)&&issued<=now+120000&&now<until&&until-issued>0&&until-issued<=1800000;
 }
 if(typeof module==='object'&&module.exports){module.exports={accept};return;}
 // Same-origin Pages copy is fresh within about a minute of the workflow commit;
 // raw.githubusercontent.com can serve a stale copy for about 5 minutes.
 const signals=['./50-reload-signal.json','https://raw.githubusercontent.com/avishorwork-wq/sefarim-library-kiosk-site/main/50-reload-signal.json'];
 let busy=false;
 async function check(){
  if(busy||!navigator.onLine)return;
  busy=true;
  try{
   const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),10000);
   let response;try{
    for(const u of signals){response=await fetch(u+(u.includes('?')?'&':'?')+'check='+Date.now(),{cache:'no-store',credentials:'omit',signal:abort.signal});if(response.ok)break}
   }finally{clearTimeout(timer)}
   if(!response||!response.ok)return;
   const cmd=await response.json();
   // Trust the server Date when provided, not a badly set tablet clock.
   const server=Date.parse(response.headers.get('date')),now=Number.isFinite(server)?server:Date.now();
   const seen=sessionStorage.getItem(KEY);
   if(!accept(cmd,seen,now))return;
   sessionStorage.setItem(KEY,cmd.id); // mark before any navigation; each tab once
   // These overrides are deliberate: no idle, draft, calendar or visibility gate.
   // Do not restore prior nightly state after a forced command.
   sessionStorage.removeItem('kiosk-nightly-reload-v1-view');
   // Fire-and-forget: never await SW update before reloading. Awaiting it stalled
   // reloads for minutes in background tabs (throttled timers), and the shell
   // fetch handler is network-first so the reload picks up fresh files anyway.
   try{navigator.serviceWorker?.getRegistration().then(reg=>reg?.update().catch(()=>{})).catch(()=>{})}catch{}
   // Reload now. Do not force-activate a worker across other active pages.
   location.reload();
  }catch{/* Offline, refused storage or invalid signal: do not loop/reload. */}finally{busy=false}
 }
 setInterval(check,10000);addEventListener('online',check);addEventListener('focus',check);document.addEventListener('visibilitychange',check);check();
 root.KioskOwnerReload={check,version:'2026-11-11-fast2'};
})(typeof window==='object'?window:globalThis);
