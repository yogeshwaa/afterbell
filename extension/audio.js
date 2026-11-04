import {playSound} from './sound.js';
chrome.runtime.onMessage.addListener((message,sender,respond)=>{
  if(sender.id!==chrome.runtime.id||message?.target!=='afterbell-audio')return;
  playSound(message.options).then(respond,error=>respond({error:error.message}));return true;
});
