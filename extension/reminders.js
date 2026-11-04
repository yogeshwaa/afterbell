import {readData,readReminderHistory,writeReminderHistory} from './storage.js';
import {reminderOptions,reminderPlan} from './reminder-plan.js';
let pending=Promise.resolve(),creating=null;
const permitted=()=>chrome.permissions.contains({permissions:['notifications']});
export async function playReminderSound(options){
  if(['none','system'].includes(options.reminderSound)||+options.reminderVolume===0)return{played:false};
  if(!await chrome.permissions.contains({permissions:['offscreen']}))throw Error('Allow reminder sound playback first.');
  const url=chrome.runtime.getURL('audio.html');
  if(!(await chrome.runtime.getContexts({contextTypes:['OFFSCREEN_DOCUMENT'],documentUrls:[url]})).length){
    if(!creating)creating=chrome.offscreen.createDocument({url:'audio.html',reasons:['AUDIO_PLAYBACK'],justification:'Play the short class reminder sound chosen by the user.'}).finally(()=>creating=null);
    await creating;
  }
  const result=await chrome.runtime.sendMessage({target:'afterbell-audio',options});if(result?.error)throw Error(result.error);return result;
}
async function clearReminders(){
  await chrome.alarms.clear('class-reminder');
  if(await permitted()){const active=await chrome.notifications.getAll();await Promise.all(Object.keys(active).filter(id=>id.startsWith('afterbell-class-')).map(id=>chrome.notifications.clear(id)));}
}
function details(group,s,zone){
  if(!s.notificationDetails)return{title:'Class reminder',message:'Your next class starts soon. Open Afterbell for details.'};
  const when=new Intl.DateTimeFormat('en-AU',{timeZone:zone,hour:'numeric',minute:'2-digit'}).format(group.start);
  return{title:group.classes.map(e=>e.title).join(' / ').slice(0,160),message:group.classes.map(e=>`${when} · ${e.room} · ${e.teacher}`).join('\n').slice(0,900)};
}
async function show(group,s,data){
  await chrome.notifications.create('afterbell-class-'+group.start,{type:'basic',iconUrl:'icons/icon-128.png',...details(group,s,data.zone||'Australia/Sydney'),priority:0,silent:s.reminderSound!=='system'});
  // Do not hold the scheduling queue while a custom sound is playing.
  playReminderSound({...s,reminderAudio:data.reminderAudio}).then(()=>chrome.storage.session.remove('reminderSoundError'),error=>chrome.storage.session.set({reminderSoundError:error.message}));
}
async function reconcile(){
  const data=await readData(),s=reminderOptions(data.appearance);
  if(!s.remindersEnabled||!await permitted()){await clearReminders();return;}
  let history=await readReminderHistory();const plan=reminderPlan(data.events||[],s,history);
  for(const group of plan.due){
    if(!await permitted()||!(await readData()).appearance?.remindersEnabled)break;
    // Persist the claim first, so worker restarts cannot repeat the reminder.
    history=[...history,group.start].slice(-256);await writeReminderHistory(history);
    await show(group,s,data);
  }
  if(plan.next)await chrome.alarms.create('class-reminder',{when:plan.next.when});else await chrome.alarms.clear('class-reminder');
}
export function refreshReminders(){pending=pending.catch(()=>{}).then(reconcile).catch(async error=>{await chrome.alarms.clear('class-reminder');await chrome.storage.session.set({reminderError:error.message});});return pending;}
export async function testReminder(options){
  if(!await permitted())throw Error('Allow notifications first.');
  const sample=options.previewClass;
  const preview=options.notificationDetails&&sample?details({start:sample.start,classes:[sample]},options,options.zone||'Australia/Sydney'):{title:'Class reminder',message:'Your class reminders are ready. This is only a test.'};
  await chrome.notifications.create('afterbell-test',{type:'basic',iconUrl:'icons/icon-128.png',title:'Test · '+preview.title,message:preview.message,silent:options.reminderSound!=='system'});
  return playReminderSound(options);
}
export async function openReminder(){
  const url=chrome.runtime.getURL('popup.html?view=tab');
  const tabs=await chrome.tabs.query({url:chrome.runtime.getURL('popup.html')+'*'});
  if(tabs.length){await chrome.tabs.update(tabs[0].id,{active:true});await chrome.windows.update(tabs[0].windowId,{focused:true});}else await chrome.tabs.create({url});
}
