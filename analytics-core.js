/* Statistics are derived from saved workouts; the source records are never changed. */
const GuGuAnalytics={
 method(workout,entry){return workout.sections?.find(s=>s.id===entry.sectionId)?.method||(workout.method==='emom'?'emom':workout.method==='mixed'?'unknown':'normal');},
 value(entry,set){if(entry.measure==='seconds')return Number(set.seconds??set.reps)||0;try{return KraftlogModel.parseParts(set.partsText??set.reps??0).total;}catch{return 0;}},
 samples(workouts){
  const result=[];
  for(const w of [...workouts].sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||'')))){
   const buckets=new Map();
   for(const e of w.entries||[]){if(e.type==='pause')continue;const method=this.method(w,e);if(method==='unknown')continue;
    for(const set of e.sets||[]){const value=this.value(e,set),weight=(set.weightMode??e.weightMode??'none')==='none'?0:Number(set.weight)||0,parts=String(set.partsText??'').includes('+');
     const signature=GuGuProgress.signature(e,set),key=JSON.stringify([method,signature,weight,parts]);
     if(!buckets.has(key))buckets.set(key,{key,signature,exerciseId:e.exerciseId,name:e.name,method,measure:e.measure||'reps',weight,parts,variations:KraftlogModel.resolveVariations(e,set),weightMode:set.weightMode??e.weightMode??'none',values:[]});
     buckets.get(key).values.push(value);
    }
   }
   for(const b of buckets.values()){
    const count=b.values.length,total=b.values.reduce((a,v)=>a+v,0),score=b.method==='emom'?total:Math.max(...b.values);
    result.push({...b,key:JSON.stringify([b.key,b.method==='emom'?count:null]),count,total,score,workoutId:w.id,date:w.date,time:w.time||''});
   }
  }
  return result;
 },
 records(samples){
  const groups=new Map();for(const s of samples){if(!groups.has(s.key))groups.set(s.key,[]);groups.get(s.key).push(s);}
  return [...groups.values()].map(history=>{
   const byWorkout=new Map();for(const s of history){const old=byWorkout.get(s.workoutId);if(!old||s.score>old.score)byWorkout.set(s.workoutId,s);}
   const visits=[...byWorkout.values()];let best=null,improved=false;const events=[];
   for(const s of visits){if(!best){best=s;continue;}if(s.score>best.score){improved=true;events.push(s.workoutId);best=s;}}
   return {key:history[0].key,best,history:visits,improved,events};
  });
 },
 summary(workouts,period,now=new Date()){
  const year=String(now.getFullYear()),month=year+'-'+String(now.getMonth()+1).padStart(2,'0');
  const items=workouts.filter(w=>period==='all'||w.date?.startsWith(period==='year'?year:month));
  return {count:items.length,days:new Set(items.map(w=>w.date)).size,minutes:items.reduce((a,w)=>a+(Number(w.duration)||0),0),normal:items.filter(w=>w.method!=='emom'&&w.method!=='mixed').length,emom:items.filter(w=>w.method==='emom').length};
 }
};
