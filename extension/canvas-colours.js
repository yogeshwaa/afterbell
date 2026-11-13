import { saveCanvasColours } from './storage.js';

// Chrome serializes this function into the active tab's isolated world.
export function readCanvasCards(expectedOrigin) {
  if (location.origin !== expectedOrigin) return [];
  const courses = new Map();
  for (const card of document.querySelectorAll('.ic-DashboardCard')) {
    const link = card.querySelector('a.ic-DashboardCard__link');
    const heading = card.querySelector('.ic-DashboardCard__header-title');
    const swatch = card.querySelector('.ic-DashboardCard__header_hero');
    if (!link || !heading || !swatch || !card.getClientRects().length) continue;
    const url = new URL(link.href, location.href);
    const id = /^\/courses\/(\d+)(?:\/|$)/.exec(url.pathname)?.[1];
    const name = heading.textContent.trim().slice(0, 300);
    const colour = /^rgb\((\d+), (\d+), (\d+)\)$/.exec(getComputedStyle(swatch).backgroundColor);
    if (url.origin !== expectedOrigin || !id || !name || !colour) continue;
    courses.set(id, {
      id, name,
      original: (heading.title || card.getAttribute('aria-label') || '').trim().slice(0, 300),
      code: (card.querySelector('.ic-DashboardCard__header-subtitle')?.textContent || '').trim().slice(0, 300),
      colour: '#' + colour.slice(1).map(value => Number(value).toString(16).padStart(2, '0')).join('')
    });
  }
  return [...courses.values()];
}

const normalized = value => (value || '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
export function subjectKey(entry) {
  return JSON.stringify([normalized(entry.code), normalized(entry.title)]);
}
const palette = ['#689af5', '#e27488', '#5bb69e', '#c39a52', '#a995e7', '#70b4ca', '#d888bd', '#94aa62'];
export function subjectColour(entry, mappings) {
  const key = subjectKey(entry);
  const saved = mappings[key]?.colour;
  if (/^#[\da-f]{6}$/i.test(saved || '')) return saved;
  let hash = 0;
  for (const char of key) hash = (Math.imul(31, hash) + char.codePointAt(0)) >>> 0;
  return palette[hash % palette.length];
}

function suggestedCourse(subject, courses) {
  const code = normalized(subject.code);
  const title = normalized(subject.title);
  const byCode = code ? courses.filter(course => normalized(course.code) === code) : [];
  if (byCode.length === 1) return byCode[0].id;
  const candidates = byCode.length ? byCode : courses;
  const byTitle = title ? candidates.filter(course => [course.name, course.original].some(name => normalized(name) === title)) : [];
  return byTitle.length === 1 ? byTitle[0].id : '';
}

export function setupCanvasColours({ getSubjects, getMappings, onChange, isFullTab }) {
  const $ = id => document.getElementById(id);
  const dialog = $('canvasPanel');
  const apply = $('canvasApply');
  const status = $('canvasStatus');
  let busy = false;
  let selections = [];
  let sourceOrigin = '';
  let coursesById = new Map();

  function updateSwatch(select, swatch, saved) {
    const colour = select.value === 'keep' ? saved?.colour : coursesById.get(select.value)?.colour;
    swatch.style.backgroundColor = colour || '';
  }

  function showMatches(subjects, courses) {
    const mappings = getMappings();
    const list = $('canvasMatches');
    list.replaceChildren();
    selections = [];
    for (const [key, subject] of subjects) {
      const label = document.createElement('label');
      const title = document.createElement('span');
      title.textContent = subject.code ? `${subject.title} · ${subject.code}` : subject.title;
      const select = document.createElement('select');
      const swatch = document.createElement('span');
      swatch.className = 'canvas-swatch';
      swatch.setAttribute('aria-hidden', 'true');
      const saved = mappings[key];
      select.append(new Option('Use Afterbell colour', ''));
      if (saved) select.append(new Option('Keep saved Canvas colour', 'keep'));
      for (const course of courses) {
        const detail = course.code && course.code !== course.name ? ` · ${course.code}` : '';
        select.append(new Option(course.name + detail, course.id));
      }
      select.value = saved
        ? (saved.origin === sourceOrigin && coursesById.has(saved.id) ? saved.id : 'keep')
        : suggestedCourse(subject, courses);
      updateSwatch(select, swatch, saved);
      select.addEventListener('change', () => updateSwatch(select, swatch, saved));
      label.append(title, select, swatch);
      list.append(label);
      selections.push({ key, select });
    }
    apply.hidden = false;
  }

  async function open() {
    if (busy || dialog.open) return;
    dialog.showModal();
    apply.hidden = true;
    $('canvasMatches').replaceChildren();
    const subjects = getSubjects();
    if (!subjects.size) {
      status.textContent = 'Import and save your Sentral timetable first.';
      return;
    }
    if (isFullTab()) {
      status.textContent = 'Open Canvas in Card View, then click the Afterbell icon in Chrome and select Sync Canvas colours.';
      return;
    }
    busy = true;
    status.textContent = 'Looking for Canvas course cards…';
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const url = tab?.url && new URL(tab.url);
      if (!tab?.id || url?.protocol !== 'https:') throw new Error();
      sourceOrigin = url.origin;
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id }, func: readCanvasCards, args: [sourceOrigin]
      });
      if (!dialog.open) return;
      const courses = result || [];
      if (!courses.length) {
        status.textContent = 'No Canvas course cards found. Switch your Canvas Dashboard to Card View and try again.';
        return;
      }
      coursesById = new Map(courses.map(course => [course.id, course]));
      showMatches(subjects, courses);
      status.textContent = 'Check which Canvas course matches each timetable subject, then save.';
    } catch {
      status.textContent = 'Open your school’s Canvas Dashboard in Card View, then open Afterbell from the Chrome toolbar and try again.';
    } finally {
      busy = false;
    }
  }

  apply.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    apply.disabled = true;
    const mappings = { ...getMappings() };
    for (const { key, select } of selections) {
      if (select.value === 'keep') continue;
      const course = coursesById.get(select.value);
      if (course) mappings[key] = { origin: sourceOrigin, id: course.id, colour: course.colour };
      else delete mappings[key];
    }
    try {
      await saveCanvasColours(mappings);
      onChange(mappings);
      dialog.close();
    } catch {
      status.textContent = 'Could not save your course colours. Try again.';
    } finally {
      busy = false;
      apply.disabled = false;
    }
  });
  $('canvasClose').addEventListener('click', () => dialog.close());
  for (const button of document.querySelectorAll('[data-canvas-sync]')) button.addEventListener('click', open);
}
