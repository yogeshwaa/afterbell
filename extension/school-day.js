import {breakType} from './calendar.js';
const minute=60000;
export function schoolDay(source,zone,{showBreaks=true,inferBreaks=true,breakGapMinutes=10}={}){
  const classes=source.filter(e=>!breakType(e)).map(e=>({...e,kind:'class'})).sort((a,b)=>a.start-b.start||a.end-b.end);
  if(!classes.length)return{entries:[],classes:[],start:null,end:null};
  const start=classes[0].start,end=Math.max(...classes.map(e=>e.end));
  const named=source.filter(e=>breakType(e)&&e.start<end&&e.end>start).map(e=>({...e,start:Math.max(start,e.start),end:Math.min(end,e.end),kind:'break',title:breakType(e),inferred:false}));
  const inferred=[];
  if(showBreaks&&inferBreaks){
    const occupied=[...classes,...named].sort((a,b)=>a.start-b.start||b.end-a.end);
    let left=occupied[0],covered=left.end;
    const min=Math.max(5,Math.min(60,+breakGapMinutes||10))*minute;
    for(const right of occupied.slice(1)){
      if(right.start>covered&&right.start-covered>=min&&left.kind==='class'&&right.kind==='class'){
        const a=/^\d+$/.test(left.period||'')?+left.period:null,b=/^\d+$/.test(right.period||'')?+right.period:null;
        const duration=right.start-covered;
        const free=duration>75*minute||(a!==null&&b!==null&&b-a>1);
        inferred.push({start:covered,end:right.start,kind:'break',title:free?'Free period / gap':'Break',inferred:true,free});
      }
      if(right.end>=covered){covered=right.end;left=right;}
    }
    const localMinutes=time=>{const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:zone,hour:'numeric',minute:'numeric',hourCycle:'h23'}).formatToParts(time).map(p=>[p.type,p.value]));return +p.hour*60 + +p.minute;};
    const candidates=inferred.filter(e=>!e.free);
    if(!named.some(e=>e.title==='Lunch')){
      const lunch=candidates.filter(e=>{const t=localMinutes(e.start);return t>=690&&t<=870&&e.end-e.start>=20*minute;}).sort((a,b)=>(b.end-b.start)-(a.end-a.start))[0];
      if(lunch)lunch.title='Lunch';
    }
    if(!named.some(e=>e.title==='Recess')){
      const recess=candidates.find(e=>e.title==='Break'&&localMinutes(e.start)<720);if(recess)recess.title='Recess';
    }
  }
  return{classes,start,end,entries:[...classes,...(showBreaks?named:[]),...inferred].sort((a,b)=>a.start-b.start||a.end-b.end)};
}
export function dayProgress(day,now=Date.now()){
  if(day.start===null||day.end<=day.start)return null;
  const fraction=Math.max(0,Math.min(1,(now-day.start)/(day.end-day.start)));
  const grouped=new Map();day.classes.forEach((e,i)=>{
    const marker={start:e.start,end:e.end,label:String(e.period||i+1),provided:!!e.period,position:(e.start-day.start)/(day.end-day.start),active:e.start<=now&&e.end>now,passed:e.end<=now};
    if(!grouped.has(e.start))grouped.set(e.start,marker);
    else{const old=grouped.get(e.start);old.label=[...new Set([...old.label.split('/'),marker.label])].join('/');old.active||=marker.active;old.passed&&=marker.passed;old.end=Math.max(old.end,marker.end);old.provided&&=marker.provided;}
  });
  return{fraction,percent:Math.floor(fraction*100),markers:[...grouped.values()]};
}
