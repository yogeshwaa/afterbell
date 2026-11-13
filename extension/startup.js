import { brandMark } from './brand.js';

const svgNamespace = 'http://www.w3.org/2000/svg';
const motion = matchMedia('(prefers-reduced-motion: reduce)');

function ring(bell) {
  const shell = document.createElementNS(svgNamespace, 'g');
  const clapper = document.createElementNS(svgNamespace, 'g');
  const bead = bell.lastElementChild;
  shell.append(...bell.children);
  bead.setAttribute('cy', '108');
  clapper.append(bead);
  shell.append(clapper);
  bell.append(shell);
  shell.style.transformOrigin = '64px 18px';
  clapper.style.transformOrigin = '64px 43px';

  // Sample a damped swing. The lighter clapper trails the bell shell.
  const shellFrames = [];
  const clapperFrames = [];
  for (let frame = 0; frame <= 60; frame++) {
    const t = frame / 60;
    const phase = t * Math.PI * 5;
    const decay = (1 - t) ** 1.5;
    const swing = 29 * Math.sin(phase) * decay;
    const lag = 17 * Math.sin(phase - Math.PI / 2) * decay * Math.min(t * 12, 1);
    shellFrames.push({ transform: `rotate(${swing}deg)` });
    clapperFrames.push({ transform: `rotate(${lag}deg)` });
  }
  shell.animate(shellFrames, 820);
  clapper.animate(clapperFrames, 820);
}

async function playStartup() {
  if (motion.matches || !await chrome.runtime.sendMessage({ target: 'afterbell-startup' })) return;
  if (motion.matches) return;
  const splash = document.createElement('div');
  splash.className = 'startup-splash';
  splash.setAttribute('aria-hidden', 'true');
  const bell = brandMark();
  splash.append(bell);
  document.body.append(splash);
  ring(bell);
  bell.animate([
    { transform: 'scale(.74)', opacity: 0 },
    { transform: 'scale(1.08)', opacity: 1, offset: .15 },
    { transform: 'scale(1)', opacity: 1, offset: .74 },
    { transform: 'scale(1.22)', opacity: 1, offset: .86 },
    { transform: 'scale(1.46)', opacity: 0 },
  ], { duration: 1030, fill: 'forwards' });

  const fade = splash.animate([
    { opacity: 1 }, { opacity: 1, offset: .76 }, { opacity: 0 },
  ], { duration: 1030, fill: 'forwards' });
  try {
    await fade.finished;
    if (motion.matches) return;
    for (const element of document.querySelectorAll('body > header, body > main, body > .welcome, body > footer')) {
      if (element.hidden) continue;
      element.animate([
        { transform: 'translateY(12px) scale(.97)', opacity: .65 },
        { transform: 'translateY(-3px) scale(1.01)', opacity: 1, offset: .58 },
        { transform: 'none', opacity: 1 },
      ], { duration: 350, easing: 'ease-out' });
    }
  } finally {
    splash.remove();
  }
}

playStartup().catch(() => {});
