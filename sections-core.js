let trainingSections=[],activeSectionId='',pendingSectionChange=null;
const GuGuSections={
 methods:['normal','emom'],
 fromRecord(record={},entries=[]){
  const sections=record.sections?.length?structuredClone(record.sections):[{id:'section-'+(record.id||'initial'),method:record.method==='emom'?'emom':'normal',rounds:Math.max(1,...entries.filter(e=>e.type!=='pause').map(e=>e.sets?.length||1)),...(record.method==='emom'&&record.emomMinutes?{legacyMinutes:record.emomMinutes}:{})}];
  const ids=new Set(sections.map(s=>s.id));for(const entry of entries)if(!ids.has(entry.sectionId))entry.sectionId=sections[0].id;
  return sections;
 },
 exercises(entries,id){return entries.filter(e=>e.sectionId===id&&e.type!=='pause');},
 resizeExercise(entry,count){while(entry.sets.length<count)entry.sets.push(structuredClone(entry.sets.at(-1)||{reps:0,partsText:'0',weight:0}));entry.sets.length=count;},
 resize(entries,section,count){for(const e of this.exercises(entries,section.id))this.resizeExercise(e,count);section.rounds=count;},
 removeRound(entries,section,index){for(const e of this.exercises(entries,section.id))e.sets.splice(index,1);section.rounds--;},
 ordered(entries,sections){return sections.flatMap(s=>entries.filter(e=>e.sectionId===s.id));},
 label(record){if(!record.sections?.length)return record.method==='emom'?'EMOM':'Normal';return record.sections.map(s=>s.method==='emom'?'EMOM':'Normal').join(' · ');},
 validate(sections,entries){
  if(!Array.isArray(sections))return false;const ids=new Set();
  for(const s of sections){if(!s||typeof s.id!=='string'||ids.has(s.id)||!this.methods.includes(s.method))return false;ids.add(s.id);if(s.method==='emom'&&(!Number.isInteger(s.rounds)||s.rounds<1||s.rounds>240||!this.exercises(entries,s.id).length||this.exercises(entries,s.id).some(e=>!Array.isArray(e.sets)||e.sets.length!==s.rounds)))return false;}
  return entries.every(e=>ids.has(e.sectionId));
 },
 addToRoutine(routine,workout,extra){
  routine.sections=this.fromRecord(routine,routine.entries);
  for(const entry of extra){
   const source=workout.sections.find(s=>s.id===entry.sectionId);let target=routine.sections.find(s=>s.id===source?.id&&s.method===source.method&&(s.method!=='emom'||s.rounds===source.rounds));
   if(!target){target={...source,id:crypto.randomUUID()};routine.sections.push(target);}
   routine.entries.push({...structuredClone(entry),sectionId:target.id});
  }
  routine.entries=this.ordered(routine.entries,routine.sections);
 }
};

function sectionSummaryEntries(record){
 if(!record.sections?.length)return record.entries.map((e,i)=>entrySummary(e,i,record)).join('');
 return record.sections.map((s,i)=>`<li class="training-section-summary"><strong>Abschnitt ${i+1} · ${s.method==='emom'?'EMOM · '+s.rounds+' Min.':'Normal'}</strong></li>`+record.entries.map((e,index)=>e.sectionId===s.id?entrySummary(e,index,record):'').join('')).join('');
}
