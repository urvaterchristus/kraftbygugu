const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const els=new Map(['#analyticsPanel','#analyticsPeriod','#highscoreBuilder','#highscoreMinSets','#highscoreResults'].map(k=>[k,{innerHTML:'',value:''}]));
const exercise={id:'pull',name:'Klimmzüge'};
const entry=(option,reps)=>({exerciseId:'pull',name:'Klimmzüge',measure:'reps',weightMode:'none',variations:{grip:{optionId:option}},sets:[{reps,weight:0}]});
const data={exercises:[exercise],variationCategories:[{id:'grip',name:'Griff',options:[{id:'a',name:'Alt'},{id:'b',name:'Neu'}]}],workouts:[{id:'1',date:'2026-10-01',time:'10:00',method:'normal',entries:[entry('a',20)],duration:30},{id:'2',date:'2026-10-02',time:'10:00',method:'normal',entries:[entry('b',10)],duration:30},{id:'3',date:'2026-10-03',time:'10:00',method:'normal',entries:[entry('b',8)],duration:30}]};
const ctx=vm.createContext({console,structuredClone,Date,data,document:{addEventListener(){}},$:k=>els.get(k),esc:v=>String(v??'').replaceAll('"','&quot;'),find:(type,id)=>data[type].find(e=>e.id===id),exerciseThumbnail:()=>'<img class="exercise-thumb" alt="">'});
for(const f of ['variation-core.js','progress-core.js','analytics-core.js','highscore-core.js','highscore-ui.js'])vm.runInContext(fs.readFileSync(__dirname+'/../'+f,'utf8'),ctx);
const source=fs.readFileSync(__dirname+'/../navigation-ui.js','utf8');vm.runInContext(source.slice(0,source.indexOf('const renderBeforePages')),ctx);
const run=s=>vm.runInContext(s,ctx);run('renderAnalytics()');let html=els.get('#analyticsPanel').innerHTML;assert.match(html,/data-analytics-exercise="pull"/);assert.match(html,/Zuletzt/);assert.doesNotMatch(html,/analyticsComparison|analyticsMetric/);
run("analyticsExercise='pull';renderAnalytics()");html=els.get('#analyticsPanel').innerHTML;
assert.match(html,/Deine Bestleistungen/);assert.match(html,/Dein Highscore-Baukasten/);assert.equal((html.match(/class="highscore-card"/g)||[]).length,4);assert.match(html,/Einstellungen ansehen/);
assert.match(els.get('#highscoreBuilder').innerHTML,/data-hs-category/);assert.match(els.get('#highscoreBuilder').innerHTML,/data-hs-mode="belt"/);
console.log('PASS: compact exercise list opens four independent scores and an interactive highscore builder.');

els.get('#highscoreMinSets').value='9';els.get('#highscoreMinSets').oninput();assert.match(els.get('#highscoreResults').innerHTML,/Kein Highscore/);assert.equal(run('highscoreMinSets'),9);console.log('PASS: set threshold updates immediately without replacing the focused input.');
