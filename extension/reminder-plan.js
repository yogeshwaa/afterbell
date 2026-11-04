import {breakType} from './calendar.js';
export const reminderDefaults={remindersEnabled:false,reminderLead:2,reminderSound:'chime',reminderVolume:60,notificationDetails:false};
export function reminderOptions(appearance={}){
  const s={...reminderDefaults,...appearance};
  s.reminderLead=Math.min(60,Math.max(0,Number.isFinite(+s.reminderLead)?+s.reminderLead:2));
  s.reminderVolume=Math.min(100,Math.max(0,+s.reminderVolume||0));return s;
}
export function reminderPlan(events,appearance,history=[],now=Date.now()){
  const s=reminderOptions(appearance);if(!s.remindersEnabled)return{due:[],next:null};
  const seen=new Set(history),groups=new Map(),lead=s.reminderLead*60000;
  for(const e of events){
    if(breakType(e))continue;
    if(seen.has(e.start)||e.start<(s.reminderLead===0?now-60000:now))continue;
    if(!groups.has(e.start))groups.set(e.start,[]);groups.get(e.start).push(e);
  }
  const all=[...groups].sort((a,b)=>a[0]-b[0]).map(([start,classes])=>({start,when:start-lead,classes}));
  return{due:all.filter(g=>g.when<=now),next:all.find(g=>g.when>now)||null};
}
