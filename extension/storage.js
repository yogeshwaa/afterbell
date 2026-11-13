// Sensitive fields are encrypted locally. The non-extractable key stays in
// this extension's IndexedDB; no password, server or sync account is involved.
const fields=['events','fileName','wallpaper','reminderAudio'];
async function key() {
  const candidate=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);
  return new Promise((resolve,reject)=>{
    const open=indexedDB.open('afterbell-private',1);
    open.onupgradeneeded=()=>open.result.createObjectStore('keys');
    open.onerror=()=>reject(open.error);
    open.onsuccess=()=>{
      const db=open.result,tx=db.transaction('keys','readwrite'),store=tx.objectStore('keys');let result;
      const get=store.get('main');get.onsuccess=()=>{result=get.result||candidate;if(!get.result)store.put(candidate,'main');};
      tx.oncomplete=()=>{db.close();resolve(result);};tx.onerror=()=>{db.close();reject(tx.error);};
    };
  });
}
function base64(bytes){let s='';for(let i=0;i<bytes.length;i+=16384)s+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(s);}
function bytes(s){return Uint8Array.from(atob(s),c=>c.charCodeAt(0));}
async function encrypt(data){const iv=crypto.getRandomValues(new Uint8Array(12));const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},await key(),new TextEncoder().encode(JSON.stringify(data)));return{version:1,iv:base64(iv),cipher:base64(new Uint8Array(cipher))};}
async function decrypt(data){if(data.version!==1)throw Error('Unsupported local data version.');try{return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(data.iv)},await key(),bytes(data.cipher))));}catch{throw Error('Your saved private data could not be unlocked. Use Privacy → Delete all local data to reset, or restore your original profile.');}}
export async function readData({migrate=false}={}){
  const raw=await chrome.storage.local.get(null);let privateValues;
  if(raw.privateData)privateValues=await decrypt(raw.privateData);
  else{
    privateValues=Object.fromEntries(fields.filter(f=>Object.hasOwn(raw,f)).map(f=>[f,raw[f]]));
    if(migrate&&Object.keys(privateValues).length){await chrome.storage.local.set({privateData:await encrypt(privateValues)});await chrome.storage.local.remove(fields);}
  }
  const result={...raw,...privateValues};delete result.privateData;return result;
}
export async function writeData(values){
  const privateValues=Object.fromEntries(fields.map(f=>[f,values[f]??(f==='events'?[]:f==='fileName'?'':null)]));
  const publicValues=Object.fromEntries(Object.entries(values).filter(([f])=>!fields.includes(f)));
  await chrome.storage.local.set({...publicValues,privateData:await encrypt(privateValues)});
  await chrome.storage.local.remove(fields);
}
export async function eraseData(){
  await chrome.storage.local.clear();
  await new Promise((resolve,reject)=>{const r=indexedDB.deleteDatabase('afterbell-private');r.onsuccess=resolve;r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('Close other Afterbell tabs and try deleting again.'));});
}
export async function readReminderHistory(){const {reminderHistoryVault}=await chrome.storage.local.get('reminderHistoryVault');return reminderHistoryVault?await decrypt(reminderHistoryVault):[];}
export async function writeReminderHistory(values){await chrome.storage.local.set({reminderHistoryVault:await encrypt(values)});}
export async function loadCanvasColours(vault) {
  return vault ? await decrypt(vault) : {};
}
export async function saveCanvasColours(mappings) {
  await chrome.storage.local.set({ canvasColoursVault: await encrypt(mappings) });
}
