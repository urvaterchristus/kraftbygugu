const GuGuProgress={
 types:['Stützend','Hängend','Liegend','Stehend','Dehnung'],
 alphabetical(items){return [...items].sort((a,b)=>a.name.localeCompare(b.name,'de',{sensitivity:'base',numeric:true}));},
 signature(entry,set){
  const variations={...entry.variations,...set?.variations};
  return JSON.stringify([entry.exerciseId,entry.measure||'reps',set?.weightMode??entry.weightMode??'none',Object.keys(variations).sort().filter(k=>variations[k]?.optionId).map(k=>[k,variations[k].optionId,variations[k].value??''])]);
 },
 previous(workouts,entry,set,index,excludeId){
  const key=this.signature(entry,set);
  for(const workout of [...workouts].filter(w=>w.id!==excludeId).sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time))){
   const entries=workout.entries.filter(e=>e.exerciseId===entry.exerciseId);
   for(const old of entries){
    const indexed=old.sets[index];
    if(indexed&&this.signature(old,indexed)===key)return indexed;
    const matching=old.sets.find(s=>this.signature(old,s)===key);if(matching)return matching;
   }
  }
  return null;
 },
 numbers(previous,seconds=false){return seconds?{seconds:previous?.seconds??previous?.reps??0,reps:previous?.reps??0,weight:previous?.weight||0}:{reps:previous?.reps??0,partsText:String(previous?.partsText??previous?.reps??0),weight:previous?.weight||0};},
 missingExercises(routine,entries){const seen=new Set(routine.entries.filter(e=>e.type!=='pause').map(e=>e.exerciseId));return entries.filter(e=>e.type!=='pause'&&!seen.has(e.exerciseId)&&seen.add(e.exerciseId));},
 categoryName(value,exercise){const prefix=exercise+' #';const text=value.trim();return prefix+(text.startsWith(prefix)?text.slice(prefix.length):text.replace(/^.*?\s#/, '')).trim();},
 starter(source,media){const out=structuredClone({exercises:source.exercises,routines:source.routines,variationCategories:source.variationCategories,workouts:[],trash:[]});if(!media)out.exercises.forEach(e=>{delete e.previewImage;delete e.exerciseVideo;delete e.media;delete e.mediaType});return out;},
 mergeStarter(current,incoming){
  const next=structuredClone(current),maps={};
  for(const key of ['exercises','routines','variationCategories']){maps[key]=new Map();for(const x of incoming[key])maps[key].set(x.id,crypto.randomUUID());}
  for(const e of structuredClone(incoming.exercises)){e.id=maps.exercises.get(e.id);e.variationCategoryIds=(e.variationCategoryIds||[]).map(id=>maps.variationCategories.get(id)).filter(Boolean);next.exercises.push(e);}
  for(const c of structuredClone(incoming.variationCategories)){c.id=maps.variationCategories.get(c.id);if(c.scope==='exercise')c.exerciseId=maps.exercises.get(c.exerciseId)||'';next.variationCategories.push(c);}
  for(const r of structuredClone(incoming.routines)){r.id=maps.routines.get(r.id);for(const e of r.entries){if(e.type==='pause')continue;e.exerciseId=maps.exercises.get(e.exerciseId)||e.exerciseId;for(const owner of [e,...e.sets])if(owner.variations)owner.variations=Object.fromEntries(Object.entries(owner.variations).map(([id,v])=>[maps.variationCategories.get(id)||id,v]));}next.routines.push(r);}
  return next;
 }
};
