const patterns={chime:[[660,0,.20],[880,.18,.35]],bell:[[1046,0,.7],[1568,.03,.5]],soft:[[440,0,.5],[554,.25,.5]],digital:[[880,0,.09],[880,.15,.09],[1174,.3,.13]],arcade:[[523,0,.12],[659,.1,.12],[784,.2,.12],[1046,.3,.3]]};
export function builtinSound(name){
  const notes=patterns[name]||patterns.chime,rate=22050,length=Math.ceil((Math.max(...notes.map(n=>n[1]+n[2]))+.08)*rate),buffer=new ArrayBuffer(44+length*2),v=new DataView(buffer);
  const str=(o,s)=>[...s].forEach((c,i)=>v.setUint8(o+i,c.charCodeAt(0)));
  str(0,'RIFF');v.setUint32(4,36+length*2,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);str(36,'data');v.setUint32(40,length*2,true);
  for(let i=0;i<length;i++){let sample=0;for(const[f,start,duration]of notes){const t=i/rate-start;if(t>=0&&t<duration)sample+=Math.sin(2*Math.PI*f*t)*Math.min(1,t/.01)*Math.exp(-5*t/duration)*.35;}v.setInt16(44+i*2,Math.max(-1,Math.min(1,sample))*32767,true);}
  return new Blob([buffer],{type:'audio/wav'});
}
export async function playSound({reminderSound='chime',reminderVolume=60,reminderAudio=null}={}){
  if(['none','system'].includes(reminderSound)||+reminderVolume===0)return{played:false};
  let url,temporary=false;
  if(reminderSound==='custom'){
    if(!reminderAudio?.url?.startsWith('data:audio/')||reminderAudio.url.length>1500000)throw Error('Choose a valid custom sound first.');url=reminderAudio.url;
  }else{url=URL.createObjectURL(builtinSound(reminderSound));temporary=true;}
  const audio=new Audio(url);audio.volume=Math.min(1,Math.max(0,+reminderVolume/100));
  await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{audio.pause();cleanup();reject(Error('Sound playback timed out.'));},32000);function cleanup(){clearTimeout(timeout);if(temporary)URL.revokeObjectURL(url);}audio.onended=()=>{cleanup();resolve();};audio.onerror=()=>{cleanup();reject(Error('This sound could not be played.'));};audio.play().catch(e=>{cleanup();reject(e);});});
  return{played:true};
}
