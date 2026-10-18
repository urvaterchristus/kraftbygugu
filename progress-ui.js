let editorNavigation=[],pendingSetChange=null;
const manuallyEdited=new WeakMap();
let exerciseTypeFilter='',variationTypeFilter='';
function typeOptions(value=''){return '<option value="">Alle Typen</option>'+GuGuProgress.types.map(t=>`<option ${t===value?'selected':''}>${esc(t)}</option>`).join('');}
function validStarterLinks(d){const ids=new Set(d.exercises.map(e=>e.id)),cats=new Set(d.variationCategories.map(c=>c.id));return d.exercises.every(e=>(e.variationCategoryIds||[]).every(id=>cats.has(id)))&&d.variationCategories.every(c=>c.scope!=='exercise'||ids.has(c.exerciseId))&&d.routines.every(r=>r.entries.every(e=>e.type==='pause'||ids.has(e.exerciseId)));}
function suggestHistory(entry,index=null){
 entry.sets.forEach((set,j)=>{if(index!==null&&index!==j)return;
  const values=GuGuProgress.numbers(GuGuProgress.previous(data.workouts,entry,set,j,editing?.id),measureFor(entry)==='seconds'),dirty=manuallyEdited.get(set)||new Set();
  if(!dirty.has('partsText')){set.reps=values.reps;if(measureFor(entry)==='seconds'){set.seconds=values.seconds;delete set.partsText}else{set.partsText=values.partsText;delete set.parts;}}
  if(!dirty.has('weight'))set.weight=values.weight;
 });
}
function markEdited(input){const e=blocks[+input.dataset.block],s=e?.sets[+input.dataset.set];if(!s)return;const dirty=manuallyEdited.get(s)||new Set();dirty.add(input.dataset.key);manuallyEdited.set(s,dirty);}
document.addEventListener('focusin',event=>{
 const el=event.target;if(!el.matches?.('#blocks input[data-key],#blocks input[data-extra],#blocks input[data-pause],#duration,#emomMinutes'))return;
 el.dataset.beforeEdit=el.value;el.value='';
});
document.addEventListener('input',event=>{if(event.target.matches?.('#blocks input[data-key]'))markEdited(event.target);});
document.addEventListener('focusout',event=>{const el=event.target;if(el.dataset?.beforeEdit!==undefined&&el.value==='')el.value=el.dataset.beforeEdit;});
document.addEventListener('change',event=>{
 const el=event.target;if(!el.matches?.('#blocks input[data-key="partsText"][data-set="0"]')||el.value===''||el.value===el.dataset.beforeEdit)return;
 const i=+el.dataset.block,e=blocks[i];if(!e||measureFor(e)!=='reps'||e.sets.length<2)return;
 let parsed;try{parsed=KraftlogModel.parseParts(el.value)}catch{return}
 readBlocks();const value=el.value;
 pendingSetChange=(async()=>{
  if(await confirmAction('WDH '+value+' für alle '+e.sets.length+' Sets dieser Übung übernehmen?','Alle Sets ändern')){
   e.sets.forEach((s,j)=>{s.partsText=value;s.parts=[...parsed.parts];s.reps=parsed.total;const dirty=manuallyEdited.get(s)||new Set();dirty.add('partsText');manuallyEdited.set(s,dirty);const field=$(`#blocks input[data-block="${i}"][data-set="${j}"][data-key="partsText"]`);if(field){field.value=value;field.dataset.beforeEdit=value}});
  }
 })().finally(()=>{pendingSetChange=null});
});
function draftSnapshot(kind='editor'){
 if($('#blocks'))readBlocks();return {kind,editing:{...editing},blocks,nodes:[...$('#fields').childNodes],title:$('#dialogTitle').textContent,scroll:$('#editor').scrollTop,submitHidden:$('#editorForm .dialog-actions').hidden};
}
function updateBackButton(){const back=editorNavigation.length||parentDraft;$('#close').textContent=back?'←':'✕';$('#close').setAttribute('aria-label',back?'Zurück':'Schließen');}
function returnEditorDraft(){
 const d=editorNavigation.pop();if(!d)return;
 editing=d.editing;blocks=d.blocks;$('#fields').replaceChildren(...d.nodes);$('#dialogTitle').textContent=d.title;$('#formError').textContent='';$('#editorForm .dialog-actions').hidden=d.submitHidden;syncEditorDelete();
 if(d.kind==='manager')renderVariationManager();else{
  if($('#exerciseCategories'))renderExerciseCategories();
  if($('#blocks')){renderBlocks(rememberBlockUI(),null,false);updateExercisePicker();}
 }
 updateBackButton();$('#editor').scrollTop=d.scroll;
}
function renderExerciseCategories(){const x=editing.id?find('exercises',editing.id):null;const host=$('#exerciseCategories');const selected=host.dataset.initialized?[...host.querySelectorAll('input:checked')].map(el=>el.value):(x?.variationCategoryIds||[]);const known=new Set(JSON.parse(host.dataset.knownCategories||'[]'));for(const c of data.variationCategories)if(c.scope==='exercise'&&c.exerciseId===editing.id&&!known.has(c.id))selected.push(c.id);host.dataset.knownCategories=JSON.stringify(data.variationCategories.map(c=>c.id));host.dataset.initialized='true';host.innerHTML=GuGuProgress.alphabetical(data.variationCategories.filter(c=>c.scope!=='exercise'||c.exerciseId===editing.id)).map(c=>`<label><input type="checkbox" class="category-check" value="${esc(c.id)}" ${selected.includes(c.id)?'checked':''} style="width:auto"> ${esc(c.name)}</label>`).join('');}
function updateExercisePicker(){const picker=$('#exercisePick');if(!picker)return;const selected=picker.value,type=$('#pickerType')?.value||'';picker.innerHTML='<option value="">Übung auswählen oder neu anlegen …</option>'+GuGuProgress.alphabetical(data.exercises).filter(e=>!type||e.exerciseType===type).map(e=>`<option value="${e.id}" ${selected===e.id?'selected':''}>${esc(e.name)}</option>`).join('')+'<option value="__new__">＋ Neue Übung anlegen</option>';}
function enhanceEditor(){
 $('#editorForm .dialog-actions').hidden=false;
 if(editing.type==='exercises'){
  $('#exerciseCategories').dataset.initialized='true';$('#exerciseCategories').dataset.knownCategories=JSON.stringify(data.variationCategories.map(c=>c.id));const x=editing.id?find('exercises',editing.id):null,measure=$('label[for="measure"]');measure.insertAdjacentHTML('beforebegin','<label for="exerciseType">Übungstyp</label><select id="exerciseType"><option value="">Nicht zugeordnet</option>'+GuGuProgress.types.map(t=>`<option ${x?.exerciseType===t?'selected':''}>${esc(t)}</option>`).join('')+'</select>');
  $('#fields').insertAdjacentHTML('beforeend','<button type="button" id="manageExerciseVariations">Variationen / Kategorien bearbeiten</button>');$('#manageExerciseVariations').onclick=showVariationManager;
 }
 if(editing.type==='variations'){
  const updatePrefix=()=>{if($('#scope').value==='exercise'&&$('#ownerExercise').value){$('#name').value=GuGuProgress.categoryName($('#name').value,name($('#ownerExercise').value));}};
  $('#scope').addEventListener('change',updatePrefix);$('#ownerExercise').addEventListener('change',updatePrefix);updatePrefix();
 }
 if($('#exercisePick')){
  $('#exercisePick').closest('.entry-composer').insertAdjacentHTML('afterbegin','<label for="pickerType">Übungstyp filtern</label><select id="pickerType">'+typeOptions()+'</select>');$('#pickerType').onchange=updateExercisePicker;
 }
 if($('#location')){$('#location').setAttribute('list','knownLocations');$('#location').insertAdjacentHTML('afterend','<datalist id="knownLocations">'+[...new Set(data.workouts.map(w=>w.location?.trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'de')).map(v=>`<option value="${esc(v)}"></option>`).join('')+'</datalist>');}
 if(editing.type==='workouts'&&!editing.id&&editing.routineId){blocks.forEach(e=>{if(e.type!=='pause')suggestHistory(e)});renderBlocks([],null,false);}
 if($('#routinePick'))$('#routinePick').addEventListener('change',()=>{if(!editing.routineId)return;blocks.forEach(e=>{if(e.type!=='pause')suggestHistory(e)});renderBlocks([],null,false);});
 updateBackButton();
}
function showVariationManager(){
 editorNavigation.push(draftSnapshot());editing={type:'variation-manager'};$('#dialogTitle').textContent='Variationen bearbeiten';$('#fields').innerHTML='<div id="variationManager"><label for="managerScope">Anzeigen</label><select id="managerScope"><option value="all">Alle</option><option value="global">Global</option><option value="exercise">Übungsspezifisch</option></select><div id="managerTypeField"><label for="managerType">Übungstyp</label><select id="managerType">'+typeOptions()+'</select></div><button type="button" id="managerAdd">＋ Kategorie hinzufügen</button><div id="managerList"></div></div>';
 $('#editorForm .dialog-actions').hidden=true;syncEditorDelete();$('#managerScope').onchange=$('#managerType').onchange=renderVariationManager;$('#managerAdd').onclick=()=>editManagedCategory();renderVariationManager();updateBackButton();$('#editor').scrollTop=0;
}
function renderVariationManager(){
 const scope=$('#managerScope').value,type=$('#managerType').value;$('#managerTypeField').hidden=scope!=='exercise';
 const categories=GuGuProgress.alphabetical(KraftlogModel.filterCategories(data.variationCategories,scope)).filter(c=>scope!=='exercise'||!type||find('exercises',c.exerciseId)?.exerciseType===type);
 $('#managerList').innerHTML=categories.map(c=>`<article class="card"><h3>${esc(c.name)}</h3><p>${c.scope==='exercise'?'Übung: '+esc(name(c.exerciseId)):'Global'}</p><button type="button" data-managed-category="${c.id}">Bearbeiten</button><button type="button" data-managed-copy="${c.id}">Kopieren</button></article>`).join('')||'<p>Noch keine passenden Kategorien.</p>';
 $('#managerList').onclick=event=>{const b=event.target.closest('[data-managed-category],[data-managed-copy]');if(b)editManagedCategory(b.dataset.managedCategory,b.dataset.managedCopy);};
}
function editManagedCategory(id,copyId){editorNavigation.push(draftSnapshot('manager'));const scope=$('#managerScope').value;open('variations',id,copyId?KraftlogModel.copyCategory(find('variations',copyId)):scope==='exercise'?{scope:'exercise'}:null);}
const originalRender=render;
render=function(){originalRender();const container=$('#typeFilters');if(!container)return;
 const specific=tab==='variations'&&variationFilter==='exercise',show=tab==='exercises'||specific;container.hidden=!show;if(!show)return;
 const selected=specific?variationTypeFilter:exerciseTypeFilter;container.innerHTML='<label for="libraryType">Übungstyp filtern</label><select id="libraryType">'+typeOptions(selected)+'</select>';
 const items=tab==='exercises'?data.exercises.filter(e=>!selected||e.exerciseType===selected):KraftlogModel.filterCategories(data.variationCategories,'exercise').filter(c=>!selected||find('exercises',c.exerciseId)?.exerciseType===selected);
 $('#content').innerHTML=GuGuProgress.alphabetical(items).map(card).join('')||'<div class="empty">Keine passenden Einträge.</div>';
 $('#libraryType').onchange=event=>{if(specific)variationTypeFilter=event.target.value;else exerciseTypeFilter=event.target.value;render()};
};
function createStarterFile(media){return new File([JSON.stringify({format:'gugu-starterset',version:1,exportedAt:new Date().toISOString(),media,data:GuGuProgress.starter(data,media)})],`gugu-uebungsstarterset-${media?'mit':'ohne'}-medien-${new Date().toISOString().slice(0,10)}.json`,{type:'application/json'});}
document.querySelectorAll('[data-starter]').forEach(button=>button.onclick=()=>{try{downloadBackup(createStarterFile(button.dataset.starter==='media'));toast('Übungsstarterset zum Herunterladen erstellt.')}catch{toast('Starterset konnte nicht erstellt werden.')}});
