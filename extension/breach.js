const sequence = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
const codes = ['1C','55','BD','E9','7A'];
const size = 5, capacity = 8, seconds = 45;
const byId = id => document.getElementById(id);
const dialog = byId('breachGame');
const matrix = byId('breachMatrix');
const cells = [];
let keys = [], lastKey = 0, timer, deadline, target, buffer, used, cursor, phase, returnFocus;
const random = values => values[Math.floor(Math.random() * values.length)];
const row = i => Math.floor(i / size), col = i => i % size;
const range = Array.from({length:size * size}, (_, i) => i);

function allowed(i, path) {
  if (path.includes(i)) return false;
  if (!path.length) return row(i) === 0;
  const last = path.at(-1);
  return path.length % 2 ? col(i) === col(last) : row(i) === row(last);
}
function chips(id, values) {
  byId(id).replaceChildren(...values.map(value => {
    const chip = document.createElement('span');
    chip.textContent = value || '··';
    if (value) chip.className = 'filled';
    return chip;
  }));
}
function round() {
  clearInterval(timer);
  deadline = 0;
  phase = 'ready';
  buffer = [];
  used = [];
  cursor = 0;
  const grid = range.map(() => random(codes));
  const solution = [];
  // Plant a valid route; retry the route if it boxes itself in.
  while (solution.length < 6) {
    const options = range.filter(i => allowed(i, solution));
    if (options.length) solution.push(random(options));
    else solution.length = 0;
  }
  target = solution.map(i => grid[i]);
  cells.forEach((cell, i) => {
    cell.textContent = grid[i];
    cell.setAttribute('aria-label', `${grid[i]}, row ${row(i)+1}, column ${col(i)+1}`);
  });
  chips('breachTarget', target);
  byId('breachTime').textContent = seconds + '.0';
  byId('breachGauge').value = seconds;
  byId('breachStatus').textContent = 'Select a code from the top row to start the timer.';
  byId('breachRetry').textContent = 'New puzzle';
  draw();
  cells[cursor].focus();
}
function draw() {
  dialog.dataset.phase = phase;
  chips('breachBuffer', Array.from({length:capacity}, (_, i) => buffer[i]));
  const playing = phase === 'ready' || phase === 'running';
  cells.forEach((cell, i) => {
    cell.disabled = !playing || !allowed(i, used);
    cell.classList.toggle('used', used.includes(i));
    cell.tabIndex = !cell.disabled && i === cursor ? 0 : -1;
  });
}
function finish(won, message) {
  clearInterval(timer);
  phase = won ? 'success' : 'failed';
  byId('breachStatus').textContent = message;
  byId('breachRetry').textContent = 'Play again';
  draw();
  byId('breachRetry').focus();
}
function tick() {
  const left = Math.max(0, deadline - performance.now()) / 1000;
  byId('breachTime').textContent = (Math.ceil(left * 10) / 10).toFixed(1);
  byId('breachGauge').value = left;
  if (!left) finish(false, 'Connection timed out. Try a fresh matrix.');
}
function choose(i) {
  if (!dialog.open || cells[i].disabled) return;
  if (phase === 'running' && performance.now() >= deadline) { tick(); return; }
  if (phase === 'ready') {
    phase = 'running';
    deadline = performance.now() + seconds * 1000;
    timer = setInterval(tick, 100);
  }
  used.push(i);
  buffer.push(cells[i].textContent);
  if (buffer.length >= target.length && target.every((code, j) => code === buffer.at(-target.length + j))) {
    finish(true, 'Access granted. Sequence uploaded.');
    return;
  }
  const options = range.filter(j => allowed(j, used));
  if (buffer.length === capacity || !options.length) {
    finish(false, buffer.length === capacity ? 'Buffer full. Sequence rejected.' : 'No routes left. Try a fresh matrix.');
    return;
  }
  cursor = options.reduce((a,b) => Math.abs(a-i) <= Math.abs(b-i) ? a : b);
  byId('breachStatus').textContent = used.length % 2 ? 'Pick your next code from the highlighted column.' : 'Pick your next code from the highlighted row.';
  draw();
  cells[cursor].focus();
}
for (const i of range) {
  const cell = document.createElement('button');
  cell.type = 'button';
  cell.addEventListener('click', () => choose(i));
  cell.addEventListener('focus', () => {
    cells[cursor]?.setAttribute('tabindex', '-1');
    cursor = i;
    cell.tabIndex = 0;
  });
  cells.push(cell);
  matrix.append(cell);
}
matrix.addEventListener('keydown', event => {
  const key = event.key;
  if (!key.startsWith('Arrow')) return;
  event.preventDefault();
  const options = range.filter(i => !cells[i].disabled);
  if (!options.length) return;
  const direction = key === 'ArrowLeft' || key === 'ArrowUp' ? -1 : 1;
  const next = (options.indexOf(cursor) + direction + options.length) % options.length;
  cells[options[next]].focus();
});
byId('breachRetry').addEventListener('click', round);
byId('breachClose').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => {
  clearInterval(timer);
  if (returnFocus instanceof HTMLElement) returnFocus.focus({preventScroll:true});
});

document.addEventListener('keydown', event => {
  if (dialog.open && event.key === 'Escape') {
    event.preventDefault();
    event.stopImmediatePropagation();
    dialog.close();
    return;
  }
  if (event.repeat) return;
  if (dialog.open || document.querySelector('dialog[open]') || event.isComposing ||
      event.altKey || event.ctrlKey || event.metaKey ||
      event.target.closest('input, textarea, select, [contenteditable]')) {
    keys = [];
    return;
  }
  const now = performance.now();
  if (now - lastKey > 4000) keys = [];
  lastKey = now;
  keys.push(event.key.length === 1 ? event.key.toLowerCase() : event.key);
  while (!keys.every((key,i) => key === sequence[i])) keys.shift();
  if (keys.length !== sequence.length) return;
  keys = [];
  event.preventDefault();
  returnFocus = document.activeElement;
  dialog.showModal();
  round();
}, true);
