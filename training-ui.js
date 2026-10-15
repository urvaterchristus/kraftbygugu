
let emomTimer=null;
function measureFor(e){return find('exercises',e.exerciseId)?.measure||'reps'}
function variationMarkup(e,i,j=null){
 const exercise=find('exercises',e.exerciseId);
 const selected=j===null?(e.variations||{}):KraftlogModel.resolveVariations(e,e.sets[j]);
 return (exercise?.variationCategoryIds||[]).map(cid=>{
 const c=data.variationCategories.find(c=>c.id===cid);if(!c)return '';
 const v=selected[cid]||{},oid=v.optionId||'';
 return '<div class="variation-choice"><label>'+esc(c.name)+'</label><select data-variation="'+esc(cid)+'" data-block="'+i+'" '+(j===null?'':'data-set="'+j+'"')+'><option value="">Keine Auswahl</option>'+c.options.map(o=>'<option value="'+esc(o.id)+'" '+(oid===o.id?'selected':'')+'>'+esc(o.name)+'</option>').join('')+'</select>'+ (c.options.find(o=>o.id===oid)?.extra?'<label>'+esc(c.options.find(o=>o.id===oid).extra.unit)+'</label><input type="number" step="any" min="0" data-extra="'+esc(cid)+'" data-block="'+i+'" '+(j===null?'':'data-set="'+j+'"')+' value="'+esc(v.value??'')+'">':'')+'</div>'
 }).join('');
}
function renderBlocks(){
 const emom=$('#method')?.value==='emom';
 if($('#emomSettings'))$('#emomSettings').hidden=!emom;
 $('#blocks').innerHTML=blocks.map((e,i)=>{
 const seconds=measureFor(e)==='seconds';
 const label=seconds?'Sekunden':'Wiederholungen (z. B. 5+2)';
 return '<div class="exercise-block"><div class="mini-head"><h3>'+esc(e.name||name(e.exerciseId))+'</h3><div><button type="button" data-op="up" data-block="'+i+'">↑</button><button type="button" data-op="remove" data-block="'+i+'">✕</button></div></div><p class="hint">Vorauswahl für diese Übung</p>'+variationMarkup(e,i)+e.sets.map((s,j)=>'<div class="set-detail"><label>'+(emom?'Minute '+(j+1):'Satz '+(j+1))+' · '+label+'</label><input required data-block="'+i+'" data-set="'+j+'" data-key="partsText" inputmode="text" value="'+esc(seconds?(s.seconds??s.reps??''):(s.partsText??s.reps??''))+'"><details><summary>Variationen für diesen Satz ändern</summary>'+variationMarkup(e,i,j)+'</details><button type="button" data-op="drop" data-block="'+i+'" data-set="'+j+'">Satz entfernen</button></div>').join('')+'<button type="button" data-op="add" data-block="'+i+'">＋ Satz hinzufügen</button></div>'
 }).join('');
 if(emom&&$('#timerArea'))$('#timerArea').innerHTML='<div class="timer"><strong id="timerClock">Bereit</strong><p id="timerMinute">EMOM Timer</p><label><input type="checkbox" id="timerSound" checked> Ton an</label><div class="actions"><button type="button" id="timerStart">Start</button><button type="button" id="timerPause">Pause</button><button type="button" id="timerReset">Zurücksetzen</button></div><p class="hint">Für nachträgliche Einträge muss der Timer nicht gestartet werden.</p></div>';
 else if($('#timerArea'))$('#timerArea').innerHTML='';
 if($('#timerStart'))$('#timerStart').onclick=startEmom;
 if($('#timerPause'))$('#timerPause').onclick=pauseEmom;
 if($('#timerReset'))$('#timerReset').onclick=resetEmom;
}
function readBlocks(){
 document.querySelectorAll('#blocks input[data-key]').forEach(el=>{
 const e=blocks[+el.dataset.block],s=e.sets[+el.dataset.set];
 if(measureFor(e)==='seconds'){const n=Number(el.value);s.seconds=n;s.reps=Number.isFinite(n)&&n>0?Math.round(n):1;delete s.partsText}
 else {const p=KraftlogModel.parseParts(el.value);s.partsText=p.parts.join('+');s.reps=p.total;s.parts=p.parts;}
 });
 document.querySelectorAll('#blocks select[data-variation]').forEach(el=>{
 const e=blocks[+el.dataset.block],s=el.dataset.set===undefined?e:e.sets[+el.dataset.set],cid=el.dataset.variation;
 s.variations??={};if(el.value){const old=s.variations[cid]||{};s.variations[cid]={...old,optionId:el.value}}else delete s.variations[cid];
 });
 document.querySelectorAll('#blocks input[data-extra]').forEach(el=>{
 const e=blocks[+el.dataset.block],s=el.dataset.set===undefined?e:e.sets[+el.dataset.set],cid=el.dataset.extra;
 if(s.variations?.[cid])s.variations[cid].value=el.value===''?'':Number(el.value);
 });
}
let audioContext;
function beep(){
 if(!$('#timerSound')?.checked)return;
 try{audioContext??=new (window.AudioContext||window.webkitAudioContext)();audioContext.resume();const o=audioContext.createOscillator(),g=audioContext.createGain();o.frequency.value=880;g.gain.value=.12;o.connect(g);g.connect(audioContext.destination);o.start();o.stop(audioContext.currentTime+.18)}catch(e){}
}
function timerDisplay(){
 if(!emomTimer)return;
 const elapsed=emomTimer.elapsed+(emomTimer.running?(performance.now()-emomTimer.started)/1000:0);
 const total=emomTimer.minutes*60;
 const t=$('#timerClock'),m=$('#timerMinute');if(!t||!m)return;
 if(elapsed<3){t.textContent=String(Math.ceil(3-elapsed));m.textContent='Start in';return}
 const passed=Math.max(0,elapsed-3),minute=Math.min(emomTimer.minutes,Math.floor(passed/60)+1);
 const remaining=Math.max(0,60-Math.floor(passed%60));
 t.textContent=passed>=total?'Fertig':String(remaining).padStart(2,'0')+' s';
 m.textContent='Minute '+minute+' von '+emomTimer.minutes;
 const tick=Math.floor(passed/60);
 if(emomTimer.running&&tick!==emomTimer.lastTick&&passed<total){emomTimer.lastTick=tick;beep()}
 if(passed>=total&&emomTimer.running){beep();pauseEmom();m.textContent='Training abgeschlossen'}
}
function startEmom(){
 if(emomTimer?.running)return;
 const minutes=Number($('#emomMinutes')?.value);
 if(!Number.isInteger(minutes)||minutes<1||minutes>240){toast('Ungültige EMOM Dauer');return}
 if(!emomTimer)emomTimer={minutes,elapsed:0,lastTick:-1};
 emomTimer.minutes=minutes;emomTimer.started=performance.now();emomTimer.running=true;
 emomTimer.interval=setInterval(timerDisplay,150);timerDisplay();
}
function pauseEmom(){if(!emomTimer?.running)return;emomTimer.elapsed+=(performance.now()-emomTimer.started)/1000;emomTimer.running=false;clearInterval(emomTimer.interval);timerDisplay()}
function resetEmom(){pauseEmom();emomTimer=null;if($('#timerClock'))$('#timerClock').textContent='Bereit';if($('#timerMinute'))$('#timerMinute').textContent='EMOM Timer'}
