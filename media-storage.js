// Media blobs live separately from the small editable state record.
const GuGuMediaStorage={
 prefix:'gugu-media:',database:null,
 isRef(value){return typeof value==='string'&&value.startsWith(this.prefix);},
 open(){return new Promise((resolve,reject)=>{
  const request=indexedDB.open('kraftlog',2);
  request.onupgradeneeded=()=>{for(const store of ['state','media'])if(!request.result.objectStoreNames.contains(store))request.result.createObjectStore(store);};
  request.onblocked=()=>{const notice=document.querySelector('#storageNotice');if(notice){notice.hidden=false;notice.textContent='Bitte andere geöffnete GuGu-Tabs schließen, damit die Medienablage aktualisiert werden kann.';}};
  request.onerror=()=>reject(request.error);request.onsuccess=()=>{this.database=request.result;this.database.onversionchange=()=>this.database.close();resolve(this.database);};
 });},
 async put(blob,key=crypto.randomUUID()){
  await new Promise((resolve,reject)=>{const tx=this.database.transaction('media','readwrite');tx.objectStore('media').put(blob,key);tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(tx.error||Error('Medien konnten nicht gespeichert werden.'));});return this.prefix+key;
 },
 async get(value){
  if(!value)return null;
  if(!this.isRef(value)){if(!/^data:(image|video)\//.test(value))throw Error('Ungültige Mediendatei.');return (await fetch(value)).blob();}
  const blob=await new Promise((resolve,reject)=>{const request=this.database.transaction('media').objectStore('media').get(value.slice(this.prefix.length));request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
  if(!blob)throw Error('Eine Mediendatei fehlt in der lokalen Ablage. Bitte eine vollständige Sicherung wiederherstellen.');return blob;
 },
 async thumbnail(blob){
  let source,url;
  try{
   if(typeof createImageBitmap==='function')try{source=await createImageBitmap(blob,{resizeWidth:144,resizeQuality:'high'});}catch{}
   if(!source){url=URL.createObjectURL(blob);source=await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=url;});}
   const width=source.width||source.naturalWidth,height=source.height||source.naturalHeight,scale=Math.min(1,144/Math.max(width,height));
   const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));const context=canvas.getContext('2d');context.fillStyle='#ffffff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(source,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/jpeg',.72);
  }finally{source?.close?.();if(url)URL.revokeObjectURL(url);}
 },
 hasInlineMedia(state){return [...(state.exercises||[]),...(state.trash||[]).filter(t=>t.type==='exercises').map(t=>t.record)].some(e=>[e.previewImage,e.exerciseVideo,e.media].some(v=>typeof v==='string'&&v.startsWith('data:')));},
 async prepare(state,progress=()=>{}){
  const next={...state,exercises:state.exercises.map(e=>({...e})),trash:(state.trash||[]).map(t=>t.type==='exercises'?{...t,record:{...t.record}}:t)};
  const owners=[...next.exercises,...next.trash.filter(t=>t.type==='exercises').map(t=>t.record)];
  let count=0;
  for(const e of owners){
   if(e.media){if(e.mediaType==='video')e.exerciseVideo||=e.media;else e.previewImage||=e.media;delete e.media;delete e.mediaType;}
   for(const field of ['previewImage','exerciseVideo'])if(e[field]&&!this.isRef(e[field])){const blob=await this.get(e[field]);e[field]=await this.put(blob,'migration-'+e.id+'-'+field+'-'+count);}
   if(!e.previewImage){delete e.thumbnail;e.thumbnailFor='';}
   else if(e.thumbnailFor!==e.previewImage){try{e.thumbnail=await this.thumbnail(await this.get(e.previewImage));}catch{e.thumbnail='';}e.thumbnailFor=e.previewImage;}
   progress(++count,owners.length);
  }
  return next;
 },
 // Write base64 into Blob chunks, avoiding one giant JSON/base64 string in JS memory.
 async exportFile(payload,filename){
  if(this.exporting)throw Error('Eine Sicherung wird bereits vorbereitet. Bitte kurz warten.');this.exporting=true;
  try{const parts=[];let text='';const flush=()=>{if(text){parts.push(new Blob([text]));text='';}};const append=s=>{text+=s;if(text.length>32768)flush();};
  const walk=async (value,field='')=>{
   if(this.isRef(value)&&['previewImage','exerciseVideo','media'].includes(field)){
    const blob=await this.get(value);append('"data:'+blob.type+';base64,');flush();
    for(let start=0;start<blob.size;start+=196608){const bytes=new Uint8Array(await blob.slice(start,start+196608).arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));parts.push(new Blob([btoa(binary)]));}
    append('"');return;
   }
   if(Array.isArray(value)){append('[');for(let i=0;i<value.length;i++){if(i)append(',');await walk(value[i]??null);}append(']');return;}
   if(value&&typeof value==='object'){append('{');let first=true;for(const [key,v] of Object.entries(value)){if(v===undefined||key==='thumbnailFor')continue;if(!first)append(',');first=false;append(JSON.stringify(key)+':');await walk(v,key);}append('}');return;}
   append(JSON.stringify(value)??'null');
  };
  await walk(payload);flush();return new File(parts,filename,{type:'application/json'});
  }finally{this.exporting=false;}
 }
};
