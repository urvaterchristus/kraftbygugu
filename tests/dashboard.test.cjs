const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx=vm.createContext({console,Date,Set,document:{addEventListener(){}},setInterval(){}});
vm.runInContext(fs.readFileSync(__dirname+'/../variation-core.js','utf8')+fs.readFileSync(__dirname+'/../dashboard.js','utf8'),ctx);
const run=s=>vm.runInContext(s,ctx);
ctx.now=new Date(2026,9,17,12);ctx.workouts=Array.from({length:8},(_,i)=>({date:'2026-10-'+String(i+1).padStart(2,'0'),duration:30}));
ctx.workouts.push({date:'2026-09-30',duration:999},{date:'2025-10-17',duration:999});
assert.equal(run('GuGuDashboard.month(workouts,now).count'),8);assert.equal(run('GuGuDashboard.month(workouts,now).minutes'),240);assert.equal(run('GuGuDashboard.month(workouts,now).mood'),'neutral');assert.equal(run('GuGuDashboard.month(workouts,now).elapsed'),16);
ctx.workouts.push({date:'2026-10-01',duration:10},{date:'2026-10-02',duration:10});assert.equal(run('GuGuDashboard.month(workouts,now).mood'),'neutral');
ctx.workouts.push({date:'2026-10-03',duration:10});assert.equal(run('GuGuDashboard.month(workouts,now).mood'),'happy');
assert.equal(run('GuGuDashboard.month(workouts,now).days.size'),8);
assert.equal(run('GuGuDashboard.month([],new Date(2026,9,5)).mood'),null);assert.equal(run('GuGuDashboard.month([],new Date(2026,9,6)).mood'),'sad');
assert.equal(run('GuGuDashboard.month([],new Date(2024,1,20)).length'),29);assert.equal(run('GuGuDashboard.month([],new Date(2026,1,20)).length'),28);
assert.equal(run('GuGuDashboard.month([],new Date(2026,5,1)).offset'),0); // June starts Monday
ctx.entry={sets:[{reps:7,partsText:'5+2'},{reps:10},{reps:8}]};assert.equal(run('GuGuDashboard.exerciseTotal(entry).total'),25);
ctx.entry={measure:'seconds',sets:[{seconds:30.5,reps:31},{seconds:20}]};assert.equal(run('GuGuDashboard.exerciseTotal(entry).total'),50.5);assert.equal(run('GuGuDashboard.exerciseTotal(entry).unit'),'Sek.');
console.log('PASS: month boundaries, training-day markers, exact smile thresholds, leap years, parts and seconds totals.');
