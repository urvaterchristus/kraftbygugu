function exerciseMedia(exercise={}){
 return {image:exercise.previewImage||(exercise.mediaType!=='video'?exercise.media:'')||'',video:exercise.exerciseVideo||(exercise.mediaType==='video'?exercise.media:'')||''};
}
function exerciseGallery(exercise){
 const {image,video}=exerciseMedia(exercise);if(!image&&!video)return '';
 return `<section class="exercise-gallery" aria-label="Medien für ${esc(exercise.name||'Übung')}"><div class="media-track"><div class="media-page">${image?`<img src="${esc(image)}" alt="Vorschaubild: ${esc(exercise.name)}" loading="lazy" draggable="false">`:'<div class="no-preview">Noch kein Vorschaubild</div>'}</div>${video?`<div class="media-page"><video src="${esc(video)}" ${image?`poster="${esc(image)}"`:''} controls playsinline preload="metadata" aria-label="Video: ${esc(exercise.name)}"></video></div>`:''}</div>${video?'<div class="media-controls"><button type="button" data-media-index="0" aria-pressed="true">Bild</button><span>Nach rechts wischen</span><button type="button" data-media-index="1" aria-pressed="false">Video →</button></div>':''}</section>`;
}
async function readExerciseMedia(file,kind){
 if(!file.type.startsWith(kind+'/'))throw Error(kind==='image'?'Bitte ein Bild auswählen.':'Bitte ein Video auswählen.');
 if(file.size>30*1024*1024)throw Error('Maximal 30 MB pro Datei.');
 return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Die Mediendatei konnte nicht gelesen werden.'));reader.readAsDataURL(file)});
}
document.addEventListener('click',event=>{
 const button=event.target.closest('[data-media-index]');if(!button)return;
 const track=button.closest('.exercise-gallery').querySelector('.media-track');
 track.scrollTo({left:-Number(button.dataset.mediaIndex)*track.clientWidth,behavior:'smooth'});
});
document.addEventListener('scroll',event=>{
 const track=event.target;if(!track.classList?.contains('media-track'))return;
 const left=track.getBoundingClientRect().left;
 let active=0,distance=Infinity;
 [...track.children].forEach((page,i)=>{const delta=Math.abs(page.getBoundingClientRect().left-left);if(delta<distance){distance=delta;active=i}});
 track.closest('.exercise-gallery').querySelectorAll('[data-media-index]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.mediaIndex)===active)));
 track.querySelectorAll('video').forEach(video=>{if(video.closest('.media-page')!==track.children[active])video.pause()});
},true);
