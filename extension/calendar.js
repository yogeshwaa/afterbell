export function unescapeText(value = '') {
  return value.replace(/\\([nN,;\\])/g, (_, c) => /n/i.test(c) ? '\n' : c);
}

function dateValue(value, params) {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/.exec(value);
  if (!m) throw new Error('This file contains an unsupported date format. Export a timed class timetable from Sentral.');
  const [, y, mo, d, h, mi, s, utc] = m;
  const parts = [+y, +mo - 1, +d, +h, +mi, +s];
  const check = new Date(Date.UTC(...parts));
  if (+y < 100 || +mo < 1 || +mo > 12 || +d < 1 || check.getUTCDate() !== +d || +h > 23 || +mi > 59 || +s > 59) throw new Error('A class contains an invalid calendar date or time.');
  if (utc) return Date.UTC(...parts);
  const tz = /TZID="?([^";]+)"?/i.exec(params)?.[1];
  if (!tz) return new Date(...parts).getTime();
  // Resolve an IANA wall-clock time, including daylight saving.
  const format = new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  const target = Date.UTC(...parts);
  let result = target;
  for (let i = 0; i < 3; i++) {
    const p = Object.fromEntries(format.formatToParts(result).map(x => [x.type, x.value]));
    result += target - Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  }
  return result;
}

export function parseICS(text) {
  if (!/BEGIN:VCALENDAR/i.test(text) || !/END:VCALENDAR/i.test(text)) throw new Error('Choose a complete .ics calendar file.');
  const lines = text.replace(/\r\n?/g, '\n').replace(/\n[ \t]/g, '').split('\n');
  const events = [];
  let event = null;
  let nested = 0;
  for (const line of lines) {
    if (line.toUpperCase() === 'BEGIN:VEVENT') { if (event) throw new Error('The calendar contains overlapping event blocks.'); event = Object.create(null); nested = 0; continue; }
    // Alarms and other nested components have their own DESCRIPTION fields.
    if (event && /^BEGIN:/i.test(line)) { nested++; continue; }
    if (event && /^END:/i.test(line) && line.toUpperCase() !== 'END:VEVENT' && nested) { nested--; continue; }
    if (nested) continue;
    if (line.toUpperCase() === 'END:VEVENT') {
      if (event && event.STATUS?.value.toUpperCase() !== 'CANCELLED') {
        if (event.RRULE || event.RDATE || event.RECURRENCE_ID) throw new Error('Recurring calendars are not supported yet. Use the Sentral export with individual dated classes.');
        if (!event.DTSTART || !event.DTEND) throw new Error('A class is missing its start or end time.');
        const start = dateValue(event.DTSTART.value, event.DTSTART.params);
        const end = dateValue(event.DTEND.value, event.DTEND.params);
        if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) throw new Error('A class has invalid start/end times.');
        const description = unescapeText(event.DESCRIPTION?.value);
        const summary = unescapeText(event.SUMMARY?.value) || 'Untitled class';
        const type=breakType({title:summary});
        events.push({ start, end, title: type?summary:summary.replace(/^[^:]+:\s*/, ''), code: summary.includes(':') ? summary.split(':')[0] : '', room: unescapeText(event.LOCATION?.value).replace(/^Room:\s*/i, '') || 'Room not provided', teacher: /^Teacher:\s*(.+)$/im.exec(description)?.[1]?.trim() || 'Teacher not provided', period: /^Period:\s*(.+)$/im.exec(description)?.[1]?.trim() || '', ...(type?{kind:'break',breakType:type}:{}) });
      }
      event = null; continue;
    }
    if (!event) continue;
    const match = /^([^;:]+)((?:;[^:]*)?):(.*)$/.exec(line);
    if (match) event[match[1].toUpperCase().replace('-', '_')] = { params: match[2], value: match[3] };
  }
  if (event) throw new Error('The calendar contains an incomplete class.');
  if (!events.length) throw new Error('No classes were found in this file.');
  return events.sort((a, b) => a.start - b.start || a.end - b.end);
}

export function currentAndNext(events, now = Date.now()) {
  events=events.filter(e=>!breakType(e));
  return { current: events.filter(e => e.start <= now && e.end > now), next: events.find(e => e.start > now) };
}
export function trackingState(events, zone, now = Date.now()) {
  events=events.filter(e=>!breakType(e));
  const {current,next}=currentAndNext(events,now);
  if(current.length) return {kind:'active',current,next};
  if(next && next.start-now<=60*60*1000) return {kind:'upcoming',current,next};
  const today=dayKey(now,zone);
  const todayHasMore=next && dayKey(next.start,zone)===today;
  const hasFinished=events.some(e=>e.end<=now);
  const kind=todayHasMore && events.some(e=>e.end<=now&&dayKey(e.start,zone)===today) ? 'break' : hasFinished?'done':'waiting';
  return {kind,current,next};
}
export function breakType(event){
  if(event.kind==='break'&&['Recess','Lunch','Break'].includes(event.breakType))return event.breakType;
  const title=String(event.title||'').trim();
  const match=/^(recess|lunch|morning\s+tea|break)(?:\s+(?:break|[12]))?(?:\s*[-–:|].*)?$/i.exec(title)||/^(recess|lunch|morning\s+tea|break)$/i.exec(String(event.period||'').trim())||/^(recess|lunch|morning\s+tea|break)$/i.exec(String(event.code||'').trim());
  return match?(/^lunch/i.test(match[1])?'Lunch':/^break$/i.test(match[1])?'Break':'Recess'):null;
}
export function dayKey(time, zone) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(time);
  const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}
