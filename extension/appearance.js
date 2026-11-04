import {reminderDefaults} from './reminder-plan.js';
export const fonts = {
  helvetica: ['Helvetica · clean sans', "'Helvetica Neue',Helvetica,Arial,sans-serif"],
  ui: ['System sans', "'Segoe UI',Arial,sans-serif"], doto: ['Doto · dot matrix', 'Doto,Helvetica,Arial,monospace'], space: ['Space Grotesk · geometric', 'SpaceGrotesk,sans-serif'], jetbrains: ['JetBrains Mono · code', 'JetBrainsMono,monospace'], orbitron: ['Orbitron · futuristic', 'Orbitron,sans-serif'], lora: ['Lora · editorial', 'Lora,serif'], vt323: ['VT323 · retro terminal', 'VT323,monospace'], arial: ['Arial · classic', 'Arial,sans-serif'], georgia: ['Georgia · book', 'Georgia,serif'], courier: ['Courier · typewriter', "'Courier New',monospace"], consolas: ['Consolas · technical', 'Consolas,monospace'], trebutchet: ['Trebuchet · rounded', "'Trebuchet MS',sans-serif"], times: ['Times · traditional', "'Times New Roman',serif"]
};
export const defaults = { theme: 'system', clockStyle: 'minimal', bodyFont: 'helvetica', timerFont: 'doto', dotIcons: true, units: 'clock', scale: 100, accent: '#77cbb1', base: '#101917', ink: '#edf5f0', background: 'plain', dim: 40, motion: true, showSchedule: true, showTeacher: true, showPeriod: true, showProgress: true, showBreaks:true, inferBreaks:true, breakGapMinutes:10, showDayProgress:true, showDayPercentage:false, ...reminderDefaults };
export function remainingText(ms, units) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  if (units === 'minutes') return `${Math.ceil(s / 60)} min`;
  if (units === 'seconds') return `${s.toLocaleString()} sec`;
  return `${Math.floor(s / 3600) ? Math.floor(s / 3600) + ':' : ''}${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
export function clockState(e, active, now, zone) {
  const remaining = Math.max(0, (active ? e.end : e.start) - now);
  const fraction = active ? Math.max(0, Math.min(1, remaining / (e.end - e.start))) : null;
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(now).map(p => [p.type, p.value]));
  return { remaining, fraction, hour: (+p.hour % 12) * 30 + +p.minute / 2, minute: +p.minute * 6 + +p.second / 10, second: +p.second * 6 };
}
