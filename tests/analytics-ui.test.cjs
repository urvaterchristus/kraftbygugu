const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const els=new Map(['#analyticsPanel','#analyticsPeriod','#analyticsComparison'].map(k=>[k,{innerHTML:'',value:''}]));
const exercise={id:'pull',name:'Klimmzüge'};
const entry=(option,reps)=>({exerciseId:'pull',name:'Klimmzüge',measure:'reps',weightMode:'none',variations:{grip:{optionId:option}},sets:[{reps,weight:0}]});
const data={exercises:[exercise],variationCategories:[{id:'grip',name:'Griff',options:[{id:'a',name:'Alt'},{id:'b',name:'Neu'}]}],workouts:[{id:'1',date:'2026-10-01',time:'10:00',method:'normal',entries:[entry('a',20)],duration:30},{id:'2',date:'2026-10-02',time:'10:00',method:'normal',entries:[entry('b',10)],duration:30},{id:'3',date:'2026-10-03',time:'10:00',method:'normal',entries:[entry('b',8)],duration:30}]};
const ctx=vm.createContext({console,structuredClone,Date,data,$:k=>els.get(k),esc:v=>String(v??'').replaceAll('"','&quot;'),find:(type,id)=>data[type].find(e=>e.id===id),exerciseThumbnail:()=>'<img class="exercise-thumb" alt="">'});
for(const f of ['variation-core.js','progress-core.js','analytics-core.js'])vm.runInContext(fs.readFileSync(__dirname+'/../'+f,'utf8'),ctx);
const source=fs.readFileSync(__dirname+'/../navigation-ui.js','utf8');vm.runInContext(source.slice(0,source.indexOf('const renderBeforePages')),ctx);
const run=s=>vm.runInContext(s,ctx);run('renderAnalytics()');let html=els.get('#analyticsPanel').innerHTML;assert.match(html,/data-analytics-exercise="pull"/);assert.match(html,/Zuletzt/);assert.doesNotMatch(html,/analyticsComparison|analyticsMetric/);
run("analyticsExercise='pull';renderAnalytics()");html=els.get('#analyticsPanel').innerHTML;
assert.match(html,/Griff: Neu/);assert.match(html,/<details class="analytics-adjust">/);assert.doesNotMatch(html,/<details[^>]*open/);assert.doesNotMatch(html,/🏆/);assert.equal(run('JSON.parse(analyticsComparison)[0].includes("b")'),true);
assert.match(html,/10 WDH/);assert.match(html,/8 WDH/);assert.match(html,/data-analytics-back/);
console.log('PASS: exercise list first, latest settings instead of oldest/highest, collapsed comparisons, unchanged baseline record rule and visible history.');

data.exercises[0].variationCategoryIds=['grip'];data.variationCategories[0].scope='exercise';data.variationCategories[0].name='Klimmzüge #Griff';
run('renderAnalytics()');html=els.get('#analyticsPanel').innerHTML;assert.match(html,/<p>Griff: Neu<\/p>/);assert.match(html,/<p>1 Sets<\/p>/);assert.doesNotMatch(html,/Klimmzüge #Griff/);
console.log('PASS: statistics display one setting per line, shortened category names and set count.');
