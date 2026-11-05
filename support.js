// Paste the public submission endpoint from Formspree's Integration tab here.
const endpoint = 'https://formspree.io/f/xyeeonzp';
const configured = /^https:\/\/formspree\.io\/f\/[a-z0-9]+$/i.test(endpoint);
const fromExtension = new URLSearchParams(location.search).get('from') === 'extension';
const source = fromExtension ? 'Extension' : location.pathname.endsWith('/app.html') ? 'Web app' : 'Website';

const dialog = document.createElement('dialog');
dialog.className = 'feedback-dialog';
dialog.setAttribute('aria-labelledby', 'feedback-title');
dialog.innerHTML = `
  <div class="feedback-heading">
    <h2 id="feedback-title">Send feedback</h2>
    <button type="button" class="feedback-close" aria-label="Close feedback">×</button>
  </div>
  <form class="feedback-form" method="dialog">
    <label>What’s this about?
      <select name="topic">
        <option value="Idea or theme">Idea or theme</option>
        <option value="Help or bug report">Help or bug report</option>
      </select>
    </label>
    <label>Your message
      <textarea name="message" rows="4" required maxlength="3000" placeholder="Tell me what you’d like, or what went wrong."></textarea>
    </label>
    <small>Leave out passwords, school details and timetable files.</small>
    <label class="feedback-check">
      <input type="checkbox" name="followup">
      The Afterbell support team can email me to follow up.
    </label>
    <label id="feedback-email" hidden>Email for replies
      <input type="email" name="email" autocomplete="email" maxlength="254" disabled>
    </label>
    <label class="feedback-check">
      <input type="checkbox" name="consent" required>
      I agree to send my message and the Afterbell area I came from to Afterbell support via Formspree.
    </label>
    <button class="feedback-send" type="submit">Send feedback</button>
    <p class="feedback-status" role="status"></p>
  </form>`;
document.body.append(dialog);

const form = dialog.querySelector('form');
const status = dialog.querySelector('.feedback-status');
const send = dialog.querySelector('.feedback-send');
const emailLabel = dialog.querySelector('#feedback-email');
const { topic, message, followup, email, consent } = form.elements;

function syncEmail() {
  emailLabel.hidden = !followup.checked;
  email.disabled = !followup.checked;
  email.required = followup.checked;
}

function openFeedback(hash) {
  topic.selectedIndex = hash === '#feedback' ? 0 : 1;
  if (!configured) status.textContent = 'Feedback submissions aren’t open yet.';
  if (!dialog.open) dialog.showModal();
}

send.disabled = !configured;
dialog.querySelector('.feedback-close').addEventListener('click', () => dialog.close());
followup.addEventListener('change', syncEmail);
document.addEventListener('click', event => {
  const link = event.target.closest('a.support-link');
  if (!link || event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  openFeedback(link.hash);
});

if (location.pathname.endsWith('/support.html') && ['#feedback', '#help'].includes(location.hash)) {
  openFeedback(location.hash);
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (send.disabled || !consent.checked || !form.reportValidity()) return;
  if (!message.value.trim()) {
    status.textContent = 'Enter a message before sending.';
    message.focus();
    return;
  }
  const payload = new FormData();
  payload.set('topic', topic.value);
  payload.set('message', message.value.trim());
  payload.set('source', source);
  payload.set('consent', 'Agreed to send feedback');
  if (followup.checked) payload.set('email', email.value.trim());
  send.disabled = true;
  status.textContent = 'Sending…';
  try {
    const response = await fetch(endpoint, {
      method: 'POST', body: payload, headers: { Accept: 'application/json' },
      credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) {
      status.textContent = response.status === 429 ? 'Too many requests. Try again in a minute.' : 'Couldn’t send feedback. Your message is still here.';
      return;
    }
    form.reset();
    syncEmail();
    status.textContent = 'Thanks. Your feedback was sent.';
  } catch {
    status.textContent = 'Couldn’t confirm delivery. Your message is still here.';
  } finally {
    send.disabled = false;
  }
});
