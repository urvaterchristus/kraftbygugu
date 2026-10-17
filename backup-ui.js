function backupStatus(message){const el=$('#fileStatus');if(el)el.textContent=message;}
// Real, user-owned backup files; IndexedDB remains the working copy.
function createBackupFile(){
 const now=new Date();
 const local=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString();
 const filename='kraftlog-sicherung-'+local.slice(0,19).replace(/:/g,'-')+'.json';
 return new File([JSON.stringify({format:'kraftlog',version:4,exportedAt:now.toISOString(),data})],filename,{type:'application/json'});
}
function downloadBackup(file=createBackupFile()){
 const url=URL.createObjectURL(file),a=document.createElement('a');
 a.href=url;a.download=file.name;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),60000);
 backupStatus('Download gestartet.');
 toast('Sicherungsdatei zum Herunterladen erstellt.');
}
async function saveBackupToFiles(){
 const button=$('#saveFile');button.disabled=true;
 try{
  const file=createBackupFile();
  // Call share directly within the tap gesture; iOS requires user activation.
  if(navigator.share&&navigator.canShare?.({files:[file]})){
   await navigator.share({files:[file]});
   backupStatus('Sicherung an die Teilen-Funktion übergeben.');
  }else downloadBackup(file);
 }catch(error){
  if(error.name==='AbortError')return;
  backupStatus('Teilen fehlgeschlagen. Über ⋯ kannst du die Datei herunterladen.');
  toast('Teilen fehlgeschlagen. Über ⋯ die Datei herunterladen.');
 }finally{button.disabled=false}
}
$('#saveFile').onclick=saveBackupToFiles;
$('#export').onclick=()=>downloadBackup();

document.querySelectorAll('.tools button').forEach(b=>b.addEventListener('click',()=>{const menu=b.closest('details');if(menu)menu.open=false}));
