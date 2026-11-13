import { currentAndNext } from './calendar.js';
import { readData } from './storage.js';
import {refreshReminders,playReminderSound,testReminder,openReminder} from './reminders.js';
let updateRevision=0;
async function update() {
  const revision=++updateRevision;
  try {
  const { events = [] } = await readData();
  if(revision!==updateRevision)return;
  await chrome.action.setIcon({ path: { 16: `icons/icon-16.png`, 32: `icons/icon-32.png`, 48: `icons/icon-48.png` } });
  if(revision!==updateRevision)return;
  const { current } = currentAndNext(events);
  const e = current[0];
  await chrome.action.setBadgeBackgroundColor({ color: '#14695e' });
  if(revision!==updateRevision)return;
  await chrome.action.setBadgeText({ text: e ? String(Math.ceil((e.end - Date.now()) / 60000)) : '' });
  if(revision!==updateRevision)return;
  await chrome.action.setTitle({ title: e ? `${e.title} · ${e.room} · ${e.teacher} · ${Math.ceil((e.end - Date.now()) / 60000)} min left` : 'Afterbell — open your timetable' });
  } catch {
    if(revision!==updateRevision)return;
    await chrome.action.setBadgeText({text:'!'});
    await chrome.action.setTitle({title:'Afterbell — saved data could not be opened. Open Settings → Privacy to reset.'});
  }
}
async function setup(details) {
  await chrome.storage.local.setAccessLevel({accessLevel:'TRUSTED_CONTEXTS'});
  await chrome.alarms.create('clock', { periodInMinutes: 1 }); await update();
  await refreshReminders();
  if (details?.reason === 'install') {
    const previous=await chrome.storage.local.get(['introOpened','privateData','events','onboardingDismissed']);
    if(!previous.introOpened&&!previous.privateData&&!previous.events?.length&&!previous.onboardingDismissed){
      await chrome.storage.local.set({ introOpened: true });
      try { await chrome.tabs.create({ url: chrome.runtime.getURL('popup.html?view=tab&intro=1') }); }
      catch(err){await chrome.storage.local.remove('introOpened');throw err;}
    }
  }
}
chrome.runtime.onInstalled.addListener(setup);
chrome.runtime.onStartup.addListener(setup);
chrome.alarms.onAlarm.addListener(a => { if (a.name === 'clock') {update();refreshReminders();} else if(a.name==='class-reminder')refreshReminders(); });
chrome.storage.onChanged.addListener((changes,area)=>{
  if(area==='local'&&['privateData','events','appearance','zone'].some(k=>k in changes)){update();refreshReminders();}
});
let notificationClicksBound=false;
function bindNotificationClicks(){
  if(chrome.notifications&&!notificationClicksBound){notificationClicksBound=true;chrome.notifications.onClicked.addListener(id=>{if(id.startsWith('afterbell-')){openReminder();chrome.notifications.clear(id);}});}
}
chrome.permissions.onRemoved.addListener(()=>refreshReminders());
chrome.permissions.onAdded.addListener(()=>{bindNotificationClicks();refreshReminders();});
bindNotificationClicks();
let startupClaimed = false;
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id || message?.target !== 'afterbell-startup') return;
  if (startupClaimed) return respond(false);
  startupClaimed = true;
  chrome.storage.session.get('startupSeen').then(async ({ startupSeen }) => {
    if (startupSeen) return false;
    await chrome.storage.session.set({ startupSeen: true });
    return true;
  }).then(respond, () => { startupClaimed = false; respond(false); });
  return true;
});
chrome.runtime.onMessage.addListener((message,sender,respond)=>{
  if(sender.id!==chrome.runtime.id||message?.target!=='afterbell-reminders')return;
  if(message.action==='stop'){
    (async()=>{
      await chrome.alarms.clear('class-reminder');
      if(await chrome.permissions.contains({permissions:['notifications']})){const all=await chrome.notifications.getAll();await Promise.all(Object.keys(all).filter(id=>id.startsWith('afterbell-')).map(id=>chrome.notifications.clear(id)));}
      if(await chrome.permissions.contains({permissions:['offscreen']})&&(await chrome.runtime.getContexts({contextTypes:['OFFSCREEN_DOCUMENT']})).length)await chrome.offscreen.closeDocument();
    })().then(()=>respond({stopped:true}),error=>respond({error:error.message}));return true;
  }
  const action=message.action==='preview'?playReminderSound:message.action==='test'?testReminder:null;
  if(!action)return;
  action(message.options||{}).then(respond,error=>respond({error:error.message}));return true;
});
setup();


