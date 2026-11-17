const assert=require('node:assert/strict');
require('../51-transliteration.js');
const T=globalThis.KioskTransliteration;
const match=(q,t,a='')=>T.evidence(q,T.build(t,a))>0;
for(const q of ['ritva','ritvah','haritva'])assert(match(q,'חידושי הריטב"א'));
for(const q of ['chidushei haritva','khidushei haritvah'])assert(match(q,'חידושי הריטב"א'));
for(const q of ['mishna berura','mishnah berurah','mishneh berura'])assert(match(q,'משנה ברורה'));
for(const q of ['kitzur shulchan aruch','kitsur shulkhan arukh'])assert(match(q,'קיצור שולחן ערוך'));
for(const q of ['chovot halevavot','chovos halevavos'])assert(match(q,'חובות הלבבות'));
for(const q of ['beit halevi','bait halevi','beis halevi','beit halebi'])assert(match(q,'בית הלוי'));
for(const q of ['shaarei teshuva','shaarei teshuvah','shaarei teshuvah'])assert(match(q,'שערי תשובה'));
assert(match('ramban','חידושי הרמב"ן'));assert(!match('ramban','הלכות החגים הרב צבי רימון'));
assert(match('rashi','פירושי רש"י'));assert(!match('rashi','שו"ת הרא"ש'));
assert(!match('shabbat','שו"ת הרמב"ם'));assert(!match('chair','מקור חיים'));
assert(!match('chidushei haritva','חידושי הרשב"א'));
assert(match('meorot hatorah','מאורות התורה')); // Unlisted title works without an alias.
assert(match('yaakov kohen','ספר חדש','יעקב כהן')); // Author text is automatic too.
const entry={title:'מאורות התורה',author:'יעקב כהן',quantity:3,location:'42',topic:'x',subtopic:'y'};
const before=JSON.stringify(entry);T.build(entry.title,entry.author);assert.equal(JSON.stringify(entry),before);
console.log('Transliteration checks passed');
