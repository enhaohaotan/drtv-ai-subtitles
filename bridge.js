(() => {
  if(window.__drtvAiBridgeV1) return;
  window.__drtvAiBridgeV1=true;
  const channel='DRTV_AI_SUBTITLES_V1';
  let enabled=false, player=null, saved=new Map(), selected=null, lastPath='';
  const clean=s=>String(s||'').slice(0,1200);
  function restore() {for(const [t,mode] of saved) {try{t.mode=mode;}catch{}}saved.clear();selected=null;}
  function tracks() {try{return Array.from(player?.textTracks?.()||[]).filter(t=>t.kind==='subtitles'||t.kind==='captions');}catch{return [];}}
  function snapshot() {
    const next=document.querySelector('.video-js')?.player;
    if(next!==player || lastPath!==location.pathname){restore();player=next;lastPath=location.pathname;}
    if(!enabled)return;
    const list=tracks();
    if(list.length && !selected) {
      selected=list.find(t=>t.label==='Dansk') || list.find(t=>t.language==='da'&&!/fremmed|foreign/i.test(t.label)) || list.find(t=>t.mode==='showing') || list[0];
      list.forEach(t=>saved.set(t,t.mode));
      list.forEach(t=>t.mode=t===selected?'showing':'disabled');
    }
    const active=list.find(t=>t.mode==='showing');
    const v=document.querySelector('.video-js video');
    const time=v?.currentTime||0;
    const serialize=c=>({start:c.startTime,end:c.endTime,text:clean(c.text)});
    let cues=[];
    try{cues=Array.from(active?.cues||[]).filter(c=>c.endTime>=time-150&&c.startTime<=time+150).slice(0,180).map(serialize);}catch{}
    const current=Array.from(active?.activeCues||[]).slice(0,8).map(serialize);
    window.postMessage({channel,type:'snapshot',path:location.pathname,time,paused:v?.paused??true,
      source:v?.currentSrc||'',track:active?`${active.language}:${active.label}`:'',
      available:!!active,title:document.querySelector('.player-metadata__title')?.textContent||document.title,cues,current},location.origin);
  }
  window.addEventListener('message',e=>{
    if(e.source!==window||e.origin!==location.origin||e.data?.channel!==channel||e.data.type!=='control'||typeof e.data.enabled!=='boolean')return;
    enabled=e.data.enabled;if(!enabled)restore();snapshot();
  });
  setInterval(snapshot,400);
  window.addEventListener('pagehide',restore);
})();
