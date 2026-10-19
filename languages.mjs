// Danish remains the original/off mode. All target metadata is trusted application data.
export const SOURCE_LANGUAGE = Object.freeze({code:'da', tag:'da', nativeName:'Dansk', englishName:'Danish', direction:'ltr'});
const rows = [
  ['en','en','English','English'],
  ['zh','zh-Hans','中文','Simplified Chinese'],
  ['ar','ar','العربية','Arabic','rtl'],
  ['az','az','Azərbaycanca','Azerbaijani'],
  ['be','be','Беларуская','Belarusian'],
  ['bg','bg','Български','Bulgarian'],
  ['br','br','Brezhoneg','Breton'],
  ['bs','bs','Bosanski','Bosnian'],
  ['ca','ca','Català','Catalan'],
  ['cnr','cnr-Latn','Crnogorski','Montenegrin in Latin script'],
  ['cs','cs','Čeština','Czech'],
  ['cy','cy','Cymraeg','Welsh'],
  ['de','de','Deutsch','German'],
  ['el','el','Ελληνικά','Greek'],
  ['es','es','Español','Spanish'],
  ['et','et','Eesti','Estonian'],
  ['eu','eu','Euskara','Basque'],
  ['fi','fi','Suomi','Finnish'],
  ['fo','fo','Føroyskt','Faroese'],
  ['fr','fr','Français','French'],
  ['ga','ga','Gaeilge','Irish'],
  ['gd','gd','Gàidhlig','Scottish Gaelic'],
  ['gl','gl','Galego','Galician'],
  ['hr','hr','Hrvatski','Croatian'],
  ['hu','hu','Magyar','Hungarian'],
  ['hy','hy','Հայերեն','Armenian'],
  ['is','is','Íslenska','Icelandic'],
  ['it','it','Italiano','Italian'],
  ['ja','ja','日本語','Japanese'],
  ['ka','ka','ქართული','Georgian'],
  ['ko','ko','한국어','Korean'],
  ['lb','lb','Lëtzebuergesch','Luxembourgish'],
  ['lt','lt','Lietuvių','Lithuanian'],
  ['lv','lv','Latviešu','Latvian'],
  ['mk','mk','Македонски','Macedonian'],
  ['mt','mt','Malti','Maltese'],
  ['nb','nb','Norsk bokmål','Norwegian Bokmål'],
  ['nl','nl','Nederlands','Dutch'],
  ['nn','nn','Norsk nynorsk','Norwegian Nynorsk'],
  ['oc','oc','Occitan','Occitan'],
  ['pl','pl','Polski','Polish'],
  ['pt','pt','Português','Portuguese'],
  ['rm','rm','Rumantsch','Romansh'],
  ['ro','ro','Română','Romanian'],
  ['ru','ru','Русский','Russian'],
  ['sco','sco','Scots','Scots'],
  ['se','se','Davvisámegiella','Northern Sami'],
  ['sk','sk','Slovenčina','Slovak'],
  ['sl','sl','Slovenščina','Slovenian'],
  ['sq','sq','Shqip','Albanian'],
  ['sr','sr-Cyrl','Српски','Serbian in Cyrillic script'],
  ['sv','sv','Svenska','Swedish'],
  ['tr','tr','Türkçe','Turkish'],
  ['uk','uk','Українська','Ukrainian']
];
export const TARGET_LANGUAGES=Object.freeze(rows.map(([code,tag,nativeName,englishName,direction='ltr'])=>Object.freeze({code,tag,nativeName,englishName,direction})));
const targets=new Map(TARGET_LANGUAGES.map(l=>[l.code,l]));
export function getTargetLanguage(code) { return targets.get(code) || null; }
export function getLanguage(code) { return code===SOURCE_LANGUAGE.code?SOURCE_LANGUAGE:getTargetLanguage(code); }
const normalize=text=>String(text).normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase().trim();
export function searchLanguages(query) {
  const terms=normalize(query).split(/\s+/).filter(Boolean);
  return TARGET_LANGUAGES.filter(l=>{const text=normalize(`${l.code} ${l.tag} ${l.nativeName} ${l.englishName}`);return terms.every(term=>text.includes(term));});
}
