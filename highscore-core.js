const GuGuHighscores={
 sets(workouts,exerciseId,method){
  const rows=[];
  for(const w of [...workouts].sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||''))))for(const [entryIndex,e] of (w.entries||[]).entries()){
   if(e.type==='pause'||e.exerciseId!==exerciseId||GuGuAnalytics.method(w,e)!==method)continue;
   for(const [setIndex,s] of (e.sets||[]).entries()){
    const weightMode=s.weightMode??e.weightMode??'none';
    rows.push({workoutId:w.id,date:w.date,time:w.time||'',entryIndex,setIndex,exerciseId,measure:e.measure||'reps',weightMode,weight:weightMode==='none'?0:Number(s.weight)||0,value:GuGuAnalytics.value(e,s),parts:String(s.partsText??'').includes('+'),variations:KraftlogModel.resolveVariations(e,s)});
   }
  }
  return rows;
 },
 matches(row,filter={},ignore){
  if(filter.mode&&row.weightMode!==filter.mode)return false;
  if(ignore!=='kg'&&filter.kg!=null&&row.weight!==Number(filter.kg))return false;
  return Object.entries(filter.variations||{}).every(([id,option])=>id===ignore||(row.variations[id]?.optionId||'')===option);
 },
 sessions(rows,minSets=1){
  const groups=new Map();for(const row of rows){if(!groups.has(row.workoutId))groups.set(row.workoutId,{workoutId:row.workoutId,date:row.date,time:row.time,rows:[]});groups.get(row.workoutId).rows.push(row);}
  return [...groups.values()].filter(g=>g.rows.length>=minSets).map(g=>({...g,count:g.rows.length,total:g.rows.reduce((a,r)=>a+r.value,0)}));
 },
 best(candidates){
  const compare=(a,b)=>{for(let i=0;i<a.rank.length;i++){if(a.rank[i]!==b.rank[i])return a.rank[i]-b.rank[i];}return 0;};
  let best=null,improved=false;for(const c of candidates){if(!best)best=c;else if(compare(c,best)>0){best=c;improved=true;}}
  return best?{...best,improved}:null;
 },
 scores(rows,minSets=1){
  const sessions=this.sessions(rows,minSets),total=[],single=[],weightedTotal=[],weightedSingle=[];
  for(const session of sessions){
   total.push({...session,score:session.total,rank:[session.total]});
   const peak=session.rows.reduce((a,r)=>!a||r.value>a.value?r:a,null);
   single.push({...session,rows:[peak],score:peak.value,rank:[peak.value]});
   const weighted=session.rows.filter(r=>r.weight>0&&r.value>0);if(!weighted.length)continue;
   const kg=Math.max(...weighted.map(r=>r.weight)),atMax=weighted.filter(r=>r.weight===kg),sum=atMax.reduce((a,r)=>a+r.value,0),max=atMax.reduce((a,r)=>r.value>a.value?r:a);
   weightedTotal.push({...session,rows:atMax,score:sum,weight:kg,rank:[kg,sum]});
   weightedSingle.push({...session,rows:[max],score:max.value,weight:kg,rank:[kg,max.value]});
  }
  return {total:this.best(total),single:this.best(single),weightedTotal:this.best(weightedTotal),weightedSingle:this.best(weightedSingle)};
 },
 weightSummary(entry){
  const weights=[...new Set((entry.sets||[]).filter(s=>(s.weightMode??entry.weightMode??'none')!=='none'&&Number(s.weight)>0).map(s=>Number(s.weight)))].sort((a,b)=>a-b);
  return weights.length?weights.map(w=>w.toLocaleString('de-DE')).join(' / ')+' kg':'';
 }
};
