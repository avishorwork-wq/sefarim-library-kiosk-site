/* Local review prototype. Jerusalem 03:00-04:00, calendar-safe, idle only. */
(function(root){
 'use strict';
 const zone='Asia/Jerusalem';
 function decision({now,calendar,lastDay,idleMs,online,visible,busy,storageOK}) {
  if(!calendar || calendar.error || calendar.locked || !Number.isFinite(now))return {ok:false,reason:'calendar'};
  const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23',weekday:'short'}).formatToParts(now).map(x=>[x.type,x.value]));
  const day=p.year+'-'+p.month+'-'+p.day;
  if(p.weekday==='Sat')return {ok:false,reason:'shabbos',day};
  if(p.hour!=='03')return {ok:false,reason:'outside-window',day};
  if(lastDay===day)return {ok:false,reason:'already-done',day};
  if(!online||!visible||busy||idleMs<120000||!storageOK)return {ok:false,reason:'deferred',day};
  return {ok:true,day};
 }
 if(typeof module==='object'&&module.exports){module.exports={decision};return;}
 const KEY='kiosk-nightly-reload-v1',STATE=KEY+'-view';
 let lastActivity=performance.now(),running=false;
 for(const type of ['pointerdown','keydown','touchstart','wheel','input'])addEventListener(type,()=>{lastActivity=performance.now()},{passive:true,capture:true});
 const read=key=>{try{return sessionStorage.getItem(key)}catch{return null}};
 function storageOK(){try{sessionStorage.setItem(KEY+'-probe','1');sessionStorage.removeItem(KEY+'-probe');return true}catch{return false}}
 function busy(){
  if(location.hash==='#admin'||window.__adminLoaded||document.querySelector('dialog[open]'))return true;
  if(document.querySelector('#query')?.value.trim())return true; // never discard an active search
  if(document.activeElement?.matches('input,textarea,select,[contenteditable=true]'))return true;
  for(const el of document.querySelectorAll('form:not(#search) input,form:not(#search) textarea'))if(el.value.trim())return true;
  return [...document.querySelectorAll('button')].some(b=>b.disabled&&/sending|saving/i.test(b.textContent));
 }
 function state(){return {language:window.KioskUI?.getLanguage?.(),scrollY,filters:Object.fromEntries(['library','topic','subtopic','location','browse-order'].map(id=>[id,document.getElementById(id)?.value]))}}
 function restore(){
  const raw=read(STATE);if(!raw)return;
  let s;try{s=JSON.parse(raw)}catch{return}
  if(Date.now()-s.savedAt>7200000)return;
  if(s.language){window.KioskUI?.setLanguage?.(s.language);document.querySelector('#language-start')?.close();}
  for(const [id,value] of Object.entries(s.filters||{})){const el=document.getElementById(id);if(el&&value!=null){el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}))}}
  scrollTo(0,s.scrollY||0);sessionStorage.removeItem(STATE);
 }
 async function tick(){
  if(running)return;
  const cal=window.KioskCalendarLock?.snapshot?.();
  const d=decision({now:cal?.now,calendar:cal,lastDay:read(KEY),idleMs:performance.now()-lastActivity,online:navigator.onLine,visible:!document.hidden,busy:busy(),storageOK:storageOK()});
  if(!d.ok)return;
  running=true;
  try{
   // Real same-origin connectivity check. No requests to catalog/admin APIs.
   const ac=new AbortController(),timer=setTimeout(()=>ac.abort(),8000);
   let response;try{response=await fetch('./config.js?clock=nightly-'+Date.now(),{method:'HEAD',cache:'no-store',signal:ac.signal})}finally{clearTimeout(timer)}
   if(!response.ok)return;
   const fresh=window.KioskCalendarLock?.snapshot?.();
   const again=decision({now:fresh?.now,calendar:fresh,lastDay:read(KEY),idleMs:performance.now()-lastActivity,online:navigator.onLine,visible:!document.hidden,busy:busy(),storageOK:storageOK()});
   if(!again.ok)return;
   const registration=await navigator.serviceWorker?.getRegistration();
   if(registration){await Promise.race([registration.update().catch(()=>{}),new Promise(r=>setTimeout(r,8000))])}
   // Recheck immediately before activation/reload. A new visitor cancels this night's attempt for now.
   const finalCal=window.KioskCalendarLock?.snapshot?.();
   const final=decision({now:finalCal?.now,calendar:finalCal,lastDay:read(KEY),idleMs:performance.now()-lastActivity,online:navigator.onLine,visible:!document.hidden,busy:busy(),storageOK:storageOK()});
   if(!final.ok)return;
   sessionStorage.setItem(STATE,JSON.stringify({...state(),savedAt:Date.now()}));
   sessionStorage.setItem(KEY,final.day); // set before navigation so reload cannot loop
   if(registration?.waiting){
    const allowed=await new Promise(resolve=>{
     const channel=new MessageChannel();let done=false,approved=false;
     const finish=()=>{if(done)return;done=true;channel.port1.close();navigator.serviceWorker.removeEventListener('controllerchange',finish);resolve(approved)};
     channel.port1.onmessage=e=>{approved=e.data?.allowed===true;if(!approved)finish()};
     navigator.serviceWorker.addEventListener('controllerchange',finish);
     registration.waiting.postMessage({type:'KIOSK_SAFE_NIGHTLY_ACTIVATE'},[channel.port2]);setTimeout(finish,4000);
    });
    if(!allowed){sessionStorage.removeItem(STATE);return;} // another open tab, or old worker: no forced activation
   }
   location.reload();
  }catch{/* no forced reload when verification/storage/network fails */}finally{running=false}
 }
 // Restore only after the library/language UI is available, never during an admin page.
 let restores=0;const restoreTimer=setInterval(()=>{if(window.KioskUI&&document.querySelector('#library:not([disabled])')){clearInterval(restoreTimer);if(location.hash!=='#admin')restore()}else if(++restores>120)clearInterval(restoreTimer)},500);
 setInterval(tick,30000);addEventListener('focus',tick);addEventListener('online',tick);document.addEventListener('visibilitychange',tick);
 root.KioskNightlyReload={check:tick,decision};
})(typeof window==='object'?window:globalThis);
