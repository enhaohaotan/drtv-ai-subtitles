import {DEFAULTS,MODELS,isSupportedModel} from './core.mjs';
const $=id=>document.getElementById(id);
function modelCopy(model) {
  const copy=document.createElement('span');copy.className='model-copy';
  const name=document.createElement('span');name.className='model-name';name.textContent=model.label;
  const cost=document.createElement('span');cost.className='model-cost';cost.textContent=priceLabel(model);
  copy.append(name,cost);return copy;
}
function priceLabel(model){return `Input $${model.input.toFixed(2)} · Output $${model.output.toFixed(2)} · USD per 1M tokens`;}
function selectModel(id){
  const model=MODELS.find(m=>m.id===id);$('model').value=model.id;
  $('model-name').textContent=model.label;$('model-cost').textContent=priceLabel(model);
  for(const option of $('model-list').children)option.setAttribute('aria-selected',String(option.dataset.model===id));
}
function closeModels(focus=false){$('model-list').hidden=true;$('model-trigger').setAttribute('aria-expanded','false');if(focus)$('model-trigger').focus();}
function openModels(index){$('model-list').hidden=false;$('model-trigger').setAttribute('aria-expanded','true');const options=[...$('model-list').children];(options[index]||options.find(o=>o.dataset.model===$('model').value)||options[0]).focus();}
for(const model of MODELS){
  const option=document.createElement('button');option.type='button';option.className='model-option';option.dataset.model=model.id;option.setAttribute('role','option');option.tabIndex=-1;
  option.append(modelCopy(model));const mark=document.createElement('span');mark.className='model-check';mark.innerHTML='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5 6.5 12 13 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="butt" stroke-linejoin="miter"/></svg>';mark.setAttribute('aria-hidden','true');option.append(mark);
  option.onclick=()=>{selectModel(model.id);closeModels(true);};$('model-list').append(option);
}
$('model-trigger').onclick=()=>{$('model-list').hidden?openModels():closeModels();};
$('model-trigger').onkeydown=e=>{if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();openModels(e.key==='Home'?0:e.key==='End'?MODELS.length-1:undefined);}};
$('model-list').onkeydown=e=>{
  const options=[...$('model-list').children];let index=options.indexOf(document.activeElement);
  if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();index=e.key==='Home'?0:e.key==='End'?options.length-1:(index+(e.key==='ArrowDown'?1:-1)+options.length)%options.length;options[index].focus();}
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeModels(true);}
  if(e.key==='Tab')closeModels();
};
document.addEventListener('pointerdown',e=>{if(!$('model-picker').contains(e.target))closeModels();});
$('model-picker').addEventListener('focusout',e=>{if(!$('model-picker').contains(e.relatedTarget))closeModels();});
const embedded=window.parent!==window&&new URLSearchParams(location.search).get('embedded')==='1';
if(embedded)document.documentElement.classList.add('embedded');
function closeSettings(){if(embedded)window.parent.postMessage({channel:'DRTV_AI_SUBTITLES_V1',type:'close-settings'},'https://www.dr.dk');else window.close();}
await chrome.storage.local.setAccessLevel({accessLevel:'TRUSTED_CONTEXTS'});
await chrome.storage.session.setAccessLevel({accessLevel:'TRUSTED_CONTEXTS'});
async function load(){
  const local=await chrome.storage.local.get(['settings','apiKey']);const session=await chrome.storage.session.get('apiKey');
  const cfg={...DEFAULTS,...local.settings};
  if(!isSupportedModel(cfg.model))cfg.model=DEFAULTS.model;
  selectModel(cfg.model);
  for(const id of ['fontSize','originalSize'])$(id).value=cfg[id];
  $('showOriginal').checked=cfg.showOriginal;$('remember').checked=local.settings?.rememberKey ?? (!!local.apiKey || !session.apiKey);
  $('connection').open=!(session.apiKey||local.apiKey);
  $('connection-state').textContent=session.apiKey||local.apiKey?'Configured':'Not configured';
  $('key-state').textContent=session.apiKey||local.apiKey?'A key is saved. Leave this field empty to keep it.':'No API key is configured.';
  preview();
}
function preview(){ $('preview-translation').style.fontSize=`${$('fontSize').value}px`;$('preview-original').style.fontSize=`${$('originalSize').value}px`;$('preview-original').hidden=!$('showOriginal').checked;}
for(const id of ['fontSize','originalSize','showOriginal'])$(id).addEventListener('input',preview);
$('form').addEventListener('submit',async e=>{
  e.preventDefault();
  try{
    const key=$('key').value.trim();const model=$('model').value.trim();
    if(!isSupportedModel(model))throw Error('Choose a model from the list.');
    if(key&&(!key.startsWith('sk-')||/\s/.test(key)))throw Error('The API key format is invalid.');
    const local=await chrome.storage.local.get('apiKey');const session=await chrome.storage.session.get('apiKey');const effective=key||session.apiKey||local.apiKey;
    if(effective){if($('remember').checked){await chrome.storage.local.set({apiKey:effective});await chrome.storage.session.remove('apiKey');}else{await chrome.storage.session.set({apiKey:effective});await chrome.storage.local.remove('apiKey');}}
    await chrome.storage.local.set({settings:{model,fontSize:Number($('fontSize').value),originalSize:Number($('originalSize').value),showOriginal:$('showOriginal').checked,rememberKey:$('remember').checked,revision:Date.now()}});
    $('key').value='';await load();$('message').textContent='Settings saved.';
  }catch(e){$('message').textContent=e.message;}
});
$('clear').onclick=async()=>{await chrome.storage.local.remove('apiKey');await chrome.storage.session.remove('apiKey');$('key').value='';$('message').textContent='API key deleted.';await load();};
$('clear-cache').onclick=async()=>{const all=await chrome.storage.session.get(null);await chrome.storage.session.remove(Object.keys(all).filter(k=>k.startsWith('batch:')));const local=await chrome.storage.local.get(null);await chrome.storage.local.remove(Object.keys(local).filter(k=>k.startsWith('subtitles:')));$('message').textContent='Translation cache cleared. Reload DRTV to clear translations shown on this page.';};
await load();
$('form').inert=false;
$('form').setAttribute('aria-busy','false');
document.documentElement.dataset.ready='true';

$('close-window').onclick=closeSettings;
document.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeSettings();}});
