let editorViewRevision=0;
function captureEditorView(anchor=document.activeElement){
 const editor=$('#editor'),host=$('#blocks');
 const inBlocks=anchor&&host.contains?.(anchor);
 return {editor,host,top:editor.scrollTop||0,left:editor.scrollLeft||0,
  page:typeof window==='undefined'?null:{x:window.scrollX,y:window.scrollY},
  anchor:inBlocks?{tag:anchor.tagName,dataset:{...anchor.dataset},top:anchor.getBoundingClientRect().top}:null,
  tracks:host.querySelectorAll?[...host.querySelectorAll('.media-track')].map(t=>t.scrollLeft):[]};
}
function restoreEditorView(view){
 const {editor,host,anchor}=view;
 let next;
 if(anchor)next=[...host.querySelectorAll('button[data-op],input[data-key],input[data-extra],input[data-pause]')].find(el=>el.tagName===anchor.tag&&Object.entries(anchor.dataset).every(([key,value])=>el.dataset[key]===value));
 if(next?.getClientRects().length)next.focus({preventScroll:true});
 const revision=++editorViewRevision;
 const restore=()=>{
  if(revision!==editorViewRevision)return;
  editor.scrollTop=view.top;editor.scrollLeft=view.left;
  // Keep the control at the same screen position if a label above it wraps.
  if(next?.getClientRects().length)editor.scrollTop+=next.getBoundingClientRect().top-anchor.top;
  if(view.page&&(window.scrollX!==view.page.x||window.scrollY!==view.page.y))window.scrollTo(view.page.x,view.page.y);
 };
 host.querySelectorAll?.('.media-track').forEach((track,i)=>{if(view.tracks[i]!==undefined)track.scrollLeft=view.tracks[i]});
 restore();
 // WebKit may complete its focus scrolling at the next layout frame.
 if(typeof requestAnimationFrame==='function')requestAnimationFrame(()=>{if(editor.open)restore()});
}
// A fresh user gesture must win over any queued layout correction.
document.addEventListener?.('pointerdown',()=>{editorViewRevision++},true);
document.addEventListener?.('touchmove',()=>{editorViewRevision++},{passive:true,capture:true});
document.addEventListener?.('wheel',()=>{editorViewRevision++},{passive:true,capture:true});
const weightModes=[['none','Ohne'],['vest','Gewichtsweste'],['belt','Gewichtsgürtel']];
function measureFor(e){return e.measure||find('exercises',e.exerciseId)?.measure||'reps'}
function categoriesFor(e){const ids=find('exercises',e.exerciseId)?.variationCategoryIds||[];return GuGuProgress.alphabetical(data.variationCategories.filter(c=>ids.includes(c.id)&&(c.scope!=='exercise'||c.exerciseId===e.exerciseId)))}
function weightModeFor(e,s){return s?.weightMode??e.weightMode??'none'}
function targetAttrs(i,j){return `data-block="${i}"${j===null?'':` data-set="${j}"`}`}
function variationMarkup(e,i,j=null){
 const selected=j===null?(e.variations||{}):KraftlogModel.resolveVariations(e,e.sets[j]);
 const attrs=targetAttrs(i,j),mode=weightModeFor(e,j===null?null:e.sets[j]);
 let html=`<fieldset class="variation-choice"><legend>Zusatzgewicht</legend><div class="choice-buttons">${weightModes.map(([id,label])=>`<button type="button" data-op="weight-mode" ${attrs} data-value="${id}" aria-pressed="${mode===id}">${label}</button>`).join('')}</div></fieldset>`;
 return html+categoriesFor(e).map(c=>{
  const v=selected[c.id]||{},oid=v.optionId||'',option=c.options.find(o=>o.id===oid);
  return `<fieldset class="variation-choice"><legend>${esc(c.name)}</legend><div class="choice-buttons"><button type="button" data-op="variation" ${attrs} data-category="${esc(c.id)}" data-value="" aria-pressed="${!oid}">Keine Auswahl</button>${c.options.map(o=>`<button type="button" data-op="variation" ${attrs} data-category="${esc(c.id)}" data-value="${esc(o.id)}" aria-pressed="${oid===o.id}">${esc(o.name)}</button>`).join('')}</div>${option?.extra?`<label>${esc(option.name)} (${esc(option.extra.unit)})<input aria-label="${esc(c.name)} (${esc(option.extra.unit)})" type="number" step="any" min="0" data-extra="${esc(c.id)}" ${attrs} value="${esc(v.value??'')}"></label>`:''}</fieldset>`;
 }).join('');
}
function variationSummary(e,s){
 const selected=s?KraftlogModel.resolveVariations(e,s):(e.variations||{});
 return [weightModes.find(([id])=>id===weightModeFor(e,s))?.[1]||'Ohne',...categoriesFor(e).map(c=>{
  const v=selected[c.id],o=c.options.find(o=>o.id===v?.optionId);
  return o?`${c.name}: ${o.name}${o.extra&&v.value!==''&&v.value!=null?' '+v.value+' '+o.extra.unit:''}`:null;
 })].filter(Boolean).join(' · ');
}
function hasSetOverrides(s){return Object.keys(s.variations||{}).length>0||Object.hasOwn(s,'weightMode')}
function rememberBlockUI(){return [...document.querySelectorAll('#blocks details[open]')].map(el=>el.dataset.panel)}
function renderBlocks(openPanels=rememberBlockUI(),anchor=document.activeElement,preserve=true){
 if(!preserve)editorViewRevision++;
 const view=preserve?captureEditorView(anchor):null,host=$('#blocks'),oldMinHeight=host.style?.minHeight||'';
 if(host.style)host.style.minHeight=(host.getBoundingClientRect().height||0)+'px';
 const emom=$('#method')?.value==='emom';
 if($('#emomSettings'))$('#emomSettings').hidden=!emom;
 if($('#appendPause'))$('#appendPause').hidden=!blocks.some(e=>e.type!=='pause');
 $('#blocks').innerHTML=blocks.map((e,i)=>{
  if(e.type==='pause')return `<div class="pause-block"><div class="mini-head"><h3>Pause</h3><div><button type="button" data-op="up" data-block="${i}" aria-label="Pause nach oben verschieben">↑</button><button type="button" data-op="remove" data-block="${i}" aria-label="Pause entfernen">✕</button></div></div><label for="pause-${i}">Dauer (Minuten)</label><input class="pause-input" id="pause-${i}" type="number" inputmode="decimal" min="0.1" max="1440" step="any" required value="${esc(e.minutes)}" data-pause="${i}"></div>`;
  const seconds=measureFor(e)==='seconds',defaults=`defaults-${i}`;
  return `<div class="exercise-block"><div class="mini-head"><h3>${esc(e.name||name(e.exerciseId))}</h3><div><button type="button" data-op="up" data-block="${i}" aria-label="Übung nach oben verschieben">↑</button><button type="button" data-op="remove" data-block="${i}" aria-label="Übung entfernen">✕</button></div></div>
   ${exerciseGallery(find('exercises',e.exerciseId)||{})}<details class="variation-defaults" data-panel="${defaults}" ${openPanels.includes(defaults)?'open':''}><summary>Variationen für alle Sets <span>${esc(variationSummary(e))}</span></summary>${variationMarkup(e,i)}<button type="button" data-op="collapse" data-block="${i}">Fertig · Einklappen</button><button type="button" data-op="manage-variations" data-block="${i}">Variationen bearbeiten</button></details>
   <div class="set-table" role="table" aria-label="Sets für ${esc(e.name||name(e.exerciseId))}"><div class="set-line set-head" role="row"><span role="columnheader">Set</span><span role="columnheader">Kg</span><span role="columnheader">${seconds?'SEK':'WDH'}</span><span role="columnheader">VAR</span><span class="sr-only" role="columnheader">Entfernen</span></div>
   ${e.sets.map((s,j)=>{
    const panel=`set-${i}-${j}`,overridden=hasSetOverrides(s),weighted=weightModeFor(e,s)!=='none';
    return `<div class="set-line" role="row"><span role="cell" class="set-number">${j+1}</span><input aria-label="Gewicht Set ${j+1} in kg" type="number" inputmode="decimal" step="0.1" min="0" max="10000" ${weighted?'required':''} placeholder="${weighted?'kg':'–'}" value="${esc(s.weight??'')}" data-block="${i}" data-set="${j}" data-key="weight"><input aria-label="${seconds?'Sekunden':'Wiederholungen'} Set ${j+1}" required ${seconds?'type="number" min="0" max="10000" step="any" inputmode="decimal"':'type="text" inputmode="text" pattern="[0-9]+([ ]*[+][ ]*[0-9]+)*" title="Eine Zahl oder Teilwiederholungen wie 5+2"'} value="${esc(seconds?(s.seconds??s.reps??''):(s.partsText??s.reps??''))}" data-block="${i}" data-set="${j}" data-key="partsText"><button type="button" class="var-toggle ${overridden?'overridden':''}" data-op="set-variations" data-block="${i}" data-set="${j}" data-focus="var-${i}-${j}" aria-label="Variationen Set ${j+1}${overridden?' (angepasst)':''}" aria-expanded="${openPanels.includes(panel)}" aria-controls="${panel}" title="${esc(variationSummary(e,s))}">VAR${overridden?' •':''}</button><button type="button" class="drop-set" data-op="drop" data-block="${i}" data-set="${j}" aria-label="Set ${j+1} entfernen">×</button></div>
     <details class="set-variation-panel" id="${panel}" data-panel="${panel}" ${openPanels.includes(panel)?'open':''}><summary class="sr-only">Variationen Set ${j+1}</summary><div class="mini-head"><strong>Variationen · Set ${j+1}</strong><button type="button" data-op="set-variations" data-block="${i}" data-set="${j}" aria-label="Variationen Set ${j+1} schließen">✕</button></div><p class="hint">${overridden?'Dieses Set hat eigene Einstellungen.':'Dieses Set verwendet die Vorgabe der Übung.'}</p>${variationMarkup(e,i,j)}<button type="button" data-op="reset-variations" data-block="${i}" data-set="${j}">Vorgabe der Übung übernehmen</button></details>`;
   }).join('')}</div><button type="button" data-op="add" data-block="${i}">＋ Set hinzufügen</button></div>`;
 }).join('');
 if(host.style)host.style.minHeight=oldMinHeight;
 if(view)restoreEditorView(view);
}
function readBlocks(validate=false){
 document.querySelectorAll('#blocks input[data-pause]').forEach(el=>{
  const n=Number(el.value);if(validate&&(!Number.isFinite(n)||n<=0||n>1440))throw Error('Bitte eine gültige Pausendauer eingeben.');
  blocks[Number(el.dataset.pause)].minutes=el.value===''?'':n;
 });
 document.querySelectorAll('#blocks input[data-key]').forEach(el=>{
  const e=blocks[+el.dataset.block],s=e.sets[+el.dataset.set];
  if(el.dataset.key==='weight'){
   const value=el.value===''?'':Number(el.value);
   if(validate&&((value!==''&&(!Number.isFinite(value)||value<0||value>10000))||(value===''&&weightModeFor(e,s)!=='none')))throw Error('Bitte ein gültiges Gewicht in kg für jedes Set mit Weste oder Gürtel eingeben.');
   s.weight=value;return;
  }
  if(measureFor(e)==='seconds'){
   const n=Number(el.value);if(validate&&(!Number.isFinite(n)||n<0||n>10000))throw Error('Bitte gültige Sekunden eingeben.');
   s.seconds=el.value===''?'':n;s.reps=Number.isFinite(n)&&n>=0?Math.round(n):0;delete s.partsText;
  }else{
   s.partsText=el.value;
   try{const p=KraftlogModel.parseParts(el.value);s.reps=p.total;s.parts=p.parts;}catch(error){if(validate)throw error}
  }
 });
 document.querySelectorAll('#blocks input[data-extra]').forEach(el=>{
  if(el.value===el.defaultValue)return;
  const e=blocks[+el.dataset.block],s=el.dataset.set===undefined?e:e.sets[+el.dataset.set],cid=el.dataset.extra;
  if(validate&&el.value!==''&&(!Number.isFinite(Number(el.value))||Number(el.value)<0))throw Error('Ungültiger Variationswert.');
  s.variations??={};const inherited=KraftlogModel.resolveVariations(e,s)[cid]||{};
  // Opening VAR must not freeze inherited values as overrides.
  if((inherited.value??'')!==(el.value===''?'':Number(el.value)))s.variations[cid]={...inherited,value:el.value===''?'':Number(el.value)};
 });
}
function handleBlockClick(event){
 const b=event.target.closest('button[data-op]');if(!b)return;
 if(b.dataset.op==='manage-variations'){showVariationManager();return}
 readBlocks();
 const i=Number(b.dataset.block),e=blocks[i],j=b.dataset.set===undefined?null:Number(b.dataset.set),s=j===null?e:e.sets[j];
 const panels=rememberBlockUI(),op=b.dataset.op;
 if(op==='variation'){
  const cid=b.dataset.category,selection=j===null?(e.variations||{}):KraftlogModel.resolveVariations(e,s);
  const oid=selection[cid]?.optionId===b.dataset.value?'':b.dataset.value;
  s.variations??={};s.variations[cid]={optionId:oid};
 }
 if(op==='weight-mode')s.weightMode=b.dataset.value;
 if(op==='reset-variations'){delete s.variations;delete s.weightMode}
 if(op==='set-variations'){
  const panel=`set-${i}-${j}`,index=panels.indexOf(panel);if(index<0)panels.push(panel);else panels.splice(index,1);
 }
 if(op==='collapse'){const index=panels.indexOf(`defaults-${i}`);if(index>=0)panels.splice(index,1)}
 if(op==='remove')blocks.splice(i,1);
 if(op==='add')e.sets.push(structuredClone(e.sets.at(-1)||GuGuProgress.numbers(null,measureFor(e)==='seconds')));
 if(op==='drop')e.sets.splice(j,1);
 if(op==='up'&&i>0)[blocks[i-1],blocks[i]]=[blocks[i],blocks[i-1]];
 if(['variation','weight-mode','reset-variations'].includes(op))suggestHistory(e,j);
 renderBlocks(['remove','drop','up'].includes(op)?[]:panels,['remove','drop','up'].includes(op)?null:b);
}
