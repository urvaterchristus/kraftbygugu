// Real, user-owned backup files; IndexedDB remains the working copy.
function createBackupFile(){
 const now=new Date();
 const local=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString();
 const filename='kraftlog-sicherung-'+local.slice(0,19).replace(/:/g,'-')+'.json';
 return new File([JSON.stringify({format:'kraftlog',version:3,exportedAt:now.toISOString(),data})],filename,{type:'application/json'});
}
function downloadBackup(file=createBackupFile()){
 const url=URL.createObjectURL(file),a=document.createElement('a');
 a.href=url;a.download=file.name;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),60000);
 $('#fileStatus').textContent='Download gestartet. Prüfe den Download-Ordner und lege die Datei in deinem Sicherungsordner ab.';
 toast('Sicherungsdatei zum Herunterladen erstellt.');
}
async function saveBackupToFiles(){
 const button=$('#saveFile');button.disabled=true;
 try{
  const file=createBackupFile();
  // Call share directly within the tap gesture; iOS requires user activation.
  if(navigator.share&&navigator.canShare?.({files:[file]})){
   await navigator.share({files:[file]});
   $('#fileStatus').textContent='Sicherung an die Teilen-Funktion übergeben. Prüfe, dass die Datei in deinem gewählten Ordner liegt.';
  }else downloadBackup(file);
 }catch(error){
  if(error.name==='AbortError')return;
  $('#fileStatus').textContent='Die Datei konnte nicht übergeben werden. Bitte „Datei herunterladen“ versuchen.';
  toast('Dateisicherung nicht abgeschlossen. Bitte erneut versuchen.');
 }finally{button.disabled=false}
}
$('#saveFile').onclick=saveBackupToFiles;
$('#export').onclick=()=>downloadBackup();
