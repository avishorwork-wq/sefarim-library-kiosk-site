/* Authorized owner-forced reload. No credential in this public code. */
(function(root){
 'use strict';
 const KEY='kiosk-owner-reload-seen-v1';
 function accept(command,seen,now){
  if(!command||command.schema!==1||command.kind!=='force-reload'||typeof command.id!=='string'||!/^[0-9]+-[0-9]+$/.test(command.id))return false;
  const issued=Date.parse(command.issuedAt),until=Date.parse(command.expiresAt);
  return command.id!==seen&&Number.isFinite(issued)&&Number.isFinite(until)&&issued<=now+120000&&now<until&&until-issued>0&&until-issued<=600000;
 }
 if(typeof module==='object'&&module.exports){module.exports={accept};return;}
 const signal='https://raw.githubusercontent.com/avishorwork-wq/sefarim-library-kiosk-site/main/50-reload-signal.json';
 let busy=false;
 async function check(){
  if(busy||!navigator.onLine)return;
  busy=true;
  try{
   const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),10000);
   let response;try{response=await fetch(signal+'?check='+Date.now(),{cache:'no-store',credentials:'omit',signal:abort.signal})}finally{clearTimeout(timer)}
   if(!response.ok)return;
   const cmd=await response.json();
   // Trust the server Date when provided, not a badly set tablet clock.
   const server=Date.parse(response.headers.get('date')),now=Number.isFinite(server)?server:Date.now();
   const seen=sessionStorage.getItem(KEY);
   if(!accept(cmd,seen,now))return;
   sessionStorage.setItem(KEY,cmd.id); // mark before any navigation; each tab once
   // These overrides are deliberate: no idle, draft, calendar or visibility gate.
   // Do not restore prior nightly state after a forced command.
   sessionStorage.removeItem('kiosk-nightly-reload-v1-view');
   const reg=await navigator.serviceWorker?.getRegistration();
   if(reg)await Promise.race([reg.update().catch(()=>{}),new Promise(r=>setTimeout(r,5000))]);
   // Reload now. Do not force-activate a worker across other active pages.
   location.reload();
  }catch{/* Offline, refused storage or invalid signal: do not loop/reload. */}finally{busy=false}
 }
 setInterval(check,30000);addEventListener('online',check);addEventListener('focus',check);document.addEventListener('visibilitychange',check);check();
 root.KioskOwnerReload={check};
})(typeof window==='object'?window:globalThis);
