const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
class Reader{readAsDataURL(file){this.result='data:'+file.type+';base64,AAAA';this.onload()}}
const ctx=vm.createContext({document:{addEventListener(){}},FileReader:Reader});
vm.runInContext(fs.readFileSync(__dirname+'/../app.js','utf8').split('\n')[0],ctx);
vm.runInContext(fs.readFileSync(__dirname+'/../media-ui.js','utf8'),ctx);
const run=s=>vm.runInContext(s,ctx);
ctx.item={name:'Test <script>',previewImage:'data:image/png;base64,AAAA',exerciseVideo:'data:video/mp4;base64,BBBB'};
const html=run('exerciseGallery(item)');assert.ok(html.indexOf('<img')<html.indexOf('<video'));assert.match(html,/controls playsinline/);assert.doesNotMatch(html,/autoplay/);assert.match(html,/Test &lt;script&gt;/);
ctx.item={mediaType:'image',media:'old-image'};assert.equal(run('exerciseMedia(item).image'),'old-image');
ctx.item={mediaType:'video',media:'old-video'};assert.equal(run('exerciseMedia(item).video'),'old-video');assert.match(run('exerciseGallery(item)'),/Noch kein Vorschaubild/);
ctx.item={previewImage:'new',mediaType:'image',media:'old'};assert.equal(run('exerciseMedia(item).image'),'new');
(async()=>{
 assert.equal(await run("readExerciseMedia({type:'image/png',size:10},'image')"),'data:image/png;base64,AAAA');
 await assert.rejects(()=>run("readExerciseMedia({type:'video/mp4',size:10},'image')"));
 await assert.rejects(()=>run("readExerciseMedia({type:'video/mp4',size:31*1024*1024},'video')"));
 console.log('PASS: image-first gallery, legacy media, independent media types and upload size limits.');
})().catch(e=>{console.error(e);process.exitCode=1});
