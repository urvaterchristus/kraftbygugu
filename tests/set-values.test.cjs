const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=__dirname+'/../',handlers={},fields=new Map(),prompts=[];
const ctx=vm.createContext({structuredClone,console,document:{addEventListener(type,fn){(handlers[type]??=[]).push(fn)}},$:s=>fields.get(s),name:()=>'',measureFor:e=>e.measure||'reps',blocks:[],confirmAction:async message=>{prompts.push(message);return ctx.accept},accept:true});
const ui=fs.readFileSync(root+'progress-ui.js','utf8');vm.runInContext(fs.readFileSync(root+'variation-core.js','utf8')+ui.slice(0,ui.indexOf('function draftSnapshot')),ctx);
ctx.readBlocks=()=>{const input=ctx.input,e=ctx.blocks[+input.dataset.block],s=e.sets[0];if(input.dataset.key==='weight')s.weight=Number(input.value);else if(e.measure==='seconds'){s.seconds=Number(input.value);s.reps=Math.round(s.seconds);delete s.partsText;}else {const p=vm.runInContext('KraftlogModel.parseParts(input.value)',ctx);s.reps=p.total;s.partsText=input.value;s.parts=p.parts;}};
function input(block,key,value,before){const x={value,dataset:{block:String(block),set:'0',key,beforeEdit:before},matches:selector=>selector.includes('data-set="0"')};fields.clear();ctx.blocks[block].sets.forEach((s,j)=>fields.set(`#blocks input[data-block="${block}"][data-set="${j}"][data-key="${key}"]`,j===0?x:{value:String(s.reps),dataset:{}}));ctx.input=x;return x;}
async function ask(x){return vm.runInContext('handleFirstSetValue(input)',ctx);}
(async()=>{
 for(const index of [0,1,2]){
  ctx.blocks=Array.from({length:3},(_,i)=>({name:'Übung '+(i+1),sets:Array.from({length:10},()=>({reps:9,weight:2,partsText:'9'}))}));
  const field=input(index,'partsText','10','9'),before=prompts.length,pending=ask(field);ask(field);await pending;
  assert.equal(prompts.length,before+1);assert.match(prompts.at(-1),new RegExp('Übung '+(index+1)));assert.equal(ctx.blocks[index].sets.every(s=>s.reps===10&&s.partsText==='10'),true);
  for(let k=0;k<3;k++)if(k!==index)assert.equal(ctx.blocks[k].sets.every(s=>s.reps===9),true);
 }
 ctx.blocks=[{name:'Sekunden',measure:'seconds',sets:[{seconds:20,reps:20,weight:1},{seconds:30,reps:30,weight:5}]}];await ask(input(0,'partsText','25','20'));assert.equal(ctx.blocks[0].sets[1].seconds,25);assert.equal(ctx.blocks[0].sets[1].weight,5);
 await ask(input(0,'weight','12.5','1'));assert.equal(ctx.blocks[0].sets[1].weight,12.5);assert.equal(ctx.blocks[0].sets[1].seconds,25);
 ctx.accept=false;await ask(input(0,'partsText','40','25'));assert.equal(ctx.blocks[0].sets[0].seconds,40);assert.equal(ctx.blocks[0].sets[1].seconds,25);
 const before=prompts.length;await ask(input(0,'partsText','40','40'));assert.equal(prompts.length,before);
 ctx.accept=true;const field=input(0,'partsText','50','40');handlers.focusout[0]({target:field});await vm.runInContext('pendingSetChange',ctx);assert.equal(ctx.blocks[0].sets[1].seconds,50);
 const empty=input(0,'partsText','','50'),n=prompts.length;handlers.focusout[0]({target:empty});assert.equal(empty.value,'50');assert.equal(prompts.length,n);
 console.log('PASS: first-set propagation for every exercise, ten sets, seconds/weight, decline, unchanged values and focusout fallback.');
})().catch(e=>{console.error(e);process.exitCode=1});
