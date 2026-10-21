let mainPage='training',customizeTab='routines',analyticsMethod='normal',analyticsPeriod='month',analyticsExercise='',analyticsComparison='',analyticsMetric='set';
function analyticsLines(s){
 const labels=[s.weightMode==='vest'?'Gewichtsweste: '+s.weight+' kg':s.weightMode==='belt'?'Gewichtsgürtel: '+s.weight+' kg':'Ohne Zusatzgewicht'];
 const categories=GuGuProgress.orderedCategories(data.variationCategories.filter(c=>Object.hasOwn(s.variations||{},c.id)),find('exercises',s.exerciseId)?.variationCategoryIds);
 for(const c of categories){const v=s.variations[c.id],o=c.options.find(o=>o.id===v.optionId);if(o)labels.push(GuGuProgress.categoryLabel(c)+': '+o.name+(v.value!==''&&v.value!=null?' '+v.value+(o.extra?.unit?' '+o.extra.unit:''):''));}
 if(s.parts)labels.push('Mit Teilwiederholungen');labels.push(s.count+(s.count===1?' Set':' Sets'));return labels;
}
function analyticsDescription(s){return analyticsLines(s).join(' · ');}
function analyticsOverview(){
 const t=GuGuAnalytics.summary(data.workouts,analyticsPeriod),n=v=>Number(v).toLocaleString('de-DE');
 return `<div class="section-head"><div><p class="eyebrow">DEIN FORTSCHRITT</p><h1>Statistiken</h1></div></div><label for="analyticsPeriod">Zeitraum der Übersicht</label><select id="analyticsPeriod"><option value="month">Aktueller Monat</option><option value="year">Aktuelles Jahr</option><option value="all">Gesamt</option></select><div class="analytics-overview"><div><strong>${n(t.count)}</strong><span>Trainings</span></div><div><strong>${n(t.days)}</strong><span>Trainingstage</span></div><div><strong>${n(t.minutes)}</strong><span>Minuten</span></div></div>`;
}
function analyticsLatest(comparisons){return comparisons.reduce((latest,r)=>{const s=r.history.at(-1),prev=latest?.history.at(-1);return !prev||(s.date+s.time)>=(prev.date+prev.time)?r:latest;},null);}
function renderAnalytics(){
 const allSamples=GuGuAnalytics.samples(data.workouts),host=$('#analyticsPanel');
 if(!analyticsExercise){
  const ids=[...new Set(allSamples.map(s=>s.exerciseId))],exercises=GuGuProgress.alphabetical(ids.map(id=>({id,name:find('exercises',id)?.name||allSamples.find(s=>s.exerciseId===id)?.name||'Gelöschte Übung'})));
  host.innerHTML=analyticsOverview()+`<h2>Deine Übungen</h2><p class="hint">Übung auswählen und deinen Fortschritt ansehen.</p><div class="analytics-exercise-list">${exercises.map(e=>{const last=allSamples.filter(s=>s.exerciseId===e.id).at(-1);return `<button type="button" class="analytics-exercise-row" data-analytics-exercise="${esc(e.id)}">${exerciseThumbnail(find('exercises',e.id))}<span><strong>${esc(e.name)}</strong><small>Zuletzt ${new Date(last.date+'T12:00:00').toLocaleDateString('de-DE')}</small></span><span aria-hidden="true">›</span></button>`;}).join('')||'<p class="empty">Noch keine Trainings eingetragen.</p>'}</div>`;
  $('#analyticsPeriod').value=analyticsPeriod;$('#analyticsPeriod').onchange=e=>{analyticsPeriod=e.target.value;renderAnalytics();};return;
 }
 renderHighscoreDetail(host);
}
function analyticsChart(history){
 if(history.length<2)return '';
 const max=Math.max(1,...history.map(s=>s.score)),points=history.map((s,i)=>[16+i*288/(history.length-1),104-s.score/max*88]);
 return `<svg class="analytics-chart" viewBox="0 0 320 124" role="img" aria-label="Verlauf der Leistung; genaue Werte stehen darunter"><path d="M16 104H304" stroke="#354154"/><polyline points="${points.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#75a6ff" stroke-width="3"/>${points.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="#a7c7ff"/>`).join('')}</svg>`;
}
const renderBeforePages=render;
render=function(){
 renderBeforePages();const training=mainPage==='training',customize=mainPage==='customize';
 $('.dashboard').hidden=!training;$('.main-actions').hidden=!training;$('#customizeTabs').hidden=!customize;$('#analyticsPanel').hidden=mainPage!=='statistics';
 for(const selector of ['#listHeading','#content','#variationFilters','#typeFilters']){const el=$(selector);if(!el)continue;if(mainPage==='statistics')el.hidden=true;else if(selector==='#listHeading'||selector==='#content')el.hidden=false;}
 document.querySelectorAll('[data-page]').forEach(b=>{b.classList.toggle('active',b.dataset.page===mainPage);b.setAttribute('aria-pressed',String(b.dataset.page===mainPage));});
 if(mainPage==='statistics')renderAnalytics();
};
document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{mainPage=b.dataset.page;tab=mainPage==='customize'?customizeTab:'workouts';render();});
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{customizeTab=b.dataset.tab;tab=customizeTab;render();});
document.addEventListener('click',event=>{const exercise=event.target.closest('[data-analytics-exercise]');if(exercise){analyticsExercise=exercise.dataset.analyticsExercise;const last=GuGuAnalytics.samples(data.workouts).filter(s=>s.exerciseId===analyticsExercise).at(-1);analyticsMethod=last?.method||'normal';analyticsComparison='';analyticsMetric='set';resetHighscoreFilter();renderAnalytics();return;}if(event.target.closest('[data-analytics-back]')){analyticsExercise='';renderAnalytics();return;}const b=event.target.closest('[data-analytics-method]');if(b){analyticsMethod=b.dataset.analyticsMethod;analyticsComparison='';resetHighscoreFilter();renderAnalytics();}});
$('.brand').onclick=event=>{event.preventDefault();mainPage='training';tab='workouts';render();};
