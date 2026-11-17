/* Search-only sound keys. Catalog fields are never changed. */
(function(root){
'use strict';
// Word-level exceptions for conventional acronym pronunciations, not book aliases.
const ACRONYMS={ritva:'ריטבא',rashba:'רשבא',ramban:'רמבן',rambam:'רמבם',rashbam:'רשבם',rashi:'רשי',rosh:'ראש',ran:'רן',rif:'ריף',maharal:'מהרל',maharsha:'מהרשא',maharam:'מהרם',gra:'גרא',vilna:'וילנא',chaim:'חיים',chayim:'חיים',haim:'חיים',hayim:'חיים'};
const FINALS={'ך':'כ','ם':'מ','ן':'נ','ף':'פ','ץ':'צ'};
const LETTERS={'א':'','ב':'b','ג':'g','ד':'d','ה':'h','ו':'w','ז':'z','ח':'k','ט':'t','י':'','כ':'k','ל':'l','מ':'m','נ':'n','ס':'s','ע':'','פ':'p','צ':'c','ק':'k','ר':'r','ש':'s','ת':'t'};
function words(s){return String(s||'').normalize('NFKD').replace(/\p{Mn}/gu,'').toLowerCase().replace(/["'״׳’`]/g,'').replace(/[ךםןףץ]/g,c=>FINALS[c]).match(/[א-ת]+|[a-z]+/g)||[]}
function compact(s){return s.replace(/(.)\1+/g,'$1').replace(/h$/,'')}
function hebrewKeys(word){
 const forms=[word];
 // Attached Hebrew articles/prepositions; retain the original too.
 if(word.length>=4&&'הולבכמ'.includes(word[0]))forms.push(word.slice(1));
 if(word.length>=5&&word[0]==='ו'&&'הלבכמ'.includes(word[1]))forms.push(word.slice(2));
 const out=new Set();for(const form of forms){const key=[...form].map(c=>LETTERS[c]||'').join('');out.add(compact(key.replace(/w/g,'')));out.add(compact(key.replace(/w/g,'b')))}for(const k of [...out])if(k.endsWith('t'))out.add(k.slice(0,-1)+'s');return out;
}
function latinKeys(word){
 // ch/kh, tz/ts, v/b, f/ph, ai/ei and doubled consonants share keys.
 const base=word.replace(/(?:tch|sch|sh)/g,'s').replace(/(?:ch|kh)/g,'k').replace(/(?:tz|ts)/g,'C').replace(/ph/g,'p').replace(/th/g,'t').replace(/[cq]/g,'k').replace(/[vf]/g,c=>c==='v'?'b':'p').replace(/[aeiouy]/g,'').replace(/C/g,'c');
 const out=new Set([compact(base)]);
 if(word.startsWith('ha')&&word.length>=5)out.add(compact(base.slice(1)));
 const conventional=ACRONYMS[word.replace(/h$/,'')]||ACRONYMS[word];
 if(conventional)for(const key of hebrewKeys(conventional))out.add(key);
 return out;
}
function build(title,author){
 const raw=String(title||'')+' '+String(author||'');
 const acronyms=new Set((raw.match(/[א-ת]+["״][א-ת]+/g)||[]).flatMap(words));
 return words(raw).filter(w=>/[א-ת]/.test(w)).map(w=>({word:w,keys:acronyms.has(w)?new Set():hebrewKeys(w)}));
}
function unprefixed(w){const forms=[w];if(w.length>=3&&'הולבכמ'.includes(w[0]))forms.push(w.slice(1));return forms}

function evidence(query,doc){
 if(!/^[a-z\s'"’`-]+$/i.test(query))return 0;
 const ws=words(query).filter(w=>!['the','of','by'].includes(w));if(!ws.length||ws.length>9||!doc.length)return 0;
 const choices=ws.map(w=>{
 const name=w.replace(/^ha(?=.{3})/,'');
 const conventional=ACRONYMS[name.replace(/h$/,'')]||ACRONYMS[name];
 if(conventional)return doc.map((target,j)=>[j,unprefixed(target.word).includes(words(conventional)[0])]).filter(x=>x[1]).map(x=>x[0]);
 const keys=latinKeys(w);const minLength=ws.length>1?2:3;
 return doc.map((target,j)=>[j,[...keys].some(k=>k.length>=minLength&&target.keys.has(k))]).filter(x=>x[1]).map(x=>x[0]);
 });
 if(choices.some(c=>!c.length))return 0;
 // Match each query word to a different title/author word.
 choices.sort((a,b)=>a.length-b.length);const used=new Set();function assign(i){if(i===choices.length)return true;for(const j of choices[i])if(!used.has(j)){used.add(j);if(assign(i+1))return true;used.delete(j)}return false}
 return assign(0)?.92:0;
}
root.KioskTransliteration={build,evidence};
})(typeof window==='undefined'?globalThis:window);
