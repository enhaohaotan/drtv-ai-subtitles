// Danish remains the original/off mode. All target metadata is trusted application data.
export const SOURCE_LANGUAGE = Object.freeze({code:'da', tag:'da', nativeName:'Dansk', englishName:'Danish', direction:'ltr'});
const rows = [
  ['zh','zh-Hans','中文','Simplified Chinese'],
  ['en','en','English','English'],
  ['sq','sq','Shqip','Albanian'],
  ['hy','hy','Հայերեն','Armenian'],
  ['az','az','Azərbaycanca','Azerbaijani'],
  ['eu','eu','Euskara','Basque'],
  ['be','be','Беларуская','Belarusian'],
  ['bs','bs','Bosanski','Bosnian'],
  ['br','br','Brezhoneg','Breton'],
  ['bg','bg','Български','Bulgarian'],
  ['ca','ca','Català','Catalan'],
  ['hr','hr','Hrvatski','Croatian'],
  ['cs','cs','Čeština','Czech'],
  ['nl','nl','Nederlands','Dutch'],
  ['et','et','Eesti','Estonian'],
  ['fo','fo','Føroyskt','Faroese'],
  ['fi','fi','Suomi','Finnish'],
  ['fr','fr','Français','French'],
  ['gl','gl','Galego','Galician'],
  ['ka','ka','ქართული','Georgian'],
  ['de','de','Deutsch','German'],
  ['el','el','Ελληνικά','Greek'],
  ['hu','hu','Magyar','Hungarian'],
  ['is','is','Íslenska','Icelandic'],
  ['ga','ga','Gaeilge','Irish'],
  ['it','it','Italiano','Italian'],
  ['lv','lv','Latviešu','Latvian'],
  ['lt','lt','Lietuvių','Lithuanian'],
  ['lb','lb','Lëtzebuergesch','Luxembourgish'],
  ['mk','mk','Македонски','Macedonian'],
  ['mt','mt','Malti','Maltese'],
  ['cnr','cnr-Latn','Crnogorski','Montenegrin in Latin script'],
  ['se','se','Davvisámegiella','Northern Sami'],
  ['nb','nb','Norsk bokmål','Norwegian Bokmål'],
  ['nn','nn','Norsk nynorsk','Norwegian Nynorsk'],
  ['oc','oc','Occitan','Occitan'],
  ['pl','pl','Polski','Polish'],
  ['pt','pt','Português','Portuguese'],
  ['ro','ro','Română','Romanian'],
  ['rm','rm','Rumantsch','Romansh'],
  ['ru','ru','Русский','Russian'],
  ['sco','sco','Scots','Scots'],
  ['gd','gd','Gàidhlig','Scottish Gaelic'],
  ['sr','sr-Cyrl','Српски','Serbian in Cyrillic script'],
  ['sk','sk','Slovenčina','Slovak'],
  ['sl','sl','Slovenščina','Slovenian'],
  ['es','es','Español','Spanish'],
  ['sv','sv','Svenska','Swedish'],
  ['tr','tr','Türkçe','Turkish'],
  ['uk','uk','Українська','Ukrainian'],
  ['cy','cy','Cymraeg','Welsh']
];
const frequent=['zh','en','de','fr','es','it','pt','nl','sv','nb','fi','pl','uk','ru'];
const rank=code=>{const i=frequent.indexOf(code);return i<0?frequent.length:i;};
export const TARGET_LANGUAGES=Object.freeze(rows.map(([code,tag,nativeName,englishName])=>Object.freeze({code,tag,nativeName,englishName,direction:'ltr'})).sort((a,b)=>rank(a.code)-rank(b.code)||a.englishName.localeCompare(b.englishName,'en')));
const targets=new Map(TARGET_LANGUAGES.map(l=>[l.code,l]));
export function getTargetLanguage(code) { return targets.get(code) || null; }
export function getLanguage(code) { return code===SOURCE_LANGUAGE.code?SOURCE_LANGUAGE:getTargetLanguage(code); }
const normalize=text=>String(text).normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase().trim();
export function searchLanguages(query) {
  const terms=normalize(query).split(/\s+/).filter(Boolean);
  return TARGET_LANGUAGES.filter(l=>{const text=normalize(`${l.code} ${l.tag} ${l.nativeName} ${l.englishName}`);return terms.every(term=>text.includes(term));});
}
