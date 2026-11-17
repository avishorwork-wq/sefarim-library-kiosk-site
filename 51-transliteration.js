/* Search-only sound keys. Catalog fields are never changed. */
(function(root){
'use strict';
// v2: fully automatic. No per-name exception list: every Hebrew title/author
// word, including gershayim acronyms (ריטב"א, מהרש"א, חתם סופר), is matched by
// consonant skeletons generated from the letters, so any vowel reading
// (ritva/ritvah/ritba) and new books work with no manual step.
const FINALS={'ך':'כ','ם':'מ','ן':'נ','ף':'פ','ץ':'צ'};
const LETTERS={'א':'','ב':'b','ג':'g','ד':'d','ה':'h','ו':'w','ז':'z','ח':'k','ט':'t','י':'','כ':'k','ל':'l','מ':'m','נ':'n','ס':'s','ע':'','פ':'p','צ':'c','ק':'k','ר':'r','ש':'s','ת':'t'};
const PREFIXES='והלבכמש';
function words(s){return String(s||'').normalize('NFKD').replace(/\p{Mn}/gu,'').toLowerCase().replace(/["'״׳’`]/g,'').replace(/[ךםןףץ]/g,c=>FINALS[c]).match(/[א-ת]+|[a-z]+/g)||[]}
function compact(s){return s.replace(/(.)\1+/g,'$1')}
function keyForms(raw){
 // Keep both the trailing-h and stripped form (משנה ~ mishna/mishnah).
 const out=new Set([raw]);
 if(raw.endsWith('h')&&raw.length>=2)out.add(raw.slice(0,-1));
 return out;
}
function hebrewKeys(word){
 const forms=[word];
 // Attached Hebrew articles/prepositions (one or two letters); original kept.
 if(word.length>=4&&PREFIXES.includes(word[0]))forms.push(word.slice(1));
 if(word.length>=5&&PREFIXES.includes(word[0])&&PREFIXES.includes(word[1]))forms.push(word.slice(2));
 const out=new Set();
 for(const form of forms){
  const base=[...form].map(c=>LETTERS[c]||'').join('');
  for(const w of [base.replace(/w/g,''),base.replace(/w/g,'b')]){
   for(const k of keyForms(compact(w)))out.add(k);
   // Interior ה is often silent in English spelling (בהעלותך ~ baaloscha).
   if(w.includes('h'))for(const k of keyForms(compact(w.replace(/h/g,''))))out.add(k);
  }
  // צ is spelled tz/ts and sometimes z (Zion, Chutz); ת final is often s (Shabbos, Ketzos).
  for(const k of [...out]){
   if(k.includes('c'))out.add(k.replace(/c/g,'z'));
   if(k.endsWith('t'))out.add(k.slice(0,-1)+'s');
  }
 }
 out.delete('');return out;
}
const LATIN_PREFIXES=['sha','she','ha','he','ve','va','ba','be','bi','la','le','li','ka','ke','ki','ma','me','mi'];
function latinKeys(word){
 // ch/kh/h, tz/ts/z, v/b/w, f/ph, th/t, doubled consonants and vowel spellings share keys.
 const base=word.replace(/(?:tch|sch|sh)/g,'s').replace(/(?:ch|kh)/g,'k').replace(/(?:tz|ts)/g,'C').replace(/ph/g,'p').replace(/th/g,'t').replace(/[cq]/g,'k').replace(/x/g,'ks').replace(/[vf]/g,c=>c==='v'?'b':'p').replace(/[aeiouy]/g,'').replace(/C/g,'c');
 const out=new Set(keyForms(compact(base)));
 // h stands for ח in spellings like hasid/hassid; w and z drift too.
 if(base.includes('h'))for(const k of keyForms(compact(base.replace(/h/g,'k'))))out.add(k);
 if(base.includes('w')){for(const k of keyForms(compact(base.replace(/w/g,'b'))))out.add(k);for(const k of keyForms(compact(base.replace(/w/g,''))))out.add(k)}
 if(base.includes('z'))for(const k of keyForms(compact(base.replace(/z/g,'c'))))out.add(k);
 if(base.includes('j'))for(const k of keyForms(compact(base.replace(/j/g,'g'))))out.add(k);
 for(const p of LATIN_PREFIXES)if(word.startsWith(p)&&base.length-p.length+1>=3){const stripped=compact(base.slice(1));if(stripped.length>=2)out.add(stripped);break}
 out.delete('');return out;
}
function baseSkeleton(w){return compact([...w].map(c=>LETTERS[c]||'').join('').replace(/w/g,''))}
function build(title,author){
 const raw=String(title||'')+' '+String(author||'');
 return words(raw).filter(w=>/[א-ת]/.test(w)).map(w=>({word:w,keys:hebrewKeys(w),base:baseSkeleton(w)}));
}
const LATIN_CACHE=new Map();
function cachedLatinKeys(w){let k=LATIN_CACHE.get(w);if(!k){k=latinKeys(w);LATIN_CACHE.set(w,k)}return k}
function evidence(query,doc){
 if(!/^[a-z\s'"’`-]+$/i.test(query))return 0;
 const ws=words(query).filter(w=>!['the','of','by','ha','he'].includes(w));if(!ws.length||ws.length>9||!doc.length)return 0;
 const choices=ws.map(w=>{
  const keys=cachedLatinKeys(w);const minLength=2;
  return doc.map((target,j)=>[j,[...keys].some(k=>k.length>=minLength&&target.keys.has(k))]).filter(x=>x[1]).map(x=>x[0]);
 });
 if(choices.some(c=>!c.length)){
  // Fused short-word names (בן איש חי ~ ben ish chai): compare joined skeletons.
  const qcat=compact(ws.map(w=>[...cachedLatinKeys(w)][0]||'').join(''));
  const dcats=new Set();for(const t of doc)if(t.base)dcats.add(t.base);
  const dcat=compact(doc.map(t=>t.base||'').join(''));
  if(qcat.length>=4&&(dcat===qcat||dcat.includes(qcat)))return .9;
  return 0;
 }
 // Match each query word to a different title/author word.
 choices.sort((a,b)=>a.length-b.length);const used=new Set();function assign(i){if(i===choices.length)return true;for(const j of choices[i])if(!used.has(j)){used.add(j);if(assign(i+1))return true;used.delete(j)}return false}
 return assign(0)?.92:0;
}
// Cheap runtime confidence check: can every significant Hebrew word of this
// entry be reached from some Latin spelling, and can the entry be found at all?
// Entries that fail are reported so an override can be added by Instinct.
function unconfident(title,author){
 const doc=build(title,author).filter(t=>t.word.length>=2);
 if(!doc.length)return null; // no Hebrew words: nothing to check
 const weak=doc.filter(t=>![...t.keys].some(k=>k.length>=2)).map(t=>t.word);
 if(weak.length)return {reason:'word_without_latin_key',words:weak};
 const strong=doc.filter(t=>[...t.keys].some(k=>k.length>=3));
 if(doc.length===1&&!strong.length)return {reason:'single_short_word_only',words:[doc[0].word]};
 if(!strong.length&&doc.length<2)return {reason:'no_strong_key',words:doc.map(t=>t.word)};
 return null;
}
root.KioskTransliteration={build,evidence,unconfident,latinKeys,hebrewKeys,version:'v2-auto'};
})(typeof window==='undefined'?globalThis:window);
