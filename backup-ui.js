function backupStatus(message){const el=$('#fileStatus');if(el)el.textContent=message;}
let preparedBackup=null,preparedBackupData=null;
function invalidatePreparedBackup(){preparedBackup=null;preparedBackupData=null;const button=$('#saveFile');if(button)button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4"/></svg>Dateien sichern';}
async function createBackupFile(){
 const now=new Date(),local=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString();
 return GuGuMediaStorage.exportFile({format:'kraftlog',version:5,exportedAt:now.toISOString(),data},'kraftlog-sicherung-'+local.slice(0,19).replace(/:/g,'-')+'.json');
}
async function downloadBackup(file){
 file??=preparedBackupData===data&&preparedBackup?preparedBackup:await createBackupFile();
 const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download=file.name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
 backupStatus('Download gestartet.');toast('Sicherungsdatei zum Herunterladen erstellt.');
}
async function saveBackupToFiles(){
 const button=$('#saveFile');button.disabled=true;
 try{
  if(!preparedBackup||preparedBackupData!==data){toast('Sicherung wird mit allen Medien vorbereitet …');const source=data;preparedBackup=await createBackupFile();preparedBackupData=source;}
  const file=preparedBackup;
  if(navigator.share&&navigator.canShare?.({files:[file]})){
   // Large backups outlive iOS user activation: the second tap shares the ready file directly.
   if(navigator.userActivation?.isActive===false){button.textContent='Sicherung bereit · In Dateien sichern';toast('Sicherung ist bereit. Tippe noch einmal zum Speichern.');return;}
   await navigator.share({files:[file]});backupStatus('Sicherung an die Teilen-Funktion übergeben.');
  }else await downloadBackup(file);
  invalidatePreparedBackup();
 }catch(error){
  if(error.name==='AbortError'){invalidatePreparedBackup();return;}
  backupStatus('Teilen fehlgeschlagen. Über ⋯ kannst du die Datei herunterladen.');toast(error.message||'Teilen fehlgeschlagen. Über ⋯ die Datei herunterladen.');
 }finally{button.disabled=false;}
}
$('#saveFile').onclick=saveBackupToFiles;
$('#export').onclick=async()=>{try{toast('Sicherung wird vorbereitet …');await downloadBackup();invalidatePreparedBackup();}catch(error){toast(error.message||'Die Sicherung konnte nicht erstellt werden.');}};
document.querySelectorAll('.tools button').forEach(b=>b.addEventListener('click',()=>{const menu=b.closest('details');if(menu)menu.open=false;}));
