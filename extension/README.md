# Afterbell

## v1.16.5

The daily lineup aligns active and upcoming classes, the day rail follows the length of the lineup, and cancelling settings preserves the date you are viewing. Uploaded backgrounds respect system reduced motion, and Apply waits for the reminder permission request before saving.


## v1.16.4

Times, dates and timetable labels use the system sans-serif with plain zeros. Saved Space Grotesk and Consolas selections open in system sans on upgrade.


## v1.16.3

Space Grotesk is the default interface font and replaces Consolas in timetable times and interface labels. Existing Consolas font selections open in Space Grotesk. The Doto countdown remains the default.


## v1.16.2

The Afterbell bell uses the same dot-matrix logo in the header, welcome screen, startup animation, browser tab, and toolbar. The dot-matrix preference still switches interface controls between dotted and outline icons.


## v1.16.1

Subject colours now appear on the main countdown and daily lineup. Canvas matches and Afterbell fallback colours use the same palette in the weekly grid and daily view.


## v1.16.0

The A/B timetable shows colour-coded classes. To use your Canvas colours, open the Canvas Dashboard in Card View, click Afterbell in the Chrome toolbar, then choose Sync Canvas colours under A/B cycle or Settings → Timetable. Check the suggested matches and save. Repeat to refresh after editing colours in Canvas. Confirmed mappings are encrypted on this device.


## v1.15.0

The lineup follows the next scheduled school day after the final class. Use A/B cycle to browse the dated timetable and set which week is current. Afterbell alternates the labels every Monday; actual class dates come from the imported file. Selecting a day pins it until you choose Back to live.


## v1.14.0

The question-mark button opens Help & support, with direct links for support and feedback alongside the built-in timetable guide. The full-tab dashboard uses more of the viewport, with a wider settings panel and a clearer active class.


## v1.13.0

Enter ↑ ↑ ↓ ↓ ← → ← → B A on the dashboard to open the hidden Breach Protocol puzzle. Match the upload sequence by alternating columns and rows, using eight buffer slots and 45 seconds. Press Escape to return.


## v1.12.0

The Cyberpunk theme now uses lime panels, cyan signals, and an animated code matrix. The terminal countdown can also be used with other themes.

## v1.10.1

Shorter interface copy, simpler settings labels and Helvetica periods in Doto text. Timetable, privacy and reminder behavior are unchanged.


## v1.10.0 — Breaks, day progression & precise alignment

Settings → 01 Design now includes **Show recess & lunch**, **Estimate breaks from timetable gaps**, a minimum-gap threshold, **Show vertical school-day progress**, and an optional percentage (off by default). All choices preview before Apply and can be cancelled.

Named Recess/Lunch/Morning tea events in the calendar are shown as direct timetable entries. Uncovered gaps of at least 10 minutes (customisable from 5 to 60) can be estimated as Recess/Lunch/Break. Estimated rows are explicitly labelled; gaps longer than 75 minutes or with skipped period numbers are labelled Free period / gap. These are guesses, not official school bell times. Turn inference off to show only named breaks, or turn breaks off entirely. Breaks never trigger class reminders or appear as active classes on the toolbar badge. Active visible breaks have their own remaining-time countdown.

The vertical day track fills downward through the timetable. Each period badge is measured against and centered on its actual Period label; when labels are hidden, it anchors to the subject row. It remeasures after font loads and resizing. Time is interpolated through displayed rows while the optional percentage uses elapsed time from the first class start to the last class end, including breaks. Future dates show 0%; completed dates show 100%. The rail and percentage can be hidden independently.

Switches now use fixed 32×18px tracks with 12px circular thumbs, independent of the selected font. Settings navigation and section headings consistently use Doto and matching 01–06 numbering.

## v1.9.0 — Class reminders

Open Settings → Alerts, enable class reminders, and Apply. Chrome asks for optional notification and audio-playback permissions. The default lead time is **2 minutes**; choose 0–60 minutes in half-minute steps. Reminders are opt-in so existing users are not silently granted new access.

Choose Chime, School bell, Soft tones, Digital beep, Arcade, System sound or Silent. Change the volume for Afterbell sounds, or upload MP3/WAV/OGG/M4A audio up to 1 MB and 30 seconds. Preview sound and Test notification let you check the draft before Apply. System sound follows your OS volume. Custom audio stays encrypted locally.

Reminders run with the popup/tab closed while Chrome remains running. Click a reminder to open/focus Afterbell. Class/room/teacher details are hidden by default; enable them only if you want them on notifications or your lock screen. Disabling reminders and applying cancels pending alarms and clears active class alerts. Deleting all local data also stops audio, clears alerts and revokes optional permissions.

A single reminder covers classes with the same start time. Recent reminder history prevents repeats, including after worker/browser restarts. Chrome scheduling, sleeping devices, Do Not Disturb and OS notification settings can delay or suppress alerts; an overdue reminder may be delivered after waking if the class has not started. Finished classes are skipped.

Chrome 116 or newer is required. See the bundled privacy policy for the added local audio and notification handling.
Afterbell tones and uploaded sounds are browser audio; they may play while OS Do Not Disturb hides banners. Choose Silent or disable reminders when you need quiet.


## v1.8.0 — End of day & privacy

After the final class, the live card says **Your day is done**. The next countdown begins exactly one hour before that class. Long breaks do not show a multi-hour countdown; active classes still display normally. Reaching the final date in an export shows the end-of-day card with a reminder to import a newer export.

Settings → Privacy now explains local data handling, links the bundled privacy policy, and offers deletion of all local data. Timetable details, import filenames and backgrounds use encrypted local storage; older saved data migrates automatically when this version opens. No additional permissions are requested. See `PUBLICATION-NOTES.md` for the remaining public-policy hosting and Chrome Web Store dashboard steps before publication.

## v1.7.0 — Welcome copy, punctuation & icon styles

New installs automatically open the welcome introduction in a full browser tab. If the introduction has not yet been shown, the first toolbar launch opens that tab as a fallback. Opening normal saved timetables and updating the extension do not reopen onboarding.

The welcome button now reads **I've downloaded my timetable**, and the first step says **Download timetable**. Welcome headings and generated class details use standard periods rather than dot-matrix full stops.

Under Settings → Design, **Dot-matrix icons** switches the app's icons between dotted and outline styles. It includes header controls, welcome/import graphics, action buttons, disclosure controls, dropdown chevrons and the calendar picker. It previews immediately and follows Apply/Cancel. Applying the preference also changes Chrome's toolbar icon. Chrome's extension-management listing retains the packaged Afterbell brand icon.

## v1.6.1 — Regression fixes

Redundant Open in tab controls are hidden in tabs and fullscreen windows. All dropdowns follow the selected interface font. Reduced motion, fullscreen startup/Escape, invalid calendars, delayed-operation cancellation, midnight rollover and media validation received fixes. See QA-REPORT.md for the 172-check regression report.

## v1.6.0 — Preview, Apply & Cancel

Settings now use a draft. Theme, font, colour, clock style, background, visibility, time-zone, and timetable changes preview immediately but do not save until you click **Apply changes**. A small live clock preview appears inside Design. **Cancel changes** restores the last saved version, including any previous background or timetable. Importing a file and removing/resetting items also require Apply. If you close Settings to inspect the full view, a floating Apply/Cancel bar remains available. Closing the popup or reloading the page discards unapplied edits. If saving fails, the draft stays available to retry or cancel.

The default interface font is now **Helvetica · clean sans** using `Helvetica Neue, Helvetica, Arial, sans-serif`. Helvetica is used when installed; Arial is the fallback. Existing explicit font preferences are preserved. There are now 14 font choices. Font licences remain bundled locally.

Onboarding navigation, date browsing, tab/fullscreen actions, and preview-mode navigation take effect immediately; they do not change saved timetable or appearance settings.

## v1.5.0 — Getting started, typography & desktop dashboard

New users see a welcome card with **Get started** (opens the censored import guide), **I already have my .ics** (opens Import), and **Explore first**. The import icon is highlighted until a timetable is loaded. Successful import ends onboarding; a rejected file leaves setup available. Reopen setup with **Show getting started** in Settings. Existing users with imported classes go straight to their timetable.

Choose **Interface font** and **Countdown font** independently under Settings → Design. There are 13 choices: System sans, Doto, Space Grotesk, JetBrains Mono, Orbitron, Lora, VT323, Arial, Georgia, Courier, Consolas, Trebuchet and Times. The six custom fonts are bundled for offline use with their SIL Open Font Licences in `fonts/`. System fonts use fallback families on devices where they are unavailable. The Afterbell wordmark and section labels keep the dot-matrix identity.

The tab and fullscreen window use the full browser viewport. At desktop widths the large countdown sits beside the timetable. Narrow windows stack vertically. Settings opens as a side drawer with Design / Timetable / Display / Help navigation, a live typography sample, and matching dot-matrix headings, monochrome cards and red-accent switches. Existing timetable and appearance settings remain compatible.

## v1.4.0 — Help, fullscreen & dot icon

- Click **?** in the header or open **Settings → Help** for a five-step guide to downloading a Sentral ICS export and importing it. The three screenshots are adapted, censored examples. Identifying student/school details and URLs are obscured; only the censored copies are included. Original screenshots and the sample personal ICS are not bundled.
- Use the header **↗** or **Settings → Display → Open in a tab** to keep the clock visible.
- Use **Settings → Display → Enter fullscreen**. From the toolbar popup this opens a fullscreen browser window; from a tab it uses page fullscreen. Press Escape for page fullscreen or F11 for a fullscreen browser window. The fullscreen button also toggles fullscreen from the dedicated window.
- New monochrome dot-matrix clock icon with a red accent, including simplified small toolbar sizes.

## v1.3.0 — Minimal redesign

Click the gear in the top right to open Settings. Appearance, backgrounds, clock styles, preview, import, and time-zone controls now live inside this panel. Close with the × button or Escape. The main view contains only the live class, timetable, and date browser.

The interface uses monochrome surfaces, restrained red accents, and a locally bundled Doto dot-matrix font for a NOTHING-inspired design. Doto is an open-source alternative, not Nothing's proprietary font. Its SIL Open Font License is included in `fonts/OFL.txt`. No font requests leave the browser. Existing theme choices and imported timetable data remain compatible.

## Appearance (v1.1)

Open **Personalise** to change the design. Settings save automatically and work in the toolbar popup and full-tab view.

- Themes: system, light, dark, forest, rose, cyberpunk, or custom background/text/accent colours. Changing a colour activates the custom theme.
- Countdown styles: minimal, time-left pie, progress ring, analogue clock, digital, and cyberpunk terminal. The pie and ring show the fraction of class time remaining; before class they show NEXT. The analogue hands show the current school time, with a separate countdown beneath them.
- Show minutes/seconds, rounded-up total minutes, or total seconds; adjust countdown text size.
- Backgrounds: plain, animated aurora, moving grid, drifting stars, or a local PNG/JPEG/WebP/GIF/MP4/WebM (up to 3 MB). Uploaded media is stored locally. Videos loop silently; browser codec support applies. Use the dimming slider to keep text readable.
- Disable animation to stop built-in motion and pause video. Image/GIF uploads are hidden while animation is disabled because animated GIF playback cannot be paused. Built-in backgrounds also respect the system reduced-motion preference.
- Hide the timetable, teacher, period, or progress bar for a simpler view.
- **Preview styles** shows a clearly labelled example class without replacing your timetable. Exit preview to return to live tracking. Preview does not affect the toolbar badge.
- **Reset appearance** restores defaults while keeping your timetable and uploaded media. **Remove upload** deletes saved background media.

To update an existing installation, replace the extension files in its original folder and click its reload button at `chrome://extensions`. Keep the same folder to retain your imported timetable and settings.

## Install in Chrome

1. Extract the ZIP if you downloaded the ZIP version.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the `class-clock` folder containing `manifest.json`.
5. Open Chrome's extensions menu (puzzle piece) and pin **Afterbell**.
6. Click Afterbell, expand **Import & settings**, and choose your Sentral `.ics` export.

The popup shows the current class, a countdown in hours/minutes/seconds, its start and end time, classroom, teacher, and period. Between classes it counts down to the next class and shows its date when needed. Overlapping classes are shown together. The toolbar badge shows rounded-up minutes remaining for the first active class and refreshes about once a minute while Chrome is running. Open the full-tab view with the arrow in the top right to keep the clock visible.

Choose any date to browse its timetable. Set the school time zone in settings (Sydney by default). UTC dates from Sentral convert to that time zone, including daylight saving. Dates without a time zone use the computer's local time zone.

## Updating your timetable

Export a new `.ics` file from Sentral and import it again. This replaces the saved timetable. The extension does not log in to Sentral or automatically receive substitutions, room changes, cancellations, or updated exports. It cannot infer details omitted from the file. Missing teacher/room details are labelled accordingly.

Your example uses individual dated events, which are supported. Folded lines, escaped text, UTC dates and IANA time zones are supported. Recurring calendars and all-day events are rejected with an explanation rather than displaying an incomplete timetable.

## Privacy

Everything runs locally. Afterbell checks a public GitHub Pages version file when opened. It keeps your timetable and preferences local and has no analytics, accounts or access to other website content. Only `storage` (save timetable) and `alarms` (refresh toolbar badge) permissions are requested. Remove the timetable in settings to clear its saved class data. The provided extension does not bundle your personal timetable; import it after installation.

## Implementation

Plain JavaScript and CSS, no build step or dependencies. Manifest V3 with a module service worker. See Chrome's [action API](https://developer.chrome.com/docs/extensions/reference/api/action) for badge behavior and [loading an unpacked extension](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked).

## v1.5.1 — Countdown separator

Countdown colons use one circular dot per position (two dots total), independent of the selected font. Applied to the live countdown and typography preview, including hour-long countdowns. The colon remains available to screen readers.


### Extension updates

If a newer release is available, **Update** opens the download and reload instructions. **Remind me later** hides the notice for 24 hours for that version.

Copyright © WA 2026

In Settings → Design, choose **Cyberpunk** to preview the lime terminal palette, cyan highlights, and animated code matrix. The **Cyberpunk terminal** countdown style can also be selected on its own. Use **Enable animation** to turn the effects off, or your system’s reduced-motion setting. Select **Apply** to save.

### v1.14.1
Refined Helvetica labels, settings and Help typography, consistent control spacing and quieter current-class status. Dotted branding and countdowns keep their established character.

UI review guided by unslop by Damir Sokolovsky (@heydamir), CC BY 4.0.
