// Wide test of v2 transliteration against the real Hebrew catalog + invented entries.
import fs from 'node:fs';
import './51-transliteration.js';
const T = globalThis.KioskTransliteration;

const he = JSON.parse(fs.readFileSync('1-he303-v2-readonly.json', 'utf8')).catalog;

// --- 1. Hand-written conventional English spellings -> expected Hebrew substring in title/author ---
const FAMOUS = [
  ['ritva', 'ריטב'], ['ritvah', 'ריטב'], ['rashba', 'רשב'], ['ramban', 'רמבן'], ['rambam', 'רמבם'],
  ['rashi', 'רשי'], ['rif', 'ריף'], ['rosh', 'ראש'], ['ran', 'רן'],
  ['maharsha', 'מהרש'], ['maharal', 'מהרל'], ['chofetz chaim', 'חפץ חיים'], ['chafetz chaim', 'חפץ חיים'],
  ['mishna berura', 'משנה ברורה'], ['mishnah berurah', 'משנה ברורה'],
  ['kitzur shulchan aruch', 'קיצור שלחן ערוך'], ['kitsur shulkhan arukh', 'קיצור'],
  ['shulchan aruch', 'שלחן ערוך'], ['shulkhan arukh', 'שלחן ערוך'],
  ['chidushei haritva', 'ריטב'], ['khidushei haritvah', 'ריטב'],
  ['shaarei teshuva', 'שערי תשובה'], ['chovot halevavot', 'חובת הלבבות'], ['chovos halevavos', 'חובות'],
  ['mesillat yesharim', 'מסילת ישרים'], ['mesilas yesharim', 'מסילת'],
  ['shmirat einayim', 'שמירת עינים'], 
  ['tehillim', 'תהילים'], ['tehilim', 'תהילים'], ['zohar', 'זוהר'], ['tanya', 'תניא'],
  ['yalkut yosef', 'ילקוט יוסף'], ['kaf hachaim', 'כף החיים'], ['kaf hachayim', 'כף החיים'],
  ['ben ish chai', 'בן איש חי'], ['aruch hashulchan', 'ערוך השלחן'],
  ['bava kama', 'בבא קמא'], ['bava metzia', 'בבא מציעא'], ['berachot', 'ברכות'], ['berachos', 'ברכות'],
  ['shabbat', 'שבת'], ['shabbos', 'שבת'], ['yevamot', 'יבמות'], ['ketubot', 'כתובות'],
  ['sanhedrin', 'סנהדרין'], ['niddah', 'נדה'], ['nida', 'נדה'], ['chullin', 'חולין'],
  ['yerushalmi', 'ירושלמי'], ['bavli', 'בבלי'], ['rishonim', 'ראשונים'], ['acharonim', 'אחרונים'],
  ['halacha', 'הלכה'], ['halachos', 'הלכות'], ['aggada', 'אגדה'], ['kabbalah', 'קבלה'],
  ['musar', 'מוסר'], ['mussar', 'מוסר'], ['chassidut', 'חסידות'], ['hasidut', 'חסידות'],
  ['responsa', null], ['shut', 'שות'], ['chidushim', 'חידושים'], ['chiddushim', 'חידושים'],
];


const stripG = s => String(s||'').replace(/["'\u05F4\u05F3]/g,'');
const visible = he.filter(e=>!e.hidden);
const visibleText = visible.map(e=>stripG((e.title||'')+' '+(e.author||'')));

function docText(entry) { return (entry.title || '') + ' ' + (entry.author || ''); }

// Build docs once.
const docs = he.map(e => T.build(e.title, e.author));

let pass = 0, skip = 0, fail = [];
for (const [q, expected] of FAMOUS) {
  if (expected !== null && !visibleText.some(x => x.includes(stripG(expected)))) { skip++; continue; }
  const hits = [];
  for (let i = 0; i < he.length; i++) {
    if (he[i].hidden) continue;
    if (T.evidence(q, docs[i])) hits.push(he[i]);
  }
  const ok = expected === null ? true : hits.some(h => stripG(docText(h)).includes(stripG(expected)));
  if (ok && (expected === null || hits.length)) pass++;
  else fail.push({ q, expected, hits: hits.slice(0, 3).map(h => h.title) });
}
console.log(`FAMOUS: ${pass} pass, ${fail.length} fail, ${skip} skipped (book not in catalog)`);
for (const f of fail) console.log('  FAIL', JSON.stringify(f));

// --- 2. Auto-generated spelling variants for every visible Hebrew entry ---
// Independent conventional transliterator with common variants (vowels included).
const V = {
  'א': ['a', 'e', 'i', 'o', ''], 'ב': ['b', 'v'], 'ג': ['g'], 'ד': ['d'], 'ה': ['h', ''],
  'ו': ['o', 'u', 'v', ''], 'ז': ['z'], 'ח': ['ch', 'kh', 'h'], 'ט': ['t'],
  'י': ['i', 'y', 'e', ''], 'כ': ['k', 'ch', 'kh'], 'ל': ['l'], 'מ': ['m'],
  'נ': ['n'], 'ס': ['s'], 'ע': ['a', 'e', 'i', ''], 'פ': ['p', 'f'], 'צ': ['tz', 'ts', 'z'],
  'ק': ['k', 'q'], 'ר': ['r'], 'ש': ['sh', 's'], 'ת': ['t', 'th', 's'],
  'ך': ['ch', 'kh'], 'ם': ['m'], 'ן': ['n'], 'ף': ['f'], 'ץ': ['tz', 'ts'],
};
function hebWords(s) {
  return String(s || '').normalize('NFKD').replace(/\p{Mn}/gu, '').replace(/["'״׳’`]/g, '')
    .replace(/[ךםןףץ]/g, c => ({ 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' }[c])).match(/[א-ת]+/g) || [];
}
function* variants(word, cap) {
  // Deterministic pseudo-random walk through the variant space.
  let n = 0;
  const seen = new Set();
  let seed = [...word].reduce((a, c) => a * 31 + c.codePointAt(0), 7) >>> 0;
  const rnd = () => (seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32;
  let guard = 0;
  while (n < cap && guard++ < 300) {
    let out = '';
    for (const ch of word) {
      const opts = V[ch] || [''];
      out += opts[Math.floor(rnd() * opts.length)];
    }
    // random final h
    if (rnd() < 0.3) out += 'h';
    out = out.replace(/\s+/g, '');
    if (out.length >= 2 && !seen.has(out)) { seen.add(out); n++; yield out.toLowerCase(); }
  }
}

let entriesTested = 0, entriesOk = 0, entriesFail = [];
let wordTotal = 0, wordOk = 0;
for (let i = 0; i < he.length; i++) {
  const e = he[i];
  if (e.hidden) continue;
  const twords = hebWords(e.title).filter(w => w.length >= 2);
  if (!twords.length) continue;
  entriesTested++;
  // Build a query from up to 3 title words, each in a random English spelling.
  const chosen = twords.slice(0, 3);
  const varLists = chosen.map(w => [...variants(w, 6)]);
  let entryHits = false;
  for (let attempt = 0; attempt < 6 && !entryHits; attempt++) {
    const qparts = varLists.map(vs => vs[Math.min(attempt, vs.length - 1)]);
    const q = qparts.join(' ');
    if (T.evidence(q, docs[i])) entryHits = true;
  }
  // Per-word coverage via direct key intersection (fast, equivalent to a 2-word query match).
  for (const w of twords) {
    wordTotal++;
    const hk = T.hebrewKeys(w);
    let ok = false;
    for (const v of variants(w, 6)) {
      const lk = T.latinKeys(v);
      if ([...lk].some(k => k.length >= 2 && hk.has(k))) { ok = true; break; }
    }
    if (ok) wordOk++;
  }
  if (entryHits) entriesOk++;
  else entriesFail.push({ row: e.row, title: e.title, author: e.author });
}
console.log(`ENTRIES: ${entriesOk}/${entriesTested} findable from generated English spellings (${(100 * entriesOk / entriesTested).toFixed(1)}%)`);
console.log(`WORDS: ${wordOk}/${wordTotal} title words matchable (${(100 * wordOk / wordTotal).toFixed(1)}%)`);
console.log(`ENTRY FAILURES (${entriesFail.length}):`);
for (const f of entriesFail.slice(0, 40)) console.log('  row', f.row, JSON.stringify(f.title), '|', JSON.stringify(f.author || ''));

// --- 3. Invented future entries (not in catalog) ---
const NEW = [
  ['שו"ת מהרש"ם', 'maharsham'], ['שו"ת מהרש"ם', 'shut maharsham'],
  ['אגרות משה', 'igrot moshe'], ['אגרות משה', 'iggros moshe'], ['אגרות משה', 'igeros moshe'],
  ['חידושי הגרי"ז', 'griz'], ['חידושי הגרי"ז', 'chidushei hagriz'],
  ['שמירת שבת כהלכתה', 'shemirat shabbat kehilchata'], ['שמירת שבת כהלכתה', 'shemiras shabbos kehilchosoh'],
  ['פניני הלכה', 'peninei halacha'], ['פניני הלכה', 'peninei halakha'],
  ['חתם סופר', 'chatam sofer'], ['חתם סופר', 'chasam sofer'],
  ['נודע ביהודה', 'noda biyhudah'], ['נודע ביהודה', 'nodah beyehudah'],
  ['אבני נזר', 'avnei nezer'], ['אבני נזר', 'avney nezer'],
  ['שבות יעקב', 'shevut yaakov'], ['שבות יעקב', 'shvus yaakov'],
  ['רד"ק', 'radak'], ['רמח"ל', 'ramchal'], ['מהרי"ט', 'maharit'],
  ['ערוך השולחן', 'aruch hashulchan'], ['ערוך השולחן', 'arukh hashulkhan'],
  ['כסף משנה', 'kesef mishneh'], ['כסף משנה', 'kessef mishne'],
  ['ביאור הלכה', 'biur halacha'], ['ביאור הלכה', 'biur halakha'],
  ['תורה תמימה', 'torah temimah'], ['תורה תמימה', 'torah tmima'],
  ['אור לציון', 'or letzion'], ['אור לציון', 'or lezion'],
  ['דברי יואל', 'divrei yoel'], ['ויואל משה', 'vayoel moshe'],
  ['שערי שבועה', 'shaarei shevua'], ['קול התורה', 'kol hatorah'],
];
let nPass = 0; const nFail = [];
for (const [title, q] of NEW) {
  const d = T.build(title, '');
  if (T.evidence(q, d)) nPass++;
  else nFail.push({ title, q });
}
console.log(`INVENTED: ${nPass}/${NEW.length} pass`);
for (const f of nFail) console.log('  FAIL', JSON.stringify(f));

// --- 4. Unconfident scan of the live catalog ---
let unc = 0;
for (const e of he) {
  if (e.hidden) continue;
  const u = T.unconfident(e.title, e.author);
  if (u) { unc++; if (unc <= 20) console.log('UNCONFIDENT row', e.row, JSON.stringify(e.title), u.reason, u.words.join(',')); }
}
console.log('UNCONFIDENT total:', unc);
