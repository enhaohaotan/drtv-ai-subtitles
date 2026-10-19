import {getTargetLanguage} from './languages.mjs';
import { DEFAULTS, isSupportedModel, validateBatch, requestBody, parseResponse } from './core.mjs';
const ready = Promise.all([
  chrome.storage.local.setAccessLevel({accessLevel:'TRUSTED_CONTEXTS'}),
  chrome.storage.session.setAccessLevel({accessLevel:'TRUSTED_CONTEXTS'})
]);
const jobs = new Map();
const lastStart = new Map();
const versions = new Map();
async function settings() {
  await ready;
  const local = await chrome.storage.local.get(['settings','apiKey','selectedLanguage']);
  const session = await chrome.storage.session.get('apiKey');
  const cfg={...DEFAULTS,...local.settings,apiKey:session.apiKey || local.apiKey || ''};
  if(!isSupportedModel(cfg.model))cfg.model=DEFAULTS.model;
  cfg.selectedLanguage=getTargetLanguage(local.selectedLanguage)?local.selectedLanguage:'off';
  return cfg;
}
function cancel(tab) { versions.set(tab,(versions.get(tab)||0)+1); const job=jobs.get(tab); if(job) {job.abort();jobs.delete(tab);} }
function pageSender(sender) { try { const u=new URL(sender.url); return sender.tab && sender.frameId === 0 && u.origin==='https://www.dr.dk' && (u.pathname==='/drtv'||u.pathname.startsWith('/drtv/')); } catch {return false;} }
// Persist individual translations independently of changing batch/context boundaries.
// Path separates episodes; cue IDs include timing and a hash of the source text.
let subtitleWrites=Promise.resolve();
async function subtitleKey(sender, track, language, model) {
  if(typeof track!=='string'||track.length>160||!getTargetLanguage(language))throw Error('Invalid subtitle cache context.');
  const identity=JSON.stringify([1,new URL(sender.url).pathname,track,language,model]);
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(identity));
  return 'subtitles:'+Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
}
async function readSubtitles(key){
  const entry=(await chrome.storage.local.get(key))[key];
  return entry&&Date.now()-entry.at<30*24*60*60*1000?entry.translations:[];
}
function saveSubtitles(key,translations){
  const job=subtitleWrites.catch(()=>{}).then(async()=>{
    const merged=new Map(await readSubtitles(key));
    for(const t of translations)merged.delete(t.id),merged.set(t.id,t.text);
    const entry={at:Date.now(),translations:[...merged].slice(-1500)};
    while(JSON.stringify(entry).length>120000)entry.translations.shift();
    const all=await chrome.storage.local.get(null);
    const old=Object.entries(all).filter(([k])=>k.startsWith('subtitles:')&&k!==key).sort((a,b)=>b[1].at-a[1].at);
    await chrome.storage.local.remove(old.slice(7).map(([k])=>k));
    await chrome.storage.local.set({[key]:entry});
  });
  subtitleWrites=job;return job;
}
async function translate(message, sender) {
  const tab=sender.tab.id;
  const version=versions.get(tab)||0; versions.set(tab,version);
  const batch=validateBatch(message.batch);
  const cfg=await settings();
  if(!cfg.apiKey) throw Error('Add your OpenAI API key in Settings.');
  if(version!==versions.get(tab)) throw Error('The request was cancelled.');
  if(jobs.has(tab) || Date.now()-(lastStart.get(tab)||0)<1500) throw Error('A request is in progress. Please retry shortly.');
  const subtitleCacheKey=await subtitleKey(sender,message.track||'',batch.language,cfg.model);
  const body=requestBody(batch,cfg.model);
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(body)));
  const cacheKey='batch:'+Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  const cache=await chrome.storage.session.get(cacheKey);
  if(version!==versions.get(tab)) throw Error('The request was cancelled.');
  if(cache[cacheKey]) {await saveSubtitles(subtitleCacheKey,cache[cacheKey].value.translations).catch(()=>{});return cache[cacheKey].value;}
  const controller=new AbortController();jobs.set(tab,controller);lastStart.set(tab,Date.now());
  const timeout=setTimeout(()=>controller.abort(),25000);
  try {
    const response=await fetch('https://api.openai.com/v1/responses',{
      method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${cfg.apiKey}`},body:JSON.stringify(body),signal:controller.signal
    });
    if(!response.ok) {
      const messages={400:'The request or model parameters are not supported. Check the model setting.',401:'The API key is invalid. Check Settings.',403:'This API key cannot access the selected model.',404:'The model is unavailable for this account.',429:'Quota exceeded or rate limited. Check your OpenAI account and retry.'};
      throw Error(messages[response.status] || `OpenAI is temporarily unavailable（${response.status}）`);
    }
    const result=parseResponse(await response.json(),batch.targets);
    if(controller.signal.aborted) throw Error('The request was cancelled.');
    const saved=await chrome.storage.session.get(null);
    const entries=Object.entries(saved).filter(([k])=>k.startsWith('batch:')).sort((a,b)=>a[1].at-b[1].at);
    if(entries.length>=80) await chrome.storage.session.remove(entries.slice(0,entries.length-79).map(([k])=>k));
    await chrome.storage.session.set({[cacheKey]:{at:Date.now(),value:result}});
    await saveSubtitles(subtitleCacheKey,result.translations).catch(()=>{});
    return result;
  } catch(e) {
    if(e.name==='AbortError') throw Error('The request was cancelled or timed out. Please retry.');
    if(e instanceof TypeError) throw Error('Unable to connect to OpenAI. Check your connection.');
    throw e;
  } finally {clearTimeout(timeout);if(jobs.get(tab)===controller)jobs.delete(tab);}
}
let openingSettings;
async function openSettings(parentWindowId) {
  if(openingSettings)return openingSettings;
  openingSettings=(async()=>{
    await ready;
    let parent;
    try { parent=Number.isInteger(parentWindowId)?await chrome.windows.get(parentWindowId):await chrome.windows.getLastFocused(); } catch {}
    const width=Math.min(520,Math.max(320,(parent?.width||1040)-80));
    const height=Math.min(640,Math.max(420,(parent?.height||800)-100));
    const geometry={width,height,left:Math.max(0,Math.round((parent?.left||0)+((parent?.width||1040)-width)/2)),top:Math.max(0,Math.round((parent?.top||0)+((parent?.height||800)-height)/2))};
    const {settingsWindowId}=await chrome.storage.session.get('settingsWindowId');
    if(Number.isInteger(settingsWindowId)){
      try{await chrome.windows.update(settingsWindowId,{state:'normal',focused:true,...geometry});return;}catch{}
    }
    const win=await chrome.windows.create({url:chrome.runtime.getURL('options.html'),type:'popup',...geometry,focused:true});
    await chrome.storage.session.set({settingsWindowId:win.id});
  })();
  try{await openingSettings;}finally{openingSettings=null;}
}
chrome.runtime.onMessage.addListener((m,sender,reply)=>{
  if(!pageSender(sender)) return false;
  (async()=>{
    if(m.type==='settings') {const {apiKey,...publicSettings}=await settings();return {...publicSettings,hasKey:!!apiKey};}
    if(m.type==='language') {
      if(m.language!=='off'&&!getTargetLanguage(m.language))throw Error('Unsupported language.');
      await ready;await chrome.storage.local.set({selectedLanguage:m.language});return {};
    }
    if(m.type==='subtitles') {
      const cfg=await settings();
      const key=await subtitleKey(sender,m.track||'',m.language,cfg.model);
      await subtitleWrites.catch(()=>{});return {model:cfg.model,translations:await readSubtitles(key)};
    }
    if(m.type==='options') {await openSettings(sender.tab.windowId);return {};}
    if(m.type==='cancel') {cancel(sender.tab.id);return {};}
    if(m.type==='translate') return translate(m,sender);
    throw Error('Unknown request.');
  })().then(value=>reply({ok:true,value})).catch(e=>reply({ok:false,error:e.message}));
  return true;
});
chrome.storage.onChanged.addListener((changes,area)=>{
  if((area==='local'||area==='session')&&(changes.settings||changes.apiKey)) for(const id of versions.keys()) cancel(id);
});
chrome.tabs.onRemoved.addListener(id=>{cancel(id);lastStart.delete(id);versions.delete(id);});
chrome.action.onClicked.addListener(async tab=>{
  if(tab?.id){try{const result=await chrome.tabs.sendMessage(tab.id,{type:'open-settings'});if(result?.ok)return;}catch{}}
  await openSettings(tab?.windowId).catch(()=>{});
});
