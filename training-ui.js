let emomTimer=null;
const weightModes=[['none','Ohne'],['vest','Gewichtsweste'],['belt','Gewichtsgürtel']];
function measureFor(e){return find('exercises',e.exerciseId)?.measure||'reps'}
function categoriesFor(e){const ids=find('exercises',e.exerciseId)?.variationCategoryIds||[];return data.variationCategories.filter(c=>ids.includes(c.id))}
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
function renderBlocks(openPanels=rememberBlockUI()){
 const focused=document.activeElement,focusKey=focused?.dataset?.focus,emom=$('#method')?.value==='emom';
 if($('#emomSettings'))$('#emomSettings').hidden=!emom;
 $('#blocks').innerHTML=blocks.map((e,i)=>{
  const seconds=measureFor(e)==='seconds',defaults=`defaults-${i}`;
  return `<div class="exercise-block"><div class="mini-head"><h3>${esc(e.name||name(e.exerciseId))}</h3><div><button type="button" data-op="up" data-block="${i}" aria-label="Übung nach oben verschieben">↑</button><button type="button" data-op="remove" data-block="${i}" aria-label="Übung entfernen">✕</button></div></div>
   <details class="variation-defaults" data-panel="${defaults}" ${openPanels.includes(defaults)?'open':''}><summary>Variationen für alle Sets <span>${esc(variationSummary(e))}</span></summary>${variationMarkup(e,i)}<button type="button" data-op="collapse" data-block="${i}">Fertig · Einklappen</button></details>
   <div class="set-table" role="table" aria-label="Sets für ${esc(e.name||name(e.exerciseId))}"><div class="set-line set-head" role="row"><span role="columnheader">Set</span><span role="columnheader">Kg</span><span role="columnheader">${seconds?'SEK':'WDH'}</span><span role="columnheader">VAR</span><span class="sr-only" role="columnheader">Entfernen</span></div>
   ${e.sets.map((s,j)=>{
    const panel=`set-${i}-${j}`,overridden=hasSetOverrides(s),weighted=weightModeFor(e,s)!=='none';
    return `<div class="set-line" role="row"><span role="cell" class="set-number">${j+1}</span><input aria-label="Gewicht Set ${j+1} in kg" type="number" inputmode="decimal" step="0.1" min="0" max="10000" ${weighted?'required':''} placeholder="${weighted?'kg':'–'}" value="${esc(s.weight??'')}" data-block="${i}" data-set="${j}" data-key="weight"><input aria-label="${seconds?'Sekunden':'Wiederholungen'} Set ${j+1}" required ${seconds?'type="number" min="0.1" max="10000" step="any" inputmode="decimal"':'type="text" inputmode="text" pattern="[0-9]+([ ]*[+][ ]*[0-9]+)*" title="Eine Zahl oder Teilwiederholungen wie 5+2"'} value="${esc(seconds?(s.seconds??s.reps??''):(s.partsText??s.reps??''))}" data-block="${i}" data-set="${j}" data-key="partsText"><button type="button" class="var-toggle ${overridden?'overridden':''}" data-op="set-variations" data-block="${i}" data-set="${j}" data-focus="var-${i}-${j}" aria-label="Variationen Set ${j+1}${overridden?' (angepasst)':''}" aria-expanded="${openPanels.includes(panel)}" aria-controls="${panel}" title="${esc(variationSummary(e,s))}">VAR${overridden?' •':''}</button><button type="button" class="drop-set" data-op="drop" data-block="${i}" data-set="${j}" aria-label="Set ${j+1} entfernen">×</button></div>
     <details class="set-variation-panel" id="${panel}" data-panel="${panel}" ${openPanels.includes(panel)?'open':''}><summary class="sr-only">Variationen Set ${j+1}</summary><div class="mini-head"><strong>Variationen · Set ${j+1}</strong><button type="button" data-op="set-variations" data-block="${i}" data-set="${j}" aria-label="Variationen Set ${j+1} schließen">✕</button></div><p class="hint">${overridden?'Dieses Set hat eigene Einstellungen.':'Dieses Set verwendet die Vorgabe der Übung.'}</p>${variationMarkup(e,i,j)}<button type="button" data-op="reset-variations" data-block="${i}" data-set="${j}">Vorgabe der Übung übernehmen</button></details>`;
   }).join('')}</div><button type="button" data-op="add" data-block="${i}">＋ Set hinzufügen</button></div>`;
 }).join('');
 if(focusKey){const next=[...document.querySelectorAll('[data-focus]')].find(el=>el.dataset.focus===focusKey);next?.focus({preventScroll:true})}
 renderTimer(emom);
}
function readBlocks(validate=false){
 document.querySelectorAll('#blocks input[data-key]').forEach(el=>{
  const e=blocks[+el.dataset.block],s=e.sets[+el.dataset.set];
  if(el.dataset.key==='weight'){
   const value=el.value===''?'':Number(el.value);
   if(validate&&((value!==''&&(!Number.isFinite(value)||value<0||value>10000))||(value===''&&weightModeFor(e,s)!=='none')))throw Error('Bitte ein gültiges Gewicht in kg für jedes Set mit Weste oder Gürtel eingeben.');
   s.weight=value;return;
  }
  if(measureFor(e)==='seconds'){
   const n=Number(el.value);if(validate&&(!Number.isFinite(n)||n<=0||n>10000))throw Error('Bitte gültige Sekunden eingeben.');
   s.seconds=el.value===''?'':n;s.reps=Number.isFinite(n)&&n>0?Math.round(n):1;delete s.partsText;
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
 if(op==='add')e.sets.push({reps:10,weight:'',partsText:'10'});
 if(op==='drop')e.sets.splice(j,1);
 if(op==='up'&&i>0)[blocks[i-1],blocks[i]]=[blocks[i],blocks[i-1]];
 renderBlocks(['remove','drop','up'].includes(op)?[]:panels);
}
function renderTimer(emom){
 const area=$('#timerArea');if(!area)return;
 if(!emom){resetEmom();area.innerHTML='';return}
 if(!$('#timerClock'))area.innerHTML='<div class="timer"><strong id="timerClock">Bereit</strong><p id="timerMinute">EMOM Timer</p><div class="actions"><button type="button" id="timerStart">Start</button><button type="button" id="timerPause">Pause</button><button type="button" id="timerReset">Zurücksetzen</button></div><p class="hint">Für nachträgliche Einträge muss der Timer nicht gestartet werden.</p></div>';
 $('#timerStart').onclick=startEmom;$('#timerPause').onclick=pauseEmom;$('#timerReset').onclick=resetEmom;
 timerDisplay();
}
function timerDisplay(){
 if(!emomTimer)return;
 const elapsed=emomTimer.elapsed+(emomTimer.running?(performance.now()-emomTimer.started)/1000:0),total=emomTimer.minutes*60;
 const t=$('#timerClock'),m=$('#timerMinute');if(!t||!m)return;
 if(elapsed<3){t.textContent=String(Math.ceil(3-elapsed));m.textContent='Start in';return}
 const passed=Math.max(0,elapsed-3),minute=Math.min(emomTimer.minutes,Math.floor(passed/60)+1),remaining=Math.max(0,60-Math.floor(passed%60));
 t.textContent=passed>=total?'Fertig':String(remaining).padStart(2,'0')+' s';m.textContent='Minute '+minute+' von '+emomTimer.minutes;
 if(passed>=total){if(emomTimer.running)pauseEmom();m.textContent='Training abgeschlossen'}
}
function startEmom(){
 if(emomTimer?.running)return;
 const minutes=Number($('#emomMinutes')?.value);
 if(!Number.isInteger(minutes)||minutes<1||minutes>240){toast('Ungültige EMOM Dauer');return}
 if(!emomTimer)emomTimer={minutes,elapsed:0};
 emomTimer.minutes=minutes;emomTimer.started=performance.now();emomTimer.running=true;
 emomTimer.interval=setInterval(timerDisplay,150);timerDisplay();
}
function pauseEmom(){if(!emomTimer?.running)return;emomTimer.elapsed+=(performance.now()-emomTimer.started)/1000;emomTimer.running=false;clearInterval(emomTimer.interval);timerDisplay()}
function resetEmom(){pauseEmom();emomTimer=null;if($('#timerClock'))$('#timerClock').textContent='Bereit';if($('#timerMinute'))$('#timerMinute').textContent='EMOM Timer'}
$('#editor').addEventListener('close',resetEmom);
