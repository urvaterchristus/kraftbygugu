/* Kraftlog: Datenmodell für flexible Trainingsvariationen */
const KraftlogModel={
  normalize(d){
    const x={exercises:[],equipment:[],routines:[],workouts:[],variationCategories:[],trash:[],...d};
    for(const e of x.exercises){if(!e.measure)e.measure='reps';if(!Array.isArray(e.variationCategoryIds))e.variationCategoryIds=[];}
    if(!Array.isArray(x.trash))x.trash=[];
    return x;
  },
  parseParts(value){
    const s=String(value??'').replace(/\s/g,'');
    if(!/^\d+(\+\d+)*$/.test(s))throw Error('Bitte eine Zahl oder Teilstücke wie 5+2 eingeben.');
    const parts=s.split('+').map(Number);
    if(parts.some(n=>n<=0||n>10000)||parts.reduce((a,b)=>a+b,0)>10000)throw Error('Ungültige Wiederholungszahl.');
    return {parts,total:parts.reduce((a,b)=>a+b,0),interruptions:parts.length-1};
  },
  resolveVariations(entry,set){
    return {...(entry.variations||{}),...(set.variations||{})};
  },
  validateCategories(categories){
    if(!Array.isArray(categories))return false;
    return categories.every(c=>c&&typeof c.id==='string'&&typeof c.name==='string'&&Array.isArray(c.options)&&c.options.every(o=>o&&typeof o.id==='string'&&typeof o.name==='string'&&(!o.extra||typeof o.extra.unit==='string')));
  },
  makeEmom(minutes,items){
    if(!Number.isInteger(minutes)||minutes<1||minutes>240)throw Error('EMOM Dauer muss zwischen 1 und 240 Minuten liegen.');
    if(!Array.isArray(items)||items.length<1)throw Error('EMOM benötigt mindestens eine Übung.');
    return {method:'emom',minutes,items:structuredClone(items),rounds:Array.from({length:minutes},(_,i)=>({minute:i+1,results:items.map(()=>null)}))};
  }
};
