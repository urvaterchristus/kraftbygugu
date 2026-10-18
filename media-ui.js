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
function viewerVariations(exercise){
 const categories=GuGuProgress.alphabetical(data.variationCategories.filter(c=>(exercise.variationCategoryIds||[]).includes(c.id)&&(c.scope!=='exercise'||c.exerciseId===exercise.id)));
 return '<section class="viewer-variations"><h3>Variationsoptionen</h3><h4>Zusatzgewicht</h4><div class="viewer-options"><span>Ohne</span><span>Gewichtsweste</span><span>Gewichtsgürtel</span></div>'+categories.map(c=>`<h4>${esc(c.name)}</h4><div class="viewer-options">${c.options.map(o=>`<span>${esc(o.name)}${o.extra?' ('+esc(o.extra.unit)+')':''}</span>`).join('')}</div>`).join('')+'</section>';
}
async function viewExercise(id){
 const exercise=find('exercises',id);if(!exercise){toast('Diese Übung ist nicht mehr vorhanden.');return;}
 releaseExerciseViewer();const generation=viewerGeneration,media=exerciseMedia(exercise);activeExerciseViewer={...media,urls:[],loaded:false,loading:false};
 $('#exerciseViewerTitle').textContent=exercise.name;$('#exerciseViewerBody').innerHTML=exerciseGallery(exercise)+(exercise.notes?`<p class="viewer-notes">${esc(exercise.notes)}</p>`:'')+viewerVariations(exercise);$('#exerciseViewer').showModal();
 if(media.image)try{const blob=await GuGuMediaStorage.get(media.image);if(generation!==viewerGeneration)return;const url=URL.createObjectURL(blob);activeExerciseViewer.urls.push(url);$('#exerciseViewer [data-view-image]').src=url;}catch(error){if(generation===viewerGeneration)$('#exerciseViewerBody').insertAdjacentHTML('afterbegin',`<p role="alert">${esc(error.message)}</p>`);}
}
document.addEventListener('click',event=>{
 const viewerButton=event.target.closest('[data-view-exercise]');if(viewerButton){viewExercise(viewerButton.dataset.viewExercise);return;}
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
function exerciseViewButtons(id){return id?`<div class="exercise-view-actions"><button type="button" data-view-exercise="${esc(id)}">Ansehen</button><button type="button" data-edit-exercise="${esc(id)}">Bearbeiten</button></div>`:'';}
function containsMediaReferences(state){const owners=[...(state?.exercises||[]),...(state?.trash||[]).filter(t=>t.type==='exercises').map(t=>t.record)];return owners.some(e=>['previewImage','exerciseVideo','media'].some(field=>GuGuMediaStorage.isRef(e[field])));}
document.addEventListener('click',event=>{const button=event.target.closest('[data-edit-exercise]');if(!button)return;const id=button.dataset.editExercise;if(!find('exercises',id))return;if($('#editor').open)editorNavigation.push(draftSnapshot());open('exercises',id);});
document.querySelector('#exerciseViewer').addEventListener('close',releaseExerciseViewer);
document.querySelector('#storageUpgrade').addEventListener('cancel',event=>event.preventDefault());
