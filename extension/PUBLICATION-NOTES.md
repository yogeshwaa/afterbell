# Chrome Web Store privacy preparation — v1.8.0

Checked against Google's [user-data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq), [handling requirements](https://developer.chrome.com/docs/webstore/program-policies/data-handling), and [Limited Use policy](https://developer.chrome.com/docs/webstore/program-policies/limited-use) on 3 November 2026.

## Completed in the extension

- Privacy policy bundled at `privacy.html`, linked before timetable import and in Settings → Privacy.
- Import disclosure explains the data used, its purpose, local processing and Apply-to-save behavior.
- Timetable records, filenames and media are encrypted locally with AES-256-GCM. The non-extractable key stays in local IndexedDB. Existing plaintext extension records migrate on opening the updated app.
- Only `storage` and `alarms` permissions; no host permissions, content scripts, history or cookies access.
- Network connections, remote scripts and frames are blocked by the content security policy.
- No analytics, advertising, remote account, cloud sync, sale or developer access to imported data.
- Users can replace or remove data and delete all extension data and its key. Original downloaded files remain outside the extension's control.

## Required before publishing

1. Host the included `privacy.html` at a public HTTPS URL controlled by the publisher. A local extension file is not a publicly accessible policy URL for the store listing.
2. Supply that URL in the Developer Dashboard and provide a real publisher support/contact route. Ensure the policy's contact wording matches that route.
3. Complete the Privacy practices disclosures and Limited Use certification using the dashboard's current definitions. Explain local handling of timetable/teacher details and user-selected media; do not describe the extension as handling no user information merely because it is offline.
4. Keep the policy, store description, dashboard answers and actual behavior consistent. Use the stated single purpose: displaying the user's imported class timetable and countdown with local customisation.
5. Submit the packaged extension for Google's review. These code and documentation changes do not constitute store approval or a legal certification.

Google's FAQ requires disclosure even for local-only handling and requires publishers to provide privacy information in the dashboard. No policy website was published and no developer-dashboard declarations were submitted by this update.

## v1.9.0 reminder update

Required permissions remain storage and alarms. Optional notifications and offscreen permissions support user-enabled reminders and chosen sound playback. Custom audio and deduplication history are encrypted locally. Notification text is passed to Chrome/the local OS, and can appear on the lock screen when class details are enabled. Update the public policy and dashboard disclosures to match this version before publication. No new network service or third-party analytics was introduced.
