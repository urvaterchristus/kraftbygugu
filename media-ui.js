function exerciseMedia(exercise={}){
 return {image:exercise.previewImage||(exercise.mediaType!=='video'?exercise.media:'')||'',video:exercise.exerciseVideo||(exercise.mediaType==='video'?exercise.media:'')||''};
}
function exerciseThumbnail(exercise={}){
 return exercise.thumbnail?`<img class="exercise-thumb" src="${esc(exercise.thumbnail)}" alt="" width="44" height="44" loading="lazy" decoding="async">`:'<span class="exercise-thumb thumb-placeholder" aria-hidden="true">◇</span>';
}
function exerciseCompact(exercise={},actions=true){
 return `<div class="exercise-compact">${exerciseThumbnail(exercise)}<div class="exercise-label"><strong>${esc(exercise.name||'Übung')}</strong>${exercise.exerciseType?`<span>${esc(exercise.exerciseType)}</span>`:''}</div>${actions&&exercise.id?`<button type="button" data-view-exercise="${esc(exercise.id)}" aria-label="${esc(exercise.name)} ansehen">Ansehen</button>`:''}</div>`;
}
// Only rendered inside the viewer. Neither image nor video has a source yet.
function exerciseGallery(exercise){
 const {image,video}=exerciseMedia(exercise);if(!image&&!video)return '<p class="hint">Noch keine Bilder oder Videos hinterlegt.</p>';
 return `<section class="exercise-gallery" aria-label="Medien für ${esc(exercise.name||'Übung')}"><div class="media-track"><div class="media-page">${image?`<img data-view-image alt="Vorschaubild: ${esc(exercise.name)}" decoding="async" draggable="false">`:'<div class="no-preview">Noch kein Vorschaubild</div>'}</div>${video?`<div class="media-page"><video controls playsinline preload="none" aria-label="Video: ${esc(exercise.name)}"></video><p class="media-load-status" role="status">Video wird erst beim Öffnen geladen.</p></div>`:''}</div>${video?'<div class="media-controls"><button type="button" data-media-index="0" aria-pressed="true">Bild</button><span>Nach rechts wischen</span><button type="button" data-media-index="1" aria-pressed="false">Video →</button></div>':''}</section>`;
}
async function readExerciseMedia(file,kind){
 if(!file.type.startsWith(kind+'/'))throw Error(kind==='image'?'Bitte ein Bild auswählen.':'Bitte ein Video auswählen.');
 if(file.size>30*1024*1024)throw Error('Maximal 30 MB pro Datei.');
 return GuGuMediaStorage.put(file);
}
let activeExerciseViewer=null,viewerGeneration=0;
function releaseExerciseViewer(){
 viewerGeneration++;const active=activeExerciseViewer;activeExerciseViewer=null;if(!active)return;
 const video=document.querySelector('#exerciseViewer video');if(video){video.pause();video.removeAttribute('src');video.load();}
 document.querySelector('#exerciseViewer [data-view-image]')?.removeAttribute('src');active.urls.forEach(url=>URL.revokeObjectURL(url));
 document.querySelector('#exerciseViewerBody').replaceChildren();
}
async function loadViewerVideo(){
 const active=activeExerciseViewer;if(!active||active.loading||active.loaded||!active.video)return;
 const generation=viewerGeneration,dialog=$('#exerciseViewer');active.loading=true;
 const status=dialog.querySelector('.media-load-status');if(status)status.textContent='Video wird geladen …';
 try{const blob=await GuGuMediaStorage.get(active.video);if(generation!==viewerGeneration)return;const url=URL.createObjectURL(blob);active.urls.push(url);const video=dialog.querySelector('video');video.src=url;video.load();active.loaded=true;if(status)status.hidden=true;}
 catch(error){if(generation===viewerGeneration&&status)status.textContent=error.message||'Video konnte nicht geladen werden.';}
 finally{active.loading=false;}
}
function viewerVariationChanges(entry,set){
 const base=entry.variations||{},actual=KraftlogModel.resolveVariations(entry,set||{});
 const equivalent=(a={},b={})=>(a.optionId||'')===(b.optionId||'')&&(!(a.optionId||b.optionId)||String(a.value??'')===String(b.value??''));
 const categories=new Set([...new Set([...Object.keys(base),...Object.keys(actual)])].filter(id=>!equivalent(base[id],actual[id])));
 const modeChanged=(set?.weightMode??entry.weightMode??'none')!==(entry.weightMode??'none');
 return {changed:modeChanged||categories.size>0,modeChanged,categories};
}
function viewerSelection(exercise,entry,set){
 const selected=KraftlogModel.resolveVariations(entry,set||{}),mode=set?.weightMode??entry.weightMode??'none',changes=viewerVariationChanges(entry,set),baseMode=entry.weightMode??'none';
 const chip=(label,on,previous=false)=>`<button type="button"${previous?' class="viewer-previous" title="Voreinstellung – in diesem Set geändert"':''} disabled aria-pressed="${on}">${esc(label)}</button>`;
 const ids=new Set([...(exercise.variationCategoryIds||[]),...Object.keys(selected)]);
 const categories=GuGuProgress.alphabetical(data.variationCategories.filter(c=>ids.has(c.id)));
 return '<div class="viewer-selection"><h4>Zusatzgewicht</h4><div class="choice-buttons">'+[['none','Ohne'],['vest','Gewichtsweste'],['belt','Gewichtsgürtel']].map(([id,label])=>chip(label,mode===id,changes.modeChanged&&baseMode===id)).join('')+'</div>'+categories.map(c=>{
  const value=selected[c.id]||{},option=c.options.find(o=>o.id===value.optionId),base=entry.variations?.[c.id]||{},changed=changes.categories.has(c.id),previousId=base.optionId||'';
  return `<h4>${esc(c.name)}</h4><div class="choice-buttons">${chip('Keine Auswahl',!value.optionId,changed&&!previousId&&!!value.optionId)}${c.options.map(o=>chip(o.name,o.id===value.optionId,changed&&o.id===previousId&&o.id!==value.optionId)).join('')}${value.optionId&&!option?chip('Nicht mehr vorhandene Option',true):''}</div>${option?.extra&&value.value!==undefined&&value.value!==''?`<p>${esc(value.value)} ${esc(option.extra.unit)}${changed&&previousId===value.optionId&&String(base.value??'')!==String(value.value??'')?` <span class="viewer-previous-value">Vorgabe: ${esc(base.value??'–')} ${esc(option.extra.unit)}</span>`:''}</p>`:''}`;
 }).join('')+'</div>';
}
function viewerVariations(exercise,entry){
 if(entry){
  const seconds=(entry.measure||exercise.measure)==='seconds';
  return '<section class="viewer-variations"><h3>Einstellungen dieser Übung</h3>'+viewerSelection(exercise,entry)+'<h3>Sets</h3><div class="viewer-set-table"><div class="viewer-set-head"><span>Set</span><span>Kg</span><span>'+ (seconds?'SEK':'WDH')+'</span></div>'+(entry.sets||[]).map((set,i)=>{const changed=viewerVariationChanges(entry,set).changed;return `<div class="viewer-set-row"><span>${i+1}</span><span>${esc(set.weight??'–')}</span><span>${esc(seconds?(set.seconds??set.reps):(set.partsText??set.reps))}</span><details${changed?' class="has-variation-changes"':''}><summary>Variationen · Set ${i+1}${changed?'<span class="variation-change-label">Geändert</span>':''}</summary>${viewerSelection(exercise,entry,set)}</details></div>`;}).join('')+'</div></section>';
 }
 const categories=GuGuProgress.alphabetical(data.variationCategories.filter(c=>(exercise.variationCategoryIds||[]).includes(c.id)&&(c.scope!=='exercise'||c.exerciseId===exercise.id)));
 return '<section class="viewer-variations"><h3>Variationsoptionen</h3><h4>Zusatzgewicht</h4><div class="viewer-options"><span>Ohne</span><span>Gewichtsweste</span><span>Gewichtsgürtel</span></div>'+categories.map(c=>`<h4>${esc(c.name)}</h4><div class="viewer-options">${c.options.map(o=>`<span>${esc(o.name)}${o.extra?' ('+esc(o.extra.unit)+')':''}</span>`).join('')}</div>`).join('')+'</section>';
}
async function viewExercise(id,entry){
 const exercise=find('exercises',id);if(!exercise){toast('Diese Übung ist nicht mehr vorhanden.');return;}
 releaseExerciseViewer();const generation=viewerGeneration,media=exerciseMedia(exercise);activeExerciseViewer={...media,urls:[],loaded:false,loading:false};
 $('#exerciseViewerTitle').textContent=exercise.name;$('#exerciseViewerBody').innerHTML=exerciseGallery(exercise)+(exercise.notes?`<p class="viewer-notes">${esc(exercise.notes)}</p>`:'')+viewerVariations(exercise,entry);$('#exerciseViewer').showModal();
 if(media.image)try{const blob=await GuGuMediaStorage.get(media.image);if(generation!==viewerGeneration)return;const url=URL.createObjectURL(blob);activeExerciseViewer.urls.push(url);$('#exerciseViewer [data-view-image]').src=url;}catch(error){if(generation===viewerGeneration)$('#exerciseViewerBody').insertAdjacentHTML('afterbegin',`<p role="alert">${esc(error.message)}</p>`);}
}
document.addEventListener('click',event=>{
 const viewerButton=event.target.closest('[data-view-exercise]');if(viewerButton){const context=viewerButton.dataset;let entry;if(context.viewDraft==='true'){readBlocks();entry=blocks[Number(context.viewEntry)];}else if(context.viewRecordId){entry=find(context.viewRecordType,context.viewRecordId)?.entries[Number(context.viewEntry)];}viewExercise(context.viewExercise,entry?.exerciseId===context.viewExercise?structuredClone(entry):null);return;}
 if(event.target.closest('#closeExerciseViewer')){$('#exerciseViewer').close();return;}
 const button=event.target.closest('[data-media-index]');if(!button)return;
 const track=button.closest('.exercise-gallery').querySelector('.media-track');
 if(button.dataset.mediaIndex==='1')loadViewerVideo();
 track.scrollTo({left:-Number(button.dataset.mediaIndex)*track.clientWidth,behavior:'smooth'});
});
document.addEventListener('scroll',event=>{
 const track=event.target;if(!track.classList?.contains('media-track'))return;
 const left=track.getBoundingClientRect().left;let active=0,distance=Infinity;
 [...track.children].forEach((page,i)=>{const delta=Math.abs(page.getBoundingClientRect().left-left);if(delta<distance){distance=delta;active=i;}});
 track.closest('.exercise-gallery').querySelectorAll('[data-media-index]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.mediaIndex)===active)));
 if(active===1)loadViewerVideo();
 track.querySelectorAll('video').forEach(video=>{if(video.closest('.media-page')!==track.children[active])video.pause();});
},true);
document.addEventListener('visibilitychange',()=>{if(document.hidden)document.querySelectorAll('video').forEach(v=>v.pause());});
function exerciseViewButtons(id,context={}){
 const attrs=context.draft?` data-view-draft="true" data-view-entry="${context.index}"`:context.recordId?` data-view-record-type="${esc(context.type)}" data-view-record-id="${esc(context.recordId)}" data-view-entry="${context.index}"`:'';
 return id?`<div class="exercise-view-actions"><button type="button" data-view-exercise="${esc(id)}"${attrs}>Ansehen</button>${context.type==='workouts'?'':`<button type="button" data-edit-exercise="${esc(id)}">Bearbeiten</button>`}</div>`:'';
}
function containsMediaReferences(state){const owners=[...(state?.exercises||[]),...(state?.trash||[]).filter(t=>t.type==='exercises').map(t=>t.record)];return owners.some(e=>['previewImage','exerciseVideo','media'].some(field=>GuGuMediaStorage.isRef(e[field])));}
document.addEventListener('click',event=>{const button=event.target.closest('[data-edit-exercise]');if(!button)return;const id=button.dataset.editExercise;if(!find('exercises',id))return;if($('#editor').open)editorNavigation.push(draftSnapshot());open('exercises',id);});
document.querySelector('#exerciseViewer').addEventListener('close',releaseExerciseViewer);
document.querySelector('#storageUpgrade').addEventListener('cancel',event=>event.preventDefault());
