const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const status={textContent:''},button={disabled:false};let shared,downloads=0;
const ctx=vm.createContext({File,Date,JSON,GuGuMediaStorage:{exportFile:async (payload,name)=>new File([JSON.stringify(payload)],name,{type:'application/json'})},navigator:{canShare:()=>true,share:async payload=>{shared=payload}},data:{exercises:[{id:'x',name:'Test',media:'data:image/png;base64,AAAA'}],routines:[],workouts:[]},$:s=>s==='#fileStatus'?status:s==='#saveFile'?button:{},toast(){},URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},setTimeout(){},document:{querySelectorAll:()=>[],body:{append(){}},createElement:()=>({click(){downloads++},remove(){}})}});
vm.runInContext(fs.readFileSync(__dirname+'/../backup-ui.js','utf8'),ctx);
(async()=>{
 await vm.runInContext('saveBackupToFiles()',ctx);
 assert.equal(shared.files.length,1);const file=shared.files[0];assert.match(file.name,/^kraftlog-sicherung-.*\.json$/);assert.equal(file.type,'application/json');
 const parsed=JSON.parse(await file.text());assert.equal(parsed.format,'kraftlog');assert.equal(parsed.version,5);assert.equal(parsed.data.exercises[0].media,ctx.data.exercises[0].media);assert.equal(button.disabled,false);
 ctx.navigator.canShare=()=>false;await vm.runInContext('saveBackupToFiles()',ctx);assert.equal(downloads,1);assert.match(status.textContent,/Download gestartet/);
 ctx.navigator.canShare=()=>true;ctx.navigator.share=async()=>{let e=Error('cancel');e.name='AbortError';throw e};await vm.runInContext('saveBackupToFiles()',ctx);assert.equal(downloads,1);assert.equal(button.disabled,false);
 ctx.navigator.share=async()=>{throw Error('failed')};await vm.runInContext('saveBackupToFiles()',ctx);assert.match(status.textContent,/fehlgeschlagen/);assert.equal(downloads,1);assert.equal(button.disabled,false);
 ctx.navigator.userActivation={isActive:false};ctx.navigator.share=async payload=>{shared=payload};shared=null;await vm.runInContext('saveBackupToFiles()',ctx);assert.equal(shared,null);assert.match(button.textContent,/bereit/);ctx.navigator.userActivation.isActive=true;await vm.runInContext('saveBackupToFiles()',ctx);assert.equal(shared.files.length,1);
 console.log('PASS: full backup incl. media, native file sharing, download fallback, cancellation and failure.');
})().catch(e=>{console.error(e);process.exitCode=1});
