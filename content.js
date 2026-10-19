(async () => {
  if(document.getElementById('drtv-ai-button'))return;
  const {selectBatch,DEFAULTS,subtitleLine}=await import(chrome.runtime.getURL('core.mjs'));
  const {languageIcon}=await import(chrome.runtime.getURL('icons.mjs'));
  const {TARGET_LANGUAGES,SOURCE_LANGUAGE,getTargetLanguage}=await import(chrome.runtime.getURL('languages.mjs'));
  const channel='DRTV_AI_SUBTITLES_V1';
  const settingsOrigin=chrome.runtime.getURL('').replace(/\/$/,'');
  let settingsDialog=null;
  let language='off', cfg={...DEFAULTS,hasKey:false}, player, button, menu, overlay, original, translation, status;
  let snapshot=null, snapshotAt=0, source='', epoch=0, busy=false, error='', memory='', memoryEnd=-1, lastTime=0, lastCheck=0;
  let cues=new Map(), cache=new Map(), requestAt=0, restoring=false;
  const decoder=document.createElement('textarea');
  function plain(s) {decoder.innerHTML=String(s||'').replace(/<[^>]*>/g,'');return decoder.value.slice(0,1200);}
  function cue(c) {
    if(!c||!Number.isFinite(c.start)||!Number.isFinite(c.end)||c.end<=c.start||typeof c.text!=='string')return null;
    const text=plain(c.text);let hash=2166136261;for(const ch of text)hash=Math.imul(hash^ch.charCodeAt(0),16777619);
    return {id:`${c.start}:${c.end}:${hash>>>0}`,start:c.start,end:c.end,text};
  }
  async function send(m) {const r=await chrome.runtime.sendMessage(m);if(!r?.ok)throw Error(r?.error||'The extension is unavailable. Reload the page.');return r.value;}
  function control(enabled) {window.postMessage({channel,type:'control',enabled},location.origin);}
  function invalidate(clear=false) {
    epoch++;busy=false;restoring=false;memory='';memoryEnd=-1;error='';requestAt=Date.now()+1600;
    send({type:'cancel'}).catch(()=>{});
    if(clear){cues.clear();cache.clear();}
  }
  function setLanguage(value) {
    if(value!=='off'&&!getTargetLanguage(value))return;
    language=value;cfg.selectedLanguage=value;send({type:'language',language}).catch(()=>{});invalidate(true);source='';snapshot=null;snapshotAt=0;
    button.dataset.enabled=String(language!=='off');
    for(const b of menu.querySelectorAll('[data-language]')){const selected=b.dataset.language===language;b.setAttribute('aria-pressed',String(selected));b.classList.toggle('accessibility-menu__menu-item--active',selected);}
    button.innerHTML=languageIcon(language==='off'?SOURCE_LANGUAGE.code.toUpperCase():language.toUpperCase());
    button.classList.toggle('selected',language!=='off');
    button.querySelector('svg').classList.toggle('selected',language!=='off');
    control(language!=='off');render();
    if(language!=='off')refreshSettings();
  }
  async function refreshSettings() {
    try{
      const next=await send({type:'settings'});
      if(JSON.stringify(next)!==JSON.stringify(cfg)){const clear=next.model!==cfg.model;cfg=next;invalidate(clear);if(clear)source='';render();}
    }catch{error='The extension has been updated. Reload this page.';render();}
  }
  function render() {
    if(!player||!overlay)return;
    const usable=language!=='off'&&snapshot?.available&&Date.now()-snapshotAt<2200;
    player.classList.toggle('drtv-ai-replaced',!!usable);
    overlay.hidden=!usable;
    overlay.style.setProperty('--drtv-ai-size',`${cfg.fontSize}px`);
    overlay.style.setProperty('--drtv-ai-original-size',`${cfg.originalSize}px`);
    const bounds=player.getBoundingClientRect();
    const controls=player.querySelector('.drtv-player-controls')?.getBoundingClientRect();
    const controlsVisible=!!player.querySelector('.player__wrapper--controls');
    const bottom=controlsVisible&&controls?Math.max(24,bounds.bottom-controls.top+18):Math.max(24,bounds.height*.065);
    overlay.style.bottom=`${bottom}px`;
    const active=(snapshot?.current||[]).map(cue).filter(Boolean);
    original.textContent=cfg.showOriginal?subtitleLine(active.map(c=>c.text).join(' ')):'';
    const translated=active.map(c=>cache.get(c.id));
    translation.lang=getTargetLanguage(language)?.tag || SOURCE_LANGUAGE.tag;
    translation.dir=getTargetLanguage(language)?.direction || 'ltr';
    translation.textContent=active.length&&translated.every(Boolean)?subtitleLine(translated.join(' ')):'';
    // Never leave the user with a blank subtitle while translation is unavailable.
    if(!translation.textContent&&active.length)original.textContent=subtitleLine(active.map(c=>c.text).join(' '));
    const message=language==='off'?'Translation is off':!cfg.hasKey?'Complete the translation setup in Settings.':error||(!usable?'Waiting for Danish subtitles…':busy?'Translating…':'');
    status.textContent=language!=='off'&&(!cfg.hasKey||error)?message:'';
    status.hidden=!status.textContent;
    menu.querySelector('#drtv-ai-retry').hidden=!error;
    button.title=message?`Translation · ${message}`:`Translation · ${getTargetLanguage(language)?.nativeName || SOURCE_LANGUAGE.nativeName}`;
  }
  async function translateNearby() {
    if(language==='off'||!cfg.hasKey||!snapshot?.available||busy||restoring||error||Date.now()<requestAt||document.hidden)return;
    const batch=selectBatch([...cues.values()],snapshot.time,cache);if(!batch)return;
    const generation=epoch;busy=true;render();
    const continuity=memoryEnd>=0&&batch.targets[0].start-memoryEnd>=-2&&batch.targets[0].start-memoryEnd<90?memory:'';
    try{
      const result=await send({type:'translate',track:snapshot.track,batch:{...batch,sourceLanguage:SOURCE_LANGUAGE.code,language,title:snapshot.title,memory:continuity}});
      if(generation!==epoch)return;
      for(const t of result.translations)cache.set(t.id,t.text);
      memory=result.continuity;memoryEnd=batch.targets.at(-1).end;
    }catch(e){if(generation===epoch)error=e.message;}
    finally{if(generation===epoch){busy=false;requestAt=Date.now()+1800;render();}}
  }
  async function restoreSubtitles() {
    const generation=epoch;restoring=true;
    try{
      const saved=await send({type:'subtitles',track:snapshot?.track||'',language});
      if(generation!==epoch||saved.model!==cfg.model)return;
      for(const [id,text] of saved.translations)cache.set(id,text);
    }catch{}finally{if(generation===epoch){restoring=false;render();translateNearby();}}
  }
  function closeSettingsOverlay() {
    const dialog=settingsDialog;if(!dialog)return;
    settingsDialog=null;
    if(dialog.open)dialog.close();
    dialog.remove();refreshSettings();
    if(button?.isConnected)button.focus({preventScroll:true});
  }
  function openSettingsOverlay() {
    if(!player?.isConnected)return;
    if(settingsDialog?.open){settingsDialog.querySelector('iframe').focus();return;}
    const dialog=document.createElement('dialog');
    dialog.id='drtv-ai-settings-dialog';
    dialog.setAttribute('aria-label','Translation settings');
    const frame=document.createElement('iframe');
    frame.src=chrome.runtime.getURL('options.html')+'?embedded=1';
    frame.title='Translation settings';
    dialog.append(frame);player.append(dialog);settingsDialog=dialog;
    dialog.addEventListener('cancel',e=>{e.preventDefault();closeSettingsOverlay();});
    dialog.addEventListener('click',e=>{
      const r=dialog.getBoundingClientRect();
      if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))closeSettingsOverlay();
    });
    dialog.showModal();frame.focus();
  }
  window.addEventListener('message',e=>{
    if(settingsDialog&&e.source===settingsDialog.querySelector('iframe').contentWindow&&e.origin===settingsOrigin&&e.data?.channel===channel&&e.data.type==='close-settings')closeSettingsOverlay();
  });
  chrome.runtime.onMessage.addListener((message,sender,reply)=>{
    if(message?.type==='open-settings'&&player?.isConnected){openSettingsOverlay();reply({ok:true});}
  });
  function mount() {
    const host=document.querySelector('.player');
    const row=host?.querySelector('.drtv-player-controls__button-row');
    if(!host||!row){if(player){closeSettingsOverlay();player.classList.remove('drtv-ai-replaced');player=null;snapshot=null;invalidate(true);}return;}
    if(player===host&&button?.isConnected&&row.contains(button))return;
    closeSettingsOverlay();
    player?.classList.remove('drtv-ai-replaced');
    button?.remove();menu?.remove();overlay?.remove();
    player=host;
    button=document.createElement('button');button.id='drtv-ai-button';button.className='drtv-player-button drtv-player-button__subtitle drtv-player-button__translation player-icon--dark';button.type='button';button.setAttribute('aria-label','AI subtitle translation');button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');button.dataset.enabled=String(language!=='off');button.classList.toggle('selected',language!=='off');
    button.innerHTML=languageIcon(language==='off'?SOURCE_LANGUAGE.code.toUpperCase():language.toUpperCase());
    button.querySelector('svg').classList.toggle('selected',language!=='off');
    row.insertBefore(button,row.querySelector('.drtv-player-button__subtitle'));
    menu=document.createElement('div');menu.id='drtv-ai-menu';menu.className='accessibility-menu__menu';menu.hidden=true;menu.setAttribute('role','dialog');menu.setAttribute('aria-label','Subtitle translation options');
    menu.innerHTML=`<div class="accessibility-menu__menu-header"><span>Translation</span><button id="drtv-ai-settings" class="drtv-ai-settings" aria-label="Translation settings" title="Settings"><svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="M19.391 8.939L21.781 9.921L21.781 14.079L19.391 15.061L19.391 15.061L20.387 17.446L17.446 20.387L15.061 19.391L15.061 19.391L14.079 21.781L9.921 21.781L8.939 19.391L8.939 19.391L6.554 20.387L3.613 17.446L4.609 15.061L4.609 15.061L2.219 14.079L2.219 9.921L4.609 8.939L4.609 8.939L3.613 6.554L6.554 3.613L8.939 4.609L8.939 4.609L9.921 2.219L14.079 2.219L15.061 4.609L15.061 4.609L17.446 3.613L20.387 6.554L19.391 8.939ZM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"/></svg></button><button class="accessibility-menu__close-btn" id="drtv-ai-close" aria-label="Close menu"></button></div><nav class="accessibility-menu__content" aria-label="Translation language">${TARGET_LANGUAGES.map(l=>`<button class="accessibility-menu__menu-item" aria-pressed="false" data-language="${l.code}" lang="${l.tag}" title="${l.englishName}"><span class="accessibility-menu__menu-group-item">${languageIcon(l.code.toUpperCase())}<span class="drtv-ai-language-name">${l.nativeName}</span></span></button>`).join('')}</nav><p id="drtv-ai-status" role="status" hidden></p><button id="drtv-ai-retry" hidden>Retry translation</button>`;
    // Only the control icon carries the native selected state; each menu row
    // uses DRTV's own menu-item active/hover styles.
    menu.querySelectorAll('svg.selected').forEach(svg=>svg.classList.remove('selected'));
    status=menu.querySelector('#drtv-ai-status');
    const close=()=>{menu.hidden=true;button.setAttribute('aria-expanded','false');button.focus({preventScroll:true});};
    button.addEventListener('click',e=>{e.stopPropagation();menu.hidden=!menu.hidden;button.setAttribute('aria-expanded',String(!menu.hidden));if(!menu.hidden){refreshSettings();const selected=menu.querySelector(`[data-language="${language==='off'?'zh':language}"]`);selected?.scrollIntoView({block:'nearest'});if(e.detail===0)selected?.focus({preventScroll:true});}});
    menu.addEventListener('click',e=>e.stopPropagation());
    menu.addEventListener('keydown',e=>{
      e.stopPropagation();if(e.key==='Escape'){e.preventDefault();close();}
      if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const items=[...menu.querySelectorAll('[data-language]:not([hidden])')];if(!items.length)return;const i=items.indexOf(document.activeElement);items[i<0?(e.key==='ArrowDown'?0:items.length-1):(i+(e.key==='ArrowDown'?1:items.length-1))%items.length].focus();}
    });
    menu.querySelector('#drtv-ai-close').onclick=close;
    menu.querySelectorAll('[data-language]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.language===language));b.classList.toggle('accessibility-menu__menu-item--active',b.dataset.language===language);b.onclick=()=>{setLanguage(language===b.dataset.language?'off':b.dataset.language);close();};});
    menu.querySelector('#drtv-ai-retry').onclick=()=>{invalidate();refreshSettings();};
    menu.querySelector('#drtv-ai-settings').onclick=()=>{close();openSettingsOverlay();};
    overlay=document.createElement('div');overlay.id='drtv-ai-overlay';overlay.hidden=true;
    translation=document.createElement('div');translation.id='drtv-ai-translation';
    original=document.createElement('div');original.id='drtv-ai-original';original.lang='da';
    overlay.append(translation,original);player.append(menu,overlay);render();control(language!=='off');
  }
  window.addEventListener('message',e=>{
    const d=e.data;if(e.source!==window||e.origin!==location.origin||d?.channel!==channel||d.type!=='snapshot'||language==='off')return;
    if(d.path!==location.pathname||!Number.isFinite(d.time)||!Array.isArray(d.cues)||d.cues.length>180||!Array.isArray(d.current)||d.current.length>8)return;
    const identity=`${d.path}|${d.source}|${d.track}`;
    const restore=identity!==source||Math.abs(d.time-lastTime)>5;
    if(identity!==source){invalidate(true);source=identity;}
    else if(restore){invalidate();}
    lastTime=d.time;snapshot=d;snapshotAt=Date.now();
    if(restore)restoreSubtitles();
    for(const c of [...d.cues,...d.current].map(cue).filter(Boolean))cues.set(c.id,c);
    if(cues.size>3000){for(const [id,c] of cues)if(c.end<d.time-180||c.start>d.time+300)cues.delete(id);}
    render();translateNearby();
  });
  document.addEventListener('click',e=>{if(menu&&!menu.hidden&&!e.composedPath().includes(menu)&&!e.composedPath().includes(button)){menu.hidden=true;button.setAttribute('aria-expanded','false');}},true);
  setInterval(()=>{mount();render();if((language!=='off'||menu&&!menu.hidden)&&Date.now()-lastCheck>5000){lastCheck=Date.now();refreshSettings();}},600);
  window.addEventListener('pagehide',()=>{control(false);player?.classList.remove('drtv-ai-replaced');send({type:'cancel'}).catch(()=>{});});
  window.addEventListener('pageshow',e=>{if(e.persisted){invalidate();source='';mount();control(language!=='off');refreshSettings();}});
  await refreshSettings();
  language=getTargetLanguage(cfg.selectedLanguage)?cfg.selectedLanguage:'off';
  mount();
})();
