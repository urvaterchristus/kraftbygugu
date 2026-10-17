const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/../app.js','utf8');
const ctx=vm.createContext({console,structuredClone,Date,toast(){},data:{exercises:[],equipment:[],routines:[],variationCategories:[],workouts:[{id:'workout',name:'Training',date:'2026-10-17',time:'12:00',duration:60,entries:[]}]},collectionKey:type=>type==='variations'?'variationCategories':type});
ctx.save=async next=>{ctx.data=next};
vm.runInContext(fs.readFileSync(__dirname+'/../variation-core.js','utf8'),ctx);
vm.runInContext(source.slice(source.indexOf('function validateBackup('),source.indexOf("$('#import').onclick")),ctx);
vm.runInContext(source.slice(source.indexOf('async function moveToTrash('),source.indexOf("$('#confirmAccept').onclick")),ctx);
(async()=>{
 await vm.runInContext("moveToTrash('workouts','workout')",ctx);assert.equal(ctx.data.workouts.length,0);assert.equal(ctx.data.trash[0].record.name,'Training');
 await vm.runInContext('restoreLastDeleted()',ctx);assert.equal(ctx.data.workouts.length,1);assert.equal(ctx.data.workouts[0].id,'workout');assert.equal(ctx.data.trash.length,0);
 ctx.data.variationCategories=[{id:'v',name:'Griff',options:[]}];await vm.runInContext("moveToTrash('variations','v')",ctx);assert.equal(ctx.data.variationCategories.length,0);await vm.runInContext('restoreLastDeleted()',ctx);assert.equal(ctx.data.variationCategories[0].id,'v');
 console.log('PASS: reversible workout deletion and variation collection mapping.');
})().catch(e=>{console.error(e);process.exitCode=1});
