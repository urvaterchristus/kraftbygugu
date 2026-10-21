let highscoreFilter={mode:'none',kg:null,variations:{}},highscoreMinSets=1;
function resetHighscoreFilter(){highscoreFilter={mode:'none',kg:null,variations:{}};highscoreMinSets=1;}
function highscoreRows(){return GuGuHighscores.sets(data.workouts,analyticsExercise,analyticsMethod);}
function highscoreConfigurations(rows){
 const groups=new Map();for(const row of rows){const key=JSON.stringify([row.weightMode,row.weight,row.parts,Object.entries(row.variations).sort(([a],[b])=>a.localeCompare(b))]);if(!groups.has(key))groups.set(key,{...row,count:0,total:0});const g=groups.get(key);g.count++;g.total+=row.value;}
 return [...groups.values()].map(g=>`<div class="highscore-configuration">${analyticsLines(g).map(line=>`<p>${esc(line)}</p>`).join('')}<p>${g.total.toLocaleString('de-DE')} ${g.measure==='seconds'?'Sek.':'WDH'} insgesamt</p></div>`).join('');
}
function highscoreCard(label,score,weighted=false){
 if(!score)return `<article class="highscore-card"><h3>${label}</h3><p class="hint">${weighted?'Noch keine Leistung mit Zusatzgewicht.':'Keine passenden Trainings.'}</p></article>`;
 const unit=score.rows[0].measure==='seconds'?'Sek.':'WDH',n=v=>Number(v).toLocaleString('de-DE');
 return `<article class="highscore-card"><h3>${label}</h3><strong class="highscore-number">${score.improved?'<span role="img" aria-label="Persönlicher Rekord">🏆</span> ':''}${weighted?n(score.weight)+' kg':n(score.score)+' '+unit}</strong>${weighted?`<p>${n(score.score)} ${unit} bei diesem Gewicht</p>`:''}<p class="hint">${new Date(score.date+'T12:00:00').toLocaleDateString('de-DE')} · Training mit ${score.count} ${score.count===1?'Set':'Sets'}</p><details><summary>Einstellungen ansehen</summary>${highscoreConfigurations(score.rows)}</details></article>`;
}
function highscoreCards(scores){return highscoreCard('Meiste WDH / Sekunden im Training',scores.total)+highscoreCard('Bester einzelner Satz',scores.single)+highscoreCard('Höchstes Gewicht · Trainingsleistung',scores.weightedTotal,true)+highscoreCard('Höchstes Gewicht · bester Satz',scores.weightedSingle,true);}
function renderHighscoreDetail(host){
 const rows=highscoreRows(),exercise=find('exercises',analyticsExercise);
 host.innerHTML=`<button type="button" data-analytics-back class="analytics-back">← Alle Übungen</button><div class="analytics-detail-title">${exerciseThumbnail(exercise)}<h1>${esc(exercise?.name||rows[0]?.name||'Übung')}</h1></div><div class="analytics-method" role="group" aria-label="Trainingsmethode für Statistiken"><button type="button" data-analytics-method="normal" aria-pressed="${analyticsMethod==='normal'}">Normal</button><button type="button" data-analytics-method="emom" aria-pressed="${analyticsMethod==='emom'}">EMOM</button></div><h2>Deine Bestleistungen</h2><p class="hint">Alle Variationen · gesamter Verlauf. Der erste Eintrag ist ein Ausgangswert und erhält keinen Pokal.</p><div class="highscore-grid">${highscoreCards(GuGuHighscores.scores(rows))}</div><h2>Dein Highscore-Baukasten</h2><p class="hint">Optionen antippen. Erneut antippen hebt die Auswahl auf. Grau bedeutet: Für diese Kombination gibt es keine gespeicherten Sets.</p><div id="highscoreBuilder"></div>`;
 renderHighscoreBuilder();
}
function renderHighscoreBuilder(){
 const host=$('#highscoreBuilder');if(!host)return;
 const rows=highscoreRows(),exercise=find('exercises',analyticsExercise),f=highscoreFilter;
 const ids=new Set([...(exercise?.variationCategoryIds||[]),...rows.flatMap(r=>Object.keys(r.variations))]),categories=GuGuProgress.orderedCategories(data.variationCategories.filter(c=>ids.has(c.id)&&(c.scope!=='exercise'||c.exerciseId===analyticsExercise)),exercise?.variationCategoryIds);
 const weights=[...new Set(rows.filter(r=>r.weightMode===f.mode).map(r=>r.weight))].sort((a,b)=>a-b);
 const choice=(label,attributes,selected,disabled=false)=>`<button type="button" ${attributes} aria-pressed="${selected}" ${disabled?'disabled':''}>${esc(label)}</button>`;
 const weightButtons=f.mode!=='none'?`<fieldset class="variation-choice"><legend>Zusatzgewicht in kg</legend><div class="choice-buttons">${choice('Alle kg','data-hs-kg="all"',f.kg===null)}${weights.map(kg=>choice(kg.toLocaleString('de-DE')+' kg',`data-hs-kg="${kg}"`,f.kg===kg,!rows.some(r=>r.weight===kg&&GuGuHighscores.matches(r,{...f,kg},'kg')))).join('')}</div>${!weights.length?'<p class="hint">Mit dieser Gewichtsart noch nicht trainiert.</p>':''}</fieldset>`:'';
 const markup=categories.map(c=>`<fieldset class="variation-choice"><legend>${esc(GuGuProgress.categoryLabel(c))}</legend><div class="choice-buttons">${[{id:'',name:'Keine Auswahl'},...c.options].map(o=>choice(o.name,`data-hs-category="${esc(c.id)}" data-hs-option="${esc(o.id)}"`,Object.hasOwn(f.variations,c.id)&&f.variations[c.id]===o.id,!rows.some(r=>(r.variations[c.id]?.optionId||'')===o.id&&GuGuHighscores.matches(r,f,c.id)))).join('')}</div></fieldset>`).join('');

 host.innerHTML=`<fieldset class="variation-choice"><legend>Zusatzgewicht</legend><div class="choice-buttons">${[['none','Ohne'],['vest','Gewichtsweste'],['belt','Gewichtsgürtel']].map(([id,label])=>choice(label,`data-hs-mode="${id}"`,f.mode===id)).join('')}</div></fieldset>${weightButtons}${markup}<label for="highscoreMinSets">Mindestens so viele passende Sets pro Training</label><input id="highscoreMinSets" type="number" min="1" max="10000" step="1" inputmode="numeric" value="${highscoreMinSets}"><div id="highscoreResults">${highscoreResultMarkup(rows)}</div>`;
 const input=$('#highscoreMinSets');
 input.oninput=()=>{const n=Number(input.value);if(!Number.isInteger(n)||n<1||n>10000)return;highscoreMinSets=n;$('#highscoreResults').innerHTML=highscoreResultMarkup(highscoreRows());};
 input.onchange=()=>{const n=Number(input.value);if(!Number.isInteger(n)||n<1||n>10000)input.value=highscoreMinSets;else input.oninput();};

}
function highscoreResultMarkup(rows){
 const matching=rows.filter(r=>GuGuHighscores.matches(r,highscoreFilter)),sessions=GuGuHighscores.sessions(matching,highscoreMinSets),scores=GuGuHighscores.scores(matching,highscoreMinSets);
 return `<p class="hint" role="status">${sessions.length} passende Trainings mit mindestens ${highscoreMinSets} ${highscoreMinSets===1?'Set':'Sets'}. Nur ausgewählte Optionen schränken den Vergleich ein.</p>${!sessions.length?'<div class="empty">Kein Highscore für diese Kombination.</div>':`<div class="highscore-grid">${highscoreCards(scores)}</div>`}`;
}
document.addEventListener('click',event=>{
 const mode=event.target.closest('[data-hs-mode]'),kg=event.target.closest('[data-hs-kg]'),category=event.target.closest('[data-hs-category]');
 if(mode){highscoreFilter.mode=mode.dataset.hsMode;highscoreFilter.kg=null;renderHighscoreBuilder();}
 if(kg){highscoreFilter.kg=kg.dataset.hsKg==='all'?null:Number(kg.dataset.hsKg);renderHighscoreBuilder();}
 if(category){const {hsCategory:id,hsOption:value}=category.dataset;if(highscoreFilter.variations[id]===value)delete highscoreFilter.variations[id];else highscoreFilter.variations[id]=value;renderHighscoreBuilder();}
});
