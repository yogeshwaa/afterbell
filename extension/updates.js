const releaseURL = 'https://yogeshwaa.github.io/afterbell/extension-version.json';
const snoozeKey = 'extensionUpdateSnooze';
const oneDay = 24 * 60 * 60 * 1000;

function versionParts(version) {
  if (typeof version !== 'string' || !/^\d{1,5}(\.\d{1,5}){0,3}$/.test(version)) return null;
  return version.split('.').map(Number);
}

function isNewer(version, installed) {
  const next = versionParts(version);
  const current = versionParts(installed);
  if (!next || !current) return false;
  for (let i = 0; i < 4; i++) {
    const difference = (next[i] ?? 0) - (current[i] ?? 0);
    if (difference) return difference > 0;
  }
  return false;
}

async function showUpdate() {
  const response = await fetch(releaseURL, {
    cache: 'no-store', credentials: 'omit', redirect: 'error',
    referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) return;
  const { version } = await response.json();
  if (!isNewer(version, chrome.runtime.getManifest().version)) return;

  const { [snoozeKey]: snooze } = await chrome.storage.local.get(snoozeKey);
  if (snooze?.version === version && snooze.until > Date.now()) return;

  const notice = document.getElementById('extensionUpdate');
  document.getElementById('extensionUpdateTitle').textContent = `Afterbell ${version} is available`;
  document.getElementById('extensionUpdateLater').addEventListener('click', async () => {
    await chrome.storage.local.set({ [snoozeKey]: { version, until: Date.now() + oneDay } });
    notice.hidden = true;
  });
  notice.hidden = false;
}

// Update checks are optional to the timetable and can fail when offline.
showUpdate().catch(() => {});
