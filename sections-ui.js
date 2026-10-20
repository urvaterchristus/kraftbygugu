function initializeSections(record){trainingSections=GuGuSections.fromRecord(record,blocks);activeSectionId=trainingSections[0].id;for(const s of trainingSections)if(s.method==='emom')GuGuSections.resize(blocks,s,Math.max(s.rounds||1,...GuGuSections.exercises(blocks,s.id).map(e=>e.sets.length)));}
function sectionForEntry(entry){return trainingSections.find(s=>s.id===entry.sectionId);}
function normalAppendSection(){
 let s=trainingSections.at(-1);
 if(!s||s.method!=='normal'){s={id:uid(),method:'normal',rounds:3};trainingSections.push(s);}
 activeSectionId=s.id;return s;
}
function refreshSectionComposer(){
 if($('#appendPause'))$('#appendPause').hidden=!blocks.some(e=>e.type!=='pause');
}
function renderSectionBlocks(entries,renderBlock){
 if(!trainingSections.length)return entries.map(renderBlock).join('');
 return trainingSections.map((s,index)=>{
  const content=entries.map((e,i)=>e.sectionId===s.id?renderBlock(e,i):'').join('');
  if(s.method!=='emom')return content;
  return `<section class="training-section emom-group" data-training-section="${esc(s.id)}"><div class="section-editor-head"><h3>EMOM</h3><div><button type="button" data-section-op="up" data-section-id="${esc(s.id)}" aria-label="EMOM nach oben" ${index===0?'disabled':''}>↑</button><button type="button" data-section-op="down" data-section-id="${esc(s.id)}" aria-label="EMOM nach unten" ${index===trainingSections.length-1?'disabled':''}>↓</button><button type="button" data-section-op="remove" data-section-id="${esc(s.id)}" aria-label="EMOM entfernen">✕</button></div></div><label for="emom-rounds-${index}">Minuten / Runden</label><input id="emom-rounds-${index}" type="number" min="1" max="240" step="1" value="${s.rounds}" data-section-rounds="${esc(s.id)}"><p class="hint">Jede Minute ein Set pro Übung.</p>${content}<label for="emom-exercise-${index}">Übung zum EMOM hinzufügen</label><div class="row"><select id="emom-exercise-${index}" data-emom-picker="${esc(s.id)}"><option value="">Übung auswählen …</option>${options('exercises')}<option value="__new__">＋ Neue Übung anlegen</option></select><button type="button" data-section-op="add-exercise" data-section-id="${esc(s.id)}" aria-label="Übung zum EMOM hinzufügen">＋</button></div><button type="button" data-section-op="pause" data-section-id="${esc(s.id)}">＋ Pause im EMOM hinzufügen</button></section>`;
 }).join('');
}
function setupSectionEditor(){
 if(!['workouts','routines'].includes(editing.type))return;
 const append=$('#appendExercise'),addExercise=append.onclick;
 append.onclick=()=>{readBlocks();normalAppendSection();addExercise();};
 $('#exercisePick').onchange=()=>{if($('#exercisePick').value==='__new__'){readBlocks();normalAppendSection();createExerciseFromEditor();}};
 $('#appendPause').onclick=()=>{readBlocks();if(!blocks.some(e=>e.type!=='pause'))return;normalAppendSection();blocks.push({type:'pause',minutes:2,sectionId:activeSectionId});renderBlocks();};
 refreshSectionComposer();
 $('#blocks').onchange=event=>{if(!event.target.dataset.sectionRounds)return;pendingSectionChange=handleSectionFieldChange(event).catch(error=>{$('#formError').textContent=error.message||'EMOM konnte nicht geändert werden.';}).finally(()=>{pendingSectionChange=null;});};
}
async function handleSectionFieldChange(event){
  const el=event.target;
  if(el.dataset.sectionTarget){readBlocks();const e=blocks[+el.dataset.sectionTarget],s=trainingSections.find(s=>s.id===el.value);e.sectionId=s.id;activeSectionId=s.id;if(s.method==='emom'){const count=Math.max(s.rounds,e.sets.length);GuGuSections.resize(blocks,s,count);}renderBlocks();return;}
  const id=el.dataset.sectionMethod||el.dataset.sectionRounds;if(!id)return;const s=trainingSections.find(s=>s.id===id);readBlocks();
  if(el.dataset.sectionMethod){s.method=el.value;if(s.method==='emom')GuGuSections.resize(blocks,s,Math.max(s.rounds||1,...GuGuSections.exercises(blocks,s.id).map(e=>e.sets.length)));}
  else{const count=Number(el.value);if(!Number.isInteger(count)||count<1||count>240){$('#formError').textContent='EMOM benötigt 1 bis 240 Minuten.';el.value=s.rounds;return;}if(count<s.rounds&&!await confirmAction('Auf '+count+' Minuten verkürzen? Dabei werden die überzähligen Sets nur aus diesem Abschnitt entfernt.','Minuten reduzieren')){el.value=s.rounds;return;}GuGuSections.resize(blocks,s,count);}
  $('#formError').textContent='';renderBlocks(rememberBlockUI(),el);

}

function exerciseSectionPicker(){return '';}
function serializeSections(){
 const sections=trainingSections.filter(s=>blocks.some(e=>e.sectionId===s.id));
 if(!GuGuSections.validate(sections,blocks))throw Error('Bitte EMOM-Abschnitte mit Übungen und einer passenden Anzahl an Minuten vervollständigen.');
 return {sections:structuredClone(sections),entries:structuredClone(GuGuSections.ordered(blocks,sections))};
}
document.addEventListener('click',async event=>{
 const add=event.target.closest('[data-add-section]');if(add){readBlocks();const s={id:uid(),method:'emom',rounds:3};trainingSections.push(s);activeSectionId=s.id;renderBlocks();return;}
 const button=event.target.closest('[data-section-op]');if(!button)return;readBlocks();const i=trainingSections.findIndex(s=>s.id===button.dataset.sectionId),s=trainingSections[i];if(!s)return;
 if(button.dataset.sectionOp==='add-exercise'){
  activeSectionId=s.id;const picker=document.querySelector(`[data-emom-picker="${s.id}"]`),id=picker.value;
  if(!id||id==='__new__'){createExerciseFromEditor();return;}
  blocks.push(makeExerciseBlock(id));renderBlocks([...rememberBlockUI(),`defaults-${blocks.length-1}`]);return;
 }
 if(button.dataset.sectionOp==='pause'){activeSectionId=s.id;blocks.push({type:'pause',minutes:2,sectionId:s.id});renderBlocks();return;}
 if(button.dataset.sectionOp==='remove'){if(blocks.some(e=>e.sectionId===s.id)&&!await confirmAction('Dieses EMOM mit allen enthaltenen Übungen aus dem Entwurf entfernen?','EMOM entfernen'))return;blocks=blocks.filter(e=>e.sectionId!==s.id);trainingSections.splice(i,1);if(!trainingSections.length)trainingSections=[{id:uid(),method:'normal',rounds:3}];if(activeSectionId===s.id)activeSectionId=trainingSections[0].id;}
 const j=i+(button.dataset.sectionOp==='up'?-1:1);if(['up','down'].includes(button.dataset.sectionOp)&&j>=0&&j<trainingSections.length)[trainingSections[i],trainingSections[j]]=[trainingSections[j],trainingSections[i]];
 renderBlocks();
});
