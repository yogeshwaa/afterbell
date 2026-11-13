// Work with civil dates so school weeks stay Monday to Sunday across DST.
const dayMs = 86400000;
const stamp = key => Date.parse(key + 'T00:00:00Z');
export const offsetDay = (key, days) => new Date(stamp(key) + days * dayMs).toISOString().slice(0, 10);
export const monday = key => offsetDay(key, -((new Date(stamp(key)).getUTCDay() + 6) % 7));
export function cycleWeek(key, anchor) {
  const weeks = (stamp(monday(key)) - stamp(anchor?.monday || '1970-01-05')) / (7 * dayMs);
  const base = anchor?.week === 'B' ? 'B' : 'A';
  return weeks % 2 === 0 ? base : base === 'A' ? 'B' : 'A';
}
export function weekStart(today, week, anchor, pair = 0) {
  const start = monday(today);
  const first = cycleWeek(start, anchor) === 'A' ? start : offsetDay(start, -7);
  return offsetDay(first, pair * 14 + (week === 'B' ? 7 : 0));
}
