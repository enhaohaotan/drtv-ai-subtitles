import test from 'node:test';
import assert from 'node:assert/strict';
import {validateBatch,requestBody,parseResponse,selectBatch} from '../core.mjs';
const cues=Array.from({length:60},(_,i)=>({id:String(i),start:i*4,end:i*4+4,text:`Dansk ${i}`}));
const batch={language:'zh',title:'Episode',before:cues.slice(0,4),targets:cues.slice(4,16),after:cues.slice(16,28),memory:'Name: Mie'};
test('batch contains prior and following context but only 12 target IDs',()=>{const b=selectBatch(cues,16,new Map());assert.equal(b.targets.length,12);assert.equal(b.targets[0].id,'4');assert.equal(b.before.at(-1).id,'3');assert.equal(b.after[0].id,'16');});
test('seek skips old subtitle slots and cache excludes translated cues',()=>{const b=selectBatch(cues,100,new Map([['25','done']]));assert.equal(b.targets[0].id,'26');assert.ok(b.targets.every(c=>c.end>100));});
test('malformed payloads are rejected before API calls',()=>{assert.throws(()=>validateBatch({...batch,language:'xx-invalid'}));assert.throws(()=>validateBatch({...batch,targets:[cues[0],cues[0]]}));assert.throws(()=>validateBatch({...batch,after:[{...cues[0],end:0}]}));});
test('request includes context and strict structured output, no response storage',()=>{const body=requestBody(validateBatch(batch),'gpt-6-astra');assert.equal(body.store,false);assert.equal(body.text.format.strict,true);assert.equal(JSON.parse(body.input[0].content).memory,'Name: Mie');assert.equal(JSON.parse(body.input[0].content).after.length,12);});
const response=t=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({translations:t,continuity:'Mie'})}]}]});
test('response is matched by ID, not array order',()=>{const t=batch.targets.map(c=>({id:c.id,text:'Translated text'})).reverse();assert.deepEqual(parseResponse(response(t),batch.targets).translations,t);});
test('missing, duplicate, invented IDs and refusal never enter cache',()=>{const t=batch.targets.map(c=>({id:c.id,text:'Translated text'}));assert.throws(()=>parseResponse(response(t.slice(1)),batch.targets));assert.throws(()=>parseResponse(response([...t.slice(1),t[1]]),batch.targets));assert.throws(()=>parseResponse(response([{id:'invented',text:'x'},...t.slice(1)]),batch.targets));assert.throws(()=>parseResponse({status:'incomplete'},batch.targets));assert.throws(()=>parseResponse({status:'completed',output:[{content:[{type:'refusal'}]}]},batch.targets));});

test('display joins author line breaks without losing Danish words or speaker marks',async()=>{
  const {subtitleLine}=await import('../core.mjs');
  assert.equal(subtitleLine('Singlekulturen er voksende.\nAlting er så flygtigt.'),'Singlekulturen er voksende. Alting er så flygtigt.');
  assert.equal(subtitleLine('  - Hej.\r\n- Goddag.  '),'- Hej. - Goddag.');
  assert.equal(subtitleLine('单身文化正在兴起，\n一切都如此短暂。'),'单身文化正在兴起，一切都如此短暂。');
  assert.equal(subtitleLine('单身文化\n正在兴起。'),'单身文化正在兴起。');
});


test('source and target languages are independent prompt variables',()=>{
  const body=requestBody(validateBatch({...batch,sourceLanguage:'fr',language:'de'}),'gpt-6.1-sol');
  assert.match(body.instructions,/Translate from French \(fr\) into natural German \(de\)/);
  const input=JSON.parse(body.input[0].content);
  assert.equal(input.sourceLanguage.code,'fr');assert.equal(input.targetLanguage.code,'de');
  assert.equal(input.before.length,batch.before.length);assert.equal(input.after.length,batch.after.length);
});
test('every offered language reaches the prompt without an English fallback',async()=>{
  const {TARGET_LANGUAGES,SOURCE_LANGUAGE,getTargetLanguage}=await import('../languages.mjs');
  const {languageIcon}=await import('../icons.mjs');
  assert.equal(new Set(TARGET_LANGUAGES.map(l=>l.code)).size,TARGET_LANGUAGES.length);
  assert.equal(getTargetLanguage(SOURCE_LANGUAGE.code),null);
  for(const l of TARGET_LANGUAGES){
    const body=requestBody(validateBatch({...batch,language:l.code}),'gpt-6.1-sol');
    assert.ok(body.instructions.includes(`into natural ${l.englishName} (${l.tag})`));
    assert.equal(JSON.parse(body.input[0].content).targetLanguage.code,l.code);
    const icon=languageIcon(l.code.toUpperCase());assert.ok(!icon.includes('undefined'));assert.ok(icon.includes(`data-code="${l.code.toUpperCase()}"`));
  }
  assert.throws(()=>requestBody({...batch,language:'xx-invalid'},'gpt-6.1-sol'));
  assert.throws(()=>validateBatch({...batch,sourceLanguage:'unknown'}));
});
test('language search accepts endonyms, English names, codes and unaccented queries',async()=>{
  const {searchLanguages}=await import('../languages.mjs');
  for(const [q,code] of [['francais','fr'],['Deutsch','de'],['Greek','el'],['Українська','uk'],['cnr','cnr'],['Norsk nynorsk','nn']])assert.ok(searchLanguages(q).some(l=>l.code===code),q);
  assert.equal(searchLanguages('no-such-language-xyz').length,0);
});
