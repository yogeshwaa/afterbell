import { parseICS, trackingState, dayKey } from './calendar.js';
import {schoolDay,dayProgress} from './school-day.js';
import { defaults, fonts, remainingText, clockState } from './appearance.js';
import { updateIcons } from './icons.js';
import { readData, writeData, eraseData } from './storage.js';
let appearance = { ...defaults }, preview = false, previewTime = 0;
const $ = id => document.getElementById(id);
let onboardingDismissed = false;
let saved = null, wallpaper = null, reminderAudio = null, saving = false, mediaRevision = 0;
let importRevision = 0, soundRevision = 0, lastToday = '', tabView = false;
let dayCache = { events: null, zone: '', days: new Map(),models:new Map(),options:'' };
let events = [], zone = 'Australia/Sydney', fileName = '';
const time = t => new Intl.DateTimeFormat('en-AU', { timeZone: zone, hour: 'numeric', minute: '2-digit' }).format(t);
const date = t => new Intl.DateTimeFormat('en-AU', { timeZone: zone, weekday: 'long', day: 'numeric', month: 'long' }).format(t);
function node(tag, text, cls) {
  const el = document.createElement(tag);
  if (tag !== 'option' && text.includes('.')) text.split('.').forEach((part,i)=>{
    if(i){const dot=document.createElement('span');dot.className='normal-period';dot.textContent='.';el.append(dot);}
    el.append(document.createTextNode(part));
  }); else el.textContent = text;
  if (cls) el.className = cls; return el;
}
function setTimerText(element, text) {
  element.replaceChildren();
  text.split(':').forEach((part, index) => {
    if (index) {
      const separator = node('span', '', 'time-separator');
      separator.append(node('span', ':', 'separator-text'));
      element.append(separator);
    }
    element.append(document.createTextNode(part));
  });
}
function countdown(ms) { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 3600) ? Math.floor(s / 3600) + ':' : ''}${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }
function dayFor(key){
  if(dayCache.events!==events||dayCache.zone!==zone){
    const days=new Map();for(const e of events){const d=dayKey(e.start,zone);if(!days.has(d))days.set(d,[]);days.get(d).push(e);}
    dayCache={events,zone,days,models:new Map(),options:''};
  }
  const options=JSON.stringify([appearance.showBreaks,appearance.inferBreaks,appearance.breakGapMinutes]);
  if(dayCache.options!==options){dayCache.models.clear();dayCache.options=options;}
  if(!dayCache.models.has(key))dayCache.models.set(key,schoolDay(dayCache.days.get(key)||[],zone,appearance));
  return dayCache.models.get(key);
}
function renderDayRail(day,now){
  const state=dayProgress(day,now),rail=$('dayProgress');rail.replaceChildren();
  rail.hidden=!appearance.showDayProgress||!state;
  $('daySummary').hidden=!state;
  $('daySpan').textContent=state?`${time(day.start)} to ${time(day.end)}`:'';
  $('dayPercentage').hidden=!appearance.showDayPercentage||!appearance.showDayProgress||!state;
  $('dayPercentage').textContent=state?`${state.percent}% of day elapsed`:'';
  if(!state)return;
  rail.setAttribute('role','progressbar');rail.setAttribute('aria-label','School-day time elapsed');rail.setAttribute('aria-valuemin','0');rail.setAttribute('aria-valuemax','100');rail.setAttribute('aria-valuenow',String(state.percent));
  const active=state.markers.filter(m=>m.active).map(m=>(m.provided?'Period ':'Class ')+m.label).join(', ');
  rail.setAttribute('aria-valuetext',state.fraction===1?'School day complete':active||'Between classes');
  // Anchor period badges to their rows, then interpolate time through each row.
  // This keeps long lunch rows from visually putting the current period beside
  // a different subject while the numeric percentage still uses elapsed time.
  const rect=rail.getBoundingClientRect(),bottom=rect.height-14;
  const rows=[...$('classes').children].map((row,i)=>({event:day.entries[i],box:row.getBoundingClientRect()}));
  const anchors=rows.map((r,i)=>{const label=$('classes').children[i].querySelector('.period-label')||$('classes').children[i].querySelector('.subject');const box=label.getBoundingClientRect();return Math.max(14,box.top+box.height/2-rect.top);});
  const top=anchors[0]||14;
  let position=top;
  if(now>=day.end)position=bottom;
  else if(now>day.start){
    let index=rows.findLastIndex(r=>r.event.start<=now);index=Math.max(0,index);
    const e=rows[index].event,next=rows[index+1]?.event;
    const from=anchors[index],to=index===rows.length-1?bottom:anchors[index+1];
    if(now<e.end){const end=next?Math.min(e.end,next.start):e.end;const endPoint=next&&next.start>e.end?Math.max(from,rows[index].box.bottom-rect.top-8):to;position=from+(endPoint-from)*Math.min(1,(now-e.start)/Math.max(1,end-e.start));}
    else{const fromGap=Math.max(from,rows[index].box.bottom-rect.top-8);position=next?fromGap+(to-fromGap)*Math.min(1,(now-e.end)/Math.max(1,next.start-e.end)):bottom;}
  }
  position=Math.max(top,Math.min(bottom,position));
  const track=node('div','','day-rail-track'),fill=node('div','','day-rail-fill');track.style.top=`${top}px`;fill.style.transform=`scaleY(${Math.max(0,(position-top)/Math.max(1,bottom-top))})`;track.append(fill);rail.append(track);
  for(const m of state.markers){const index=rows.findIndex(r=>r.event.kind==='class'&&r.event.start===m.start);const marker=node('span',m.label,'period-marker'+(m.active?' current':m.passed?' passed':''));marker.style.top=`${anchors[index]??14}px`;marker.title=`${m.provided?'Period':'Class'} ${m.label} · ${time(m.start)}`;rail.append(marker);}
  const head=node('span','','day-rail-now');head.style.top=`${position}px`;rail.append(head);
}
function card(e, active, now) {
  const isBreak=e.kind==='break';
  const box = node('div', '', 'hero');
  box.append(node('div', active ? isBreak?'On a break':'In class now' : isBreak?'Next break':'Next class', 'eyebrow class-state'), node('h2', e.title+(e.inferred?' · estimated':'')));
  const state = clockState(e, active, now, zone);
  box.dataset.clock = appearance.clockStyle;
  if (['pie', 'ring', 'analog'].includes(appearance.clockStyle)) {
    const dial = node('div', '', 'dial ' + appearance.clockStyle);
    dial.setAttribute('role', 'img');
    dial.setAttribute('aria-label', appearance.clockStyle === 'analog' ? 'Current school time: ' + time(now) : active ? Math.ceil(state.fraction * 100) + '% of class remaining' : 'Next class has not started');
    dial.style.setProperty('--remaining', (state.fraction ?? 0) * 360 + 'deg');
    if (appearance.clockStyle === 'analog') {
      for (let i = 1; i <= 12; i++) { const tick = node('span', String(i), 'numeral'); tick.style.left = (50 + 40 * Math.sin(i * Math.PI / 6)) + '%'; tick.style.top = (50 - 40 * Math.cos(i * Math.PI / 6)) + '%'; dial.append(tick); }
      for (const hand of ['hour','minute','second']) { const el = node('i', '', 'hand ' + hand); el.style.transform = 'rotate(' + state[hand] + 'deg)'; dial.append(el); }
      dial.append(node('b', '', 'hub'));
    } else dial.append(node('span', active ? Math.ceil(state.fraction * 100) + '%' : 'NEXT', 'dial-label'));
    box.append(dial);
    if (appearance.clockStyle === 'analog') box.append(node('p', 'School time · ' + time(now), 'meta'));
  }
  const duration = node('div', '', 'count');
  setTimerText(duration, remainingText(state.remaining, appearance.units));
  duration.append(node('small', active ? isBreak?'Break ends in':'Class ends in' : isBreak?'Break starts in':'Class starts in')); box.append(duration);
  box.append(node('p', `${time(e.start)} to ${time(e.end)}${dayKey(e.start, zone) !== dayKey(now, zone) ? ' · ' + date(e.start) : ''}`));
  box.append(node('div',isBreak?(e.inferred?'Estimated from a gap in your timetable':'Break listed in your timetable'):[e.room, appearance.showTeacher ? e.teacher : ''].filter(Boolean).join(' · '), 'meta'));
  if (!isBreak && e.period && appearance.showPeriod) box.append(node('p', `Period ${e.period}`, 'meta'));
  if (active && appearance.showProgress) { const p = document.createElement('progress'); p.max = e.end - e.start; p.value = now - e.start; p.setAttribute('aria-label', isBreak?'Break progress':'Class progress'); box.append(p); }
  return box;
}
function render() {
  const now = Date.now();
  if($('settingsPanel').open){$('settingsPanel').style.setProperty('--settings-heading-height',document.querySelector('.settings-heading').getBoundingClientRect().height+'px');$('settingsPanel').style.setProperty('--settings-nav-height',document.querySelector('.settings-nav').getBoundingClientRect().height+'px');}
  const today = dayKey(now, zone);
  if (lastToday && $('date').value === lastToday) $('date').value = today;
  lastToday = today;
  const welcomeVisible = !events.length && !onboardingDismissed && !preview;
  $('welcome').hidden = !welcomeVisible;
  document.querySelector('.dashboard').hidden = welcomeVisible;
  $('setupBanner').hidden = events.length > 0;
  $('importShortcut').classList.toggle('needs-import', !events.length);
  $('today').textContent = date(now); $('zoneLabel').textContent = zone;
  const demo = { title: 'Preview · Design and Technology', room: 'M3.10', teacher: 'Example teacher', period: '1', start: previewTime - 18 * 60000, end: previewTime + 36 * 60000 };
  const { current, next, kind } = preview ? { current: [demo], kind:'active' } : trackingState(events, zone, now);
  const currentBreak=!preview&&dayFor(today).entries.find(e=>e.kind==='break'&&!e.free&&e.start<=now&&e.end>now);
  $('live').replaceChildren();
  if (current.length) { for (const e of current) $('live').append(card(e, true, now)); }
  else if(currentBreak)$('live').append(card(currentBreak,true,now));
  else if (kind==='upcoming') $('live').append(card(next, false, now));
  else if (events.length) {
    const rest=node('div','','hero rest-card');
    rest.append(node('div',kind==='done'?'ALL DONE':kind==='break'?'TAKE A BREATHER':'OFF THE CLOCK','eyebrow'));
    rest.append(node('h2',kind==='done'?'Your day is done':kind==='break'?"You're on a break":'No class right now'));
    rest.append(node('p',next?'Your countdown returns one hour before your next class.':'You’ve reached the end of this timetable. Import a newer export when it’s available.','meta'));
    $('live').append(rest);
  } else $('live').append(node('div','Open Settings to import your Sentral timetable.','empty'));
  const sample = current[0] || (kind==='upcoming' && next) || { ...demo, title: 'Example class', start: now - 18*60000, end: now + 36*60000 };
  $('draftPreview').replaceChildren(card(sample, sample.start <= now && sample.end > now, now));
  $('classes').replaceChildren();
  const day=dayFor($('date').value),selected=day.entries;
  for (const e of selected) {
    const active = e.start <= now && now < e.end;
    const row = node('div', '', 'class' + (active ? ' active' : ''));
    if(e.kind==='break')row.classList.add('break-row');
    const times = node('div', time(e.start), 'times'); times.append(node('span', time(e.end)));
    const content = node('div', ''); const title = node('div', e.title, 'subject');
    if (active) title.append(node('span', 'NOW', 'pill'));
    if(e.inferred)title.append(node('span','ESTIMATED','estimate-label'));
    content.append(title, node('div',e.kind==='break'?(e.inferred?'Inferred gap · you can turn this off in Design':'Listed in timetable'):[e.room, appearance.showTeacher ? e.teacher : ''].filter(Boolean).join(' · '), 'detail'));
    if(e.kind!=='break'){
      const meta=node('div','','detail period-meta');
      if(e.period&&appearance.showPeriod)meta.append(node('span',`Period ${e.period}`,'period-label'));
      if(e.code){if(meta.childNodes.length)meta.append(document.createTextNode(' · '));meta.append(document.createTextNode(e.code));}
      content.append(meta);
    }
    row.append(times, content); $('classes').append(row);
  }
  if (!selected.length) $('classes').append(node('p', 'No classes scheduled for this date.', 'empty'));
  renderDayRail(day,now);
}
$('file').addEventListener('change', async ev => {
  const file = ev.target.files[0]; if (!file) return;
  const revision = ++importRevision;
  try {
    if (file.size > 8 * 1024 * 1024) throw new Error('Please choose an .ics file smaller than 8 MB.');
    const parsed = parseICS(await file.text());
    if (revision !== importRevision) return;
    events = parsed; fileName = file.name; onboardingDismissed = true; preview = false; $('preview').textContent = 'Preview styles';
    $('source').textContent = `${fileName} · ${events.length} classes · ${date(events[0].start)} to ${date(events.at(-1).start)}`;
    $('message').textContent = `Preview ready: ${events.length} classes. Apply changes to save this timetable.`; render(); updateDraft();
  } catch (err) { if (revision === importRevision) $('message').textContent = err.message; }
  ev.target.value = '';
});
$('date').addEventListener('change', render);
$('zone').addEventListener('change', () => { zone = $('zone').value; $('date').value = dayKey(Date.now(), zone); render(); updateDraft(); });
function openTab() { return chrome.tabs.create({ url: chrome.runtime.getURL('popup.html?view=tab') }); }
$('expand').addEventListener('click', openTab);
$('openTab').addEventListener('click', openTab);
$('fullscreen').addEventListener('click', async () => {
  try {
    const view = new URLSearchParams(location.search).get('view');
    if (view === 'window') {
      const win = await chrome.windows.getCurrent();
      const state = win.state === 'fullscreen' ? 'normal' : 'fullscreen';
      await chrome.windows.update(win.id, { state });
      $('fullscreen').textContent = state === 'fullscreen' ? 'Exit fullscreen ⛶' : 'Enter fullscreen ⛶';
      updateIcons(appearance.dotIcons);
      $('settingsPanel').close();
    } else if (tabView) {
      $('settingsPanel').close();
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } else await chrome.windows.create({url:chrome.runtime.getURL('popup.html?view=window'),type:'normal',state:'fullscreen'});
  } catch (err) { console.warn('Afterbell fullscreen:',err.name,err.message); $('displayMessage').textContent = 'Could not enter fullscreen. Open Afterbell in a tab and use the fullscreen button there, or press F11.'; }
});
document.addEventListener('fullscreenchange', () => { $('fullscreen').textContent = document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen'; updateIcons(appearance.dotIcons); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && document.fullscreenElement && !$('settingsPanel').open) {
    document.exitFullscreen().catch(() => {});
  }
});
function showSection(id) {
  if (!$('settingsPanel').open) $('settingsPanel').showModal();
  $('settingsPanel').style.setProperty('--settings-heading-height',document.querySelector('.settings-heading').getBoundingClientRect().height+'px');
  $('settingsPanel').style.setProperty('--settings-nav-height',document.querySelector('.settings-nav').getBoundingClientRect().height+'px');
  for (const section of ['appearance','settings','display','help','notifications','privacy']) $(section).open = section === id;
  document.querySelectorAll('[data-section]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.section === id)));
  $(id).scrollIntoView({block:'start'});
}
function showImport() { showSection('settings'); $('file').focus({preventScroll:true}); }
for (const id of ['helpShortcut','getStarted','setupGuide']) $(id).addEventListener('click', () => showSection('help'));
for (const id of ['goImport','haveFile','importShortcut','setupImport']) $(id).addEventListener('click', showImport);
document.querySelectorAll('[data-section]').forEach(b => b.addEventListener('click', () => showSection(b.dataset.section)));
$('skipWelcome').addEventListener('click', async () => { onboardingDismissed = true; if (saved) saved.onboardingDismissed = true; render(); await chrome.storage.local.set({ onboardingDismissed:true }); });
$('replayWelcome').addEventListener('click', async () => { if (events.length) { showSection('help'); return; } onboardingDismissed = false; if (saved) saved.onboardingDismissed = false; preview = false; $('settingsPanel').close(); render(); await chrome.storage.local.set({ onboardingDismissed:false }); });
$('clear').addEventListener('click', () => { importRevision++; events = []; fileName = ''; $('source').textContent = ''; $('message').textContent = 'Choose Apply changes to remove the saved timetable.'; render(); updateDraft(); });
async function init() {
  // getCurrent distinguishes an actual extension tab from the toolbar popup,
  // including tabs opened directly without our optional query string.
  if (chrome.tabs.getCurrent) {
    try { tabView = !!(await chrome.tabs.getCurrent()); } catch { /* keep URL fallback */ }
  }
  updateViewControls();
  const data = await readData({migrate:true});
  if (!tabView && !data.events?.length && !data.onboardingDismissed && !data.introOpened) {
    await chrome.tabs.create({ url: chrome.runtime.getURL('popup.html?view=tab&intro=1') });
    await chrome.storage.local.set({ introOpened: true });
    window.close();
    return;
  }
  if (tabView && !data.introOpened && !data.events?.length && !data.onboardingDismissed) {
    await chrome.storage.local.set({ introOpened: true });
  }
  onboardingDismissed = !!data.onboardingDismissed;
  appearance = { ...defaults, ...data.appearance };
  for (const id of ['bodyFont','timerFont']) { for (const [key,[label]] of Object.entries(fonts)) { const option = node('option',label); option.value = key; $(id).append(option); } }
  wallpaper = data.wallpaper || null; reminderAudio=data.reminderAudio||null;
  syncControls(); setWallpaper(wallpaper);
  events = data.events || []; zone = data.zone || zone; fileName = data.fileName || '';
  $('zone').value = zone; $('date').value = dayKey(Date.now(), zone);
  $('source').textContent = events.length ? `${fileName} · ${events.length} classes · ${date(events[0].start)} to ${date(events.at(-1).start)}` : '';
  saved = snapshot();
  $('settings').open = !events.length; render(); updateDraft(); setInterval(render, 1000);
  // Some browser builds restore normal bounds while a new window is loading.
  // Reapply fullscreen after its extension page has finished initializing.
  if (new URLSearchParams(location.search).get('view') === 'window') {
    const win = await chrome.windows.getCurrent();
    if (win.state !== 'fullscreen') await chrome.windows.update(win.id, { state: 'fullscreen' });
  }
  document.body.dataset.ready = 'true';
}
function syncControls() {
  for (const key of Object.keys(defaults)) { const el = $(key); if (el.type === 'checkbox') el.checked = appearance[key]; else el.value = appearance[key]; }
}
function applyAppearance() {
  updateIcons(appearance.dotIcons);
  document.body.dataset.theme = appearance.theme;
  document.body.dataset.background = appearance.background;
  document.body.classList.toggle('no-motion', !appearance.motion);
  const style = document.body.style;
  style.setProperty('--body-font', (fonts[appearance.bodyFont] || fonts.ui)[1]);
  style.setProperty('--timer-font', (fonts[appearance.timerFont] || fonts.doto)[1]);
  $('fontSample').style.fontFamily = (fonts[appearance.bodyFont] || fonts.ui)[1];
  $('timerSample').style.fontFamily = (fonts[appearance.timerFont] || fonts.doto)[1];
  setTimerText($('timerSample'), '36:00');
  style.setProperty('--accent-custom', appearance.accent); style.setProperty('--base-custom', appearance.base); style.setProperty('--ink-custom', appearance.ink);
  style.setProperty('--timer-scale', appearance.scale / 100); style.setProperty('--dim', appearance.dim / 100);
  document.querySelector('.schedule').hidden = !appearance.showSchedule;
  $('soundSource').textContent=reminderAudio?reminderAudio.name+' · '+Math.ceil(reminderAudio.duration)+' sec':'No custom audio selected.';
  const video = $('wallpaper');
  if (appearance.motion && appearance.background === 'upload') video.play().catch(() => {}); else video.pause();
}
function snapshot() { return { appearance: {...appearance}, wallpaper, reminderAudio, events, fileName, zone, onboardingDismissed }; }
function isDirty() { return !!saved && (JSON.stringify(appearance) !== JSON.stringify(saved.appearance) || wallpaper !== saved.wallpaper || reminderAudio !== saved.reminderAudio || events !== saved.events || fileName !== saved.fileName || zone !== saved.zone); }
function updateDraft() {
  const dirty = isDirty();
  $('changesBar').hidden = !dirty;
  $('commitStatus').textContent = saving ? 'Applying…' : dirty ? 'Previewing · not saved yet' : 'All changes applied';
  for (const id of ['applySettings','cancelSettings','applyDraft','revertDraft']) $(id).disabled = saving || !dirty;
  updateIcons(appearance.dotIcons);
}
async function commitDraft() {
  if (saving || !isDirty()) return;
  if(appearance.showBreaks&&appearance.inferBreaks&&!$('breakGapMinutes').checkValidity()){$('appearanceMessage').textContent='Choose a minimum break gap between 5 and 60 minutes.';showSection('appearance');return;}
  if(appearance.remindersEnabled){
    if(!$('reminderLead').checkValidity()||!Number.isFinite(+appearance.reminderLead)||+appearance.reminderLead<0||+appearance.reminderLead>60){$('notificationStatus').textContent='Choose a lead time between 0 and 60 minutes.';showSection('notifications');return;}
    if(appearance.reminderSound==='custom'&&!reminderAudio){$('notificationStatus').textContent='Upload a custom sound or choose a built-in sound.';showSection('notifications');return;}
    const needed=['notifications'];
    if(!['none','system'].includes(appearance.reminderSound)&&+appearance.reminderVolume>0)needed.push('offscreen');
    try { const granted=await chrome.permissions.request({permissions:needed});if(!granted){$('notificationStatus').textContent='Permission was not granted. Changes have not been applied.';showSection('notifications');return;} }
    catch(err){$('notificationStatus').textContent=err.message;return;}
  }
  saving = true; updateDraft();
  // Capture one revision: newer edits remain a draft if they arrive while saving.
  const next = snapshot();
  try {
    await writeData(next);
    saved = next;
    $('notificationStatus').textContent=next.appearance.remindersEnabled?'Reminders applied. Chrome must be running to deliver alerts.':'Class reminders are disabled.';
    $('appearanceMessage').textContent = 'Changes applied.';
    $('message').textContent = events.length ? 'Timetable saved.' : 'No timetable saved.';
  } catch (err) { $('appearanceMessage').textContent = 'Could not apply changes. Your saved settings are unchanged. Try a smaller background.'; }
  finally { saving = false; updateDraft(); }
}
function cancelDraft() {
  if (!saved || saving) return;
  mediaRevision++;
  soundRevision++;
  importRevision++;
  appearance = {...saved.appearance}; wallpaper = saved.wallpaper; reminderAudio=saved.reminderAudio; events = saved.events; fileName = saved.fileName; zone = saved.zone; onboardingDismissed = saved.onboardingDismissed;
  preview = false; $('preview').textContent = 'Preview styles';
  $('zone').value = zone; $('date').value = dayKey(Date.now(), zone);
  $('source').textContent = fileName ? fileName + ' · ' + events.length + ' classes' : '';
  syncControls(); setWallpaper(wallpaper); render(); updateDraft();
  $('appearanceMessage').textContent = 'Unapplied changes discarded.'; $('message').textContent = '';
}
for (const id of ['applySettings','applyDraft']) $(id).addEventListener('click', commitDraft);
for (const id of ['cancelSettings','revertDraft']) $(id).addEventListener('click', cancelDraft);
for (const key of Object.keys(defaults)) $(key).addEventListener('input', () => {
  const el = $(key); appearance[key] = el.type === 'checkbox' ? el.checked : ['range','number'].includes(el.type) ? +el.value : el.value;
  if (['accent','base','ink'].includes(key)) { appearance.theme = 'custom'; $('theme').value = 'custom'; }
  applyAppearance(); render(); updateDraft();
});
function setWallpaper(media) {
  $('wallpaper').removeAttribute('src'); $('backdrop').style.backgroundImage = '';
  if (!media) { applyAppearance(); return; }
  if (media.type.startsWith('video/')) { $('wallpaper').src = media.url; $('wallpaper').muted = true; }
  else $('backdrop').style.backgroundImage = 'url("' + media.url + '")';
  applyAppearance();
}
async function validateMedia(media) {
  if (media.type.startsWith('image/')) {
    const image = new Image(); image.src = media.url;
    try { await image.decode(); } catch { throw Error('This image could not be opened. Choose a valid image file.'); }
    return;
  }
  const video = document.createElement('video'); video.preload = 'metadata';
  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(Error('Video preview timed out. Try a smaller MP4 or WebM.')), 10000);
      video.onloadedmetadata = () => { clearTimeout(timeout); resolve(); };
      video.onerror = () => { clearTimeout(timeout); reject(Error('This video could not be opened. Try another MP4 or WebM.')); };
      video.src = media.url;
    });
  } finally { video.removeAttribute('src'); video.load(); }
}
$('media').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return;
  const revision = ++mediaRevision;
  try {
    if (!['image/png','image/jpeg','image/gif','image/webp','video/mp4','video/webm'].includes(file.type)) throw Error('Choose a PNG, JPG, WebP, GIF, MP4 or WebM file.');
    if (file.size > 3 * 1024 * 1024) throw Error('Choose a background smaller than 3 MB.');
    const url = await new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file); });
    const media = { type: file.type, url };
    await validateMedia(media);
    if (revision !== mediaRevision) return;
    wallpaper = media; appearance.background = 'upload'; syncControls(); setWallpaper(media); render(); updateDraft();
    $('appearanceMessage').textContent = 'Background preview ready. Apply changes to save.';
  } catch (err) { $('appearanceMessage').textContent = err.message || 'Could not save background.'; }
  event.target.value = '';
});
$('removeBackground').addEventListener('click', () => { mediaRevision++; wallpaper = null; appearance.background = 'plain'; syncControls(); setWallpaper(null); render(); updateDraft(); });
$('resetAppearance').addEventListener('click', () => { mediaRevision++; soundRevision++; appearance = { ...defaults }; syncControls(); applyAppearance(); render(); updateDraft(); });
$('preview').addEventListener('click', () => { preview = !preview; previewTime = Date.now(); $('preview').textContent = preview ? 'Exit preview' : 'Preview styles'; updateIcons(appearance.dotIcons); if (preview) $('settingsPanel').close(); $('appearanceMessage').textContent = preview ? 'Showing an example class. Your timetable is unchanged.' : ''; render(); });
$('openSettings').addEventListener('click', () => showSection('appearance'));
$('closeSettings').addEventListener('click', () => $('settingsPanel').close());
$('settingsPanel').addEventListener('click', event => { if (event.target === $('settingsPanel')) { const r = event.target.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) event.target.close(); } });
function updateViewControls() {
  document.body.classList.toggle('tab-view', tabView);
  $('expand').hidden = tabView;
  $('openTab').hidden = tabView;
  if (new URLSearchParams(location.search).get('view') === 'window') $('fullscreen').textContent = 'Exit fullscreen ⛶';
  updateIcons(appearance.dotIcons);
}
document.querySelectorAll('.settings-content details').forEach(el=>el.addEventListener('toggle',()=>updateIcons(appearance.dotIcons)));
let resizeFrame;
window.addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{if(document.body.dataset.ready==='true')render();});});
document.fonts.addEventListener('loadingdone',()=>{if(document.body.dataset.ready==='true')render();});
$('previewSound').addEventListener('click',()=>testAlert('preview'));
$('testNotification').addEventListener('click',()=>testAlert('test'));
async function testAlert(action){
  try{
    if(action==='preview'&&(appearance.reminderSound==='none'||(+appearance.reminderVolume===0&&appearance.reminderSound!=='system'))){$('notificationStatus').textContent='Silent preview: no sound will play.';return;}
    if(action==='preview'&&appearance.reminderSound==='system')action='test';
    if(appearance.reminderSound==='custom'&&!reminderAudio)throw Error('Choose a custom sound first.');
    const needsAudio=!['none','system'].includes(appearance.reminderSound)&&+appearance.reminderVolume>0;
    const needed=action==='test'?['notifications',...(needsAudio?['offscreen']:[])]:['offscreen'];
    if(!await chrome.permissions.request({permissions:needed})){throw Error('Permission was not granted.');}
    $('notificationStatus').textContent=action==='test'?'Sending a test notification…':'Playing your sound preview…';
    const sample=events.find(e=>e.start>Date.now())||events.find(e=>e.start<=Date.now()&&e.end>Date.now())||{title:'Example class',room:'Example room',teacher:'Example teacher',start:Date.now()+appearance.reminderLead*60000};
    const result=await chrome.runtime.sendMessage({target:'afterbell-reminders',action,options:{...appearance,reminderAudio,previewClass:sample,zone}});
    if(result?.error)throw Error(result.error);
    $('notificationStatus').textContent=action==='test'?'Test notification sent. Check your notification centre.':'Sound preview finished.';
  }catch(err){$('notificationStatus').textContent=err.message;}
}
$('removeSound').addEventListener('click',()=>{soundRevision++;reminderAudio=null;if(appearance.reminderSound==='custom')appearance.reminderSound='chime';syncControls();applyAppearance();updateDraft();});
$('customSound').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file)return;const revision=++soundRevision;
  try{
    if(file.size>1024*1024)throw Error('Choose an audio file smaller than 1 MB.');
    if(!['audio/mpeg','audio/wav','audio/x-wav','audio/ogg','audio/mp4','audio/webm'].includes(file.type))throw Error('Choose an MP3, WAV, OGG or M4A audio file.');
    const url=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});
    const audio=new Audio();audio.preload='metadata';
    const duration=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Could not read this audio file.')),5000);audio.onloadedmetadata=()=>{clearTimeout(timer);resolve(audio.duration);};audio.onerror=()=>{clearTimeout(timer);reject(Error('This audio file could not be opened.'));};audio.src=url;});
    audio.removeAttribute('src');audio.load();
    if(!Number.isFinite(duration)||duration<=0||duration>30)throw Error('Choose a sound no longer than 30 seconds.');
    if(revision!==soundRevision)return;
    reminderAudio={url,type:file.type,name:file.name,duration};appearance.reminderSound='custom';syncControls();applyAppearance();updateDraft();$('notificationStatus').textContent='Sound ready to preview. Apply to save.';
  }catch(err){$('notificationStatus').textContent=err.message;}
  event.target.value='';
});
$('forgetConfirm').addEventListener('change',()=>{$('forgetData').disabled=!$('forgetConfirm').checked;});
$('forgetData').addEventListener('click',async()=>{
  if(!$('forgetConfirm').checked)return;
  $('forgetData').disabled=true;
  try { await chrome.runtime.sendMessage({target:'afterbell-reminders',action:'stop'}).catch(()=>{}); await eraseData(); await chrome.permissions.remove({permissions:['notifications','offscreen']}); location.reload(); }
  catch(err){$('privacyMessage').textContent=err.message;$('forgetData').disabled=false;}
});
tabView = new URLSearchParams(location.search).has('view');
updateViewControls();
init().catch(err => { $('message').textContent = 'Could not load timetable: ' + err.message; $('settings').open = true; $('settingsPanel').showModal(); });
