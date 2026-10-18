const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let pauses=0,loads=0,clears=0,gets=0,creates=0;const revoked=[];
const video={src:'',pause(){pauses++},load(){loads++},removeAttribute(){this.src=''}},image={removeAttribute(){}},body={replaceChildren(){clears++}},status={textContent:'',hidden:false};
const dialog={querySelector:s=>s==='video'?video:status};
const ctx=vm.createContext({document:{addEventListener(){},querySelector:s=>s==='#exerciseViewer video'?video:s==='#exerciseViewerBody'?body:s.includes('data-view-image')?image:{addEventListener(){}}},$:()=>dialog,URL:{createObjectURL:()=>{creates++;return 'blob:test'},revokeObjectURL:url=>revoked.push(url)},GuGuMediaStorage:{put:async file=>'gugu-media:uploaded',get:async()=>{gets++;return new Blob(['video'])}}});
vm.runInContext(fs.readFileSync(__dirname+'/../app.js','utf8').split('\n')[0].replace('const $=s=>document.querySelector(s), esc=', 'const esc='),ctx);
vm.runInContext(fs.readFileSync(__dirname+'/../media-ui.js','utf8'),ctx);const run=s=>vm.runInContext(s,ctx);
ctx.item={id:'a',name:'Test <script>',previewImage:'gugu-media:full-image',exerciseVideo:'gugu-media:full-video',thumbnail:'data:image/jpeg;base64,AAAA'};
const compact=run('exerciseCompact(item)');assert.match(compact,/width="44"/);assert.doesNotMatch(compact,/<video|full-image|full-video/);assert.match(compact,/Test &lt;script&gt;/);
const html=run('exerciseGallery(item)');assert.ok(html.indexOf('<img')<html.indexOf('<video'));assert.match(html,/preload="none"/);assert.doesNotMatch(html,/src=|poster=|autoplay|full-video|full-image/);
ctx.item={mediaType:'image',media:'old-image'};assert.equal(run('exerciseMedia(item).image'),'old-image');ctx.item={mediaType:'video',media:'old-video'};assert.equal(run('exerciseMedia(item).video'),'old-video');assert.match(run('exerciseGallery(item)'),/Noch kein Vorschaubild/);
(async()=>{
 assert.equal(await run("readExerciseMedia({type:'image/png',size:10},'image')"),'gugu-media:uploaded');await assert.rejects(()=>run("readExerciseMedia({type:'video/mp4',size:10},'image')"));await assert.rejects(()=>run("readExerciseMedia({type:'video/mp4',size:31*1024*1024},'video')"));
 run("activeExerciseViewer={video:'gugu-media:v',urls:[],loaded:false,loading:false}");assert.equal(gets,0);await run('loadViewerVideo()');assert.equal(gets,1);assert.equal(video.src,'blob:test');await run('loadViewerVideo()');assert.equal(gets,1);
 run('releaseExerciseViewer()');assert.equal(pauses,1);assert.equal(video.src,'');assert.deepEqual(revoked,['blob:test']);assert.equal(clears,1);
 let resolve;ctx.GuGuMediaStorage.get=()=>new Promise(r=>{resolve=r});run("activeExerciseViewer={video:'gugu-media:v',urls:[],loaded:false,loading:false}");const pending=run('loadViewerVideo()');run('releaseExerciseViewer()');resolve(new Blob(['video']));await pending;assert.equal(creates,1);
 console.log('PASS: compact rows contain no original media, viewer loads video once on demand, closes/releases URLs and ignores late loads.');
})().catch(e=>{console.error(e);process.exitCode=1});
