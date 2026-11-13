import {brandMark} from './brand.js';
const grids = {
  upload:['0001000','0011100','0101010','0001000','1001001','1000001','1111111'],
  help:['0111100','1000010','0000010','0001100','0001000','0000000','0001000'],
  expand:['0011111','0000011','0000101','0001001','0010000','0100000','1000000'],
  settings:['0011100','0101010','1100011','1001001','1100011','0101010','0011100'],
  close:['1000001','0100010','0010100','0001000','0010100','0100010','1000001'],
  arrow:['0001000','0000100','0000010','1111111','0000010','0000100','0001000'],
  fullscreen:['1110111','1000001','1000001','0000000','1000001','1000001','1110111'],
  reset:['0111100','1100010','1010001','1000000','1000001','0100010','0011100'],
  check:['0000001','0000010','0000100','1001000','0110000','0000000','0000000'],
  preview:['0001000','0110110','1000001','1001001','1000001','0110110','0001000'],
  trash:['0011100','1111111','0100010','0101010','0101010','0100010','0111110'],
  calendar:['0100010','1111111','1000001','1111111','1010101','1000001','1111111'],
  minus:['0000000','0000000','0000000','1111111','0000000','0000000','0000000'],
  plus:['0001000','0001000','0001000','1111111','0001000','0001000','0001000']
};
const paths = {
  upload:'M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6',help:'M8 8a4 4 0 1 1 6 3.5c-2 1-2 2-2 3M12 19h.01',expand:'M5 19 19 5M7 5h12v12',settings:'M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',close:'m5 5 14 14M19 5 5 19',arrow:'M3 12h18m-7-7 7 7-7 7',fullscreen:'M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6',reset:'M3 11a9 9 0 1 1 2 7M3 4v7h7',check:'m4 12 5 5L20 6',preview:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12 M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',trash:'M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7',calendar:'M4 5h16v16H4z M8 3v4m8-4v4M4 10h16',minus:'M4 12h16',plus:'M4 12h16M12 4v16'
};
const ns='http://www.w3.org/2000/svg';
export function icon(name,dotted=true) {
  const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('class','ui-icon');
  if(dotted){
    (grids[name]||grids.help).forEach((row,y)=>[...row].forEach((on,x)=>{if(on==='1'){const dot=document.createElementNS(ns,'circle');dot.setAttribute('cx',3+x*3);dot.setAttribute('cy',3+y*3);dot.setAttribute('r','1');dot.setAttribute('fill','currentColor');svg.append(dot);}}));
  }else{const path=document.createElementNS(ns,'path');path.setAttribute('d',paths[name]||paths.help);path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','1.6');path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');svg.append(path);}
  return svg;
}
const controls={importShortcut:['upload'],helpShortcut:['help'],expand:['expand'],openSettings:['settings'],closeSettings:['close'],closeHelp:['close'],closeCycle:['close'],canvasClose:['close'],getStarted:['arrow','Get started'],haveFile:['upload',"I've downloaded my timetable"],setupGuide:['help','Read the guide'],setupImport:['upload','Import timetable'],openTab:['expand','Open in a tab'],fullscreen:['fullscreen'],replayWelcome:['reset','Show getting started'],goImport:['upload','Import timetable'],preview:['preview'],removeBackground:['trash','Remove upload'],clear:['trash','Remove timetable'],resetAppearance:['reset','Reset appearance'],applySettings:['check','Apply changes'],cancelSettings:['close','Cancel changes'],applyDraft:['check','Apply'],revertDraft:['close','Cancel'],previewSound:['preview','Preview sound'],testNotification:['calendar','Test notification'],removeSound:['trash','Remove audio']};
export function updateIcons(dotted) {
  for(const [id,[name,label]]of Object.entries(controls)){
    const el=document.getElementById(id);if(!el)continue;
    const text=label??(el.classList.contains('icon-button')?'':el.textContent.replace(/[⛶↗]/g,'').trim());
    el.replaceChildren(icon(name,dotted));if(text)el.append(document.createTextNode(text));
  }
  document.getElementById('brandMark')?.replaceChildren(brandMark());
  document.querySelector('.welcome-mark')?.replaceChildren(brandMark());
  document.querySelector('.import-symbol')?.replaceChildren(icon('upload',dotted));
  document.querySelectorAll('.settings-content summary').forEach(el=>{el.querySelector('.ui-icon')?.remove();el.append(icon(el.parentElement.open?'minus':'plus',dotted));});
  document.body.dataset.dotIcons=String(dotted);
}

