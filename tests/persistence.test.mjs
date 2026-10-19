import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';

test('language and cue cache survive a worker restart and isolate programme, language, track and model',async()=>{
 const local={apiKey:'sk-mock-not-real'},session={};let listener,requests=0;
 const area=data=>({setAccessLevel:async()=>{},get:async keys=>structuredClone(keys===null?data:Object.fromEntries((Array.isArray(keys)?keys:[keys]).filter(k=>k in data).map(k=>[k,data[k]]))),set:async values=>Object.assign(data,structuredClone(values)),remove:async keys=>{for(const k of Array.isArray(keys)?keys:[keys])delete data[k];}});
 if(!globalThis.crypto)globalThis.crypto=webcrypto;
 globalThis.chrome={storage:{local:area(local),session:area(session),onChanged:{addListener(){}}},runtime:{onMessage:{addListener(fn){listener=fn;}}},tabs:{onRemoved:{addListener(){}}},action:{onClicked:{addListener(){}}}};
 const originalFetch=globalThis.fetch;
 globalThis.fetch=async()=>{requests++;return new Response(JSON.stringify({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({translations:[{id:'10:14:123',text:'Example translation'}],continuity:''})}]}]}));};
 const sender={url:'https://www.dr.dk/drtv/se/episode_1',frameId:0,tab:{id:7}};
 const send=(message,s=sender)=>new Promise(resolve=>{listener(message,s,resolve);});
 try{
  await import('../background.js?first');
  assert.equal((await send({type:'settings'})).value.selectedLanguage,'off');
  assert.equal((await send({type:'language',language:'zh'})).ok,true);
  const batch={language:'zh',sourceLanguage:'da',title:'Example',before:[],after:[],targets:[{id:'10:14:123',text:'Dansk',start:10,end:14}],memory:''};
  assert.equal((await send({type:'translate',track:'da:Dansk',batch})).ok,true);
  assert.equal(requests,1);
  const lookup={type:'subtitles',language:'zh',track:'da:Dansk'};
  assert.deepEqual((await send(lookup)).value.translations,[['10:14:123','Example translation']]);
  // No session cache or worker globals remain after a simulated browser restart.
  for(const key of Object.keys(session))delete session[key];
  await import('../background.js?restart');
  assert.equal((await send({type:'settings'})).value.selectedLanguage,'zh');
  assert.deepEqual((await send(lookup)).value.translations,[['10:14:123','Example translation']]);
  for(const msg of [{...lookup,language:'de'},{...lookup,track:'da:Other'}])assert.deepEqual((await send(msg)).value.translations,[]);
  assert.deepEqual((await send(lookup,{...sender,url:'https://www.dr.dk/drtv/se/episode_2'})).value.translations,[]);
  local.settings={model:'gpt-6-luna'};
  assert.deepEqual((await send(lookup)).value.translations,[]);
  local.settings={model:'gpt-6.1-sol'};
  assert.equal((await send({type:'language',language:'off'})).ok,true);
  assert.equal((await send({type:'settings'})).value.selectedLanguage,'off');
  assert.equal((await send({type:'language',language:'invalid'})).ok,false);
  const key=Object.keys(local).find(k=>k.startsWith('subtitles:'));local[key].at=Date.now()-31*86400000;
  assert.deepEqual((await send(lookup)).value.translations,[]);
  assert.equal(requests,1,'cache restoration must not call OpenAI');
 }finally{globalThis.fetch=originalFetch;delete globalThis.chrome;}
});
