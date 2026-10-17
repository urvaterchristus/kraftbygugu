const GuGuDashboard={
 month(workouts,now=new Date()){
  const year=now.getFullYear(),month=now.getMonth(),today=now.getDate();
  const prefix=year+'-'+String(month+1).padStart(2,'0')+'-';
  const entries=workouts.filter(w=>w.date?.startsWith(prefix));
  const elapsed=today-1,count=entries.length;
  const mood=elapsed<5?null:count>=elapsed/1.5?'happy':count>=elapsed/2?'neutral':'sad';
  return {prefix,today,elapsed,count,mood,minutes:entries.reduce((n,w)=>n+(Number(w.duration)||0),0),days:new Set(entries.map(w=>Number(w.date.slice(8)))),offset:(new Date(year,month,1).getDay()+6)%7,length:new Date(year,month+1,0).getDate(),label:now.toLocaleDateString('de-DE',{month:'long',year:'numeric'})};
 },
 exerciseTotal(entry,exercise){
  const seconds=(entry.measure||exercise?.measure)==='seconds';
  const total=(entry.sets||[]).reduce((n,s)=>{
   if(seconds)return n+(Number(s.seconds??s.reps)||0);
   if(typeof s.partsText==='string'){try{return n+KraftlogModel.parseParts(s.partsText).total}catch{}}
   return n+(Number(s.reps)||0);
  },0);
  return {total,unit:seconds?'Sek.':'WDH'};
 }
};
function renderDashboard(){
 const m=GuGuDashboard.month(data.workouts);
 $('#monthTitle').textContent=m.label;
 const weekdays=['Mo','Di','Mi','Do','Fr','Sa','So'];
 $('#calendar').innerHTML=weekdays.map(d=>`<span class="weekday" aria-hidden="true">${d}</span>`).join('')+
  Array.from({length:m.offset},()=>'<span class="calendar-blank" aria-hidden="true"></span>').join('')+
  Array.from({length:m.length},(_,i)=>{
   const day=i+1,trained=m.days.has(day),today=day===m.today;
   return `<span class="calendar-day ${trained?'trained':''} ${today?'today':''}" ${today?'aria-current="date"':''} aria-label="${day}. ${esc(m.label)}${trained?', Training eingetragen':''}${today?', heute':''}"><span>${day}</span></span>`;
  }).join('');
 const moodLabels={happy:'Glücklich',neutral:'Neutral',sad:'Traurig'};
 const mouth=m.mood==='happy'?'M12 23q8 9 16 0':m.mood==='neutral'?'M13 26h14':'M12 28q8-9 16 0';
 const smile=m.mood?`<svg class="mood-face ${m.mood}" viewBox="0 0 40 40" role="img" aria-label="${moodLabels[m.mood]}"><circle cx="20" cy="20" r="17"/><path d="M14 15v1m12-1v1"/><path d="${mouth}"/></svg>`:'<strong class="mood-pending" aria-label="Smiley ab fünf vergangenen Monatstagen">–</strong>';
 $('#stats').innerHTML=`<div class="stat"><strong>${m.count}</strong><span>Trainings</span></div><div class="stat"><strong>${m.minutes.toLocaleString('de-DE')}</strong><span>Minuten</span></div><div class="stat mood-stat">${smile}<span>${m.mood?'Dein Rhythmus':'Ab Tag 6'}</span></div>`;
}
// Refresh a tab left open overnight, without touching a training being edited.
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&typeof data!=='undefined')renderDashboard()});
setInterval(()=>{if(!document.hidden)renderDashboard()},60000);
