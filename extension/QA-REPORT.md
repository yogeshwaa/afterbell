# Afterbell v1.16.5 bug and visual review

## Findings and fixes

| Finding | Fix |
| --- | --- |
| The active class shifted the time column 8 px. | Give every row the same padding. Use the subject colour for the active row border and tint. |
| Cancelling a settings edit replaced a pinned date with today. | Store the pinned date separately from the input field and preserve it when cancelling a draft. |
| A one-second refresh could interrupt an unfinished date edit. | Keep rendering the last committed date while the field is being edited. Update the field when it loses focus. |
| Uploaded video continued playing with system reduced motion enabled. The animation switch also hid still photos. | Pause video and hide GIF backgrounds when reduced motion is on. Keep still backgrounds visible. |
| Apply could start another save while a reminder permission request was pending. | Capture the draft and lock Apply and Cancel until the permission request and save finish. A denial leaves the draft available to retry. |
| At narrow widths the countdown and lineup touched, and the rail forced a sparse lineup to stay tall. | Separate the panels, narrow the rail and time columns, and size the rail to the actual list. |
| The desktop panels pushed the footer below the bottom at 1440 × 900, even with a short lineup. | Account for the header and footer in panel sizing. |
| Help labels used decorative numbers, and the prototype's clock separator looked heavier than the digits. | Simplify Help to action labels and use two round dots in the prototype clock. |

Layout references included [Subjective's weekday timetable](https://app.subjective.candra.dev/timetable) and [Google Calendar's day and week views](https://support.google.com/calendar/answer/6110849). [Nothing OS](https://nothing.tech/nothing-os) informed the restrained chrome and clock treatment.

## Verification

- 133 Chromium extension checks covering import, appearance, six clock styles, media, settings, tab and fullscreen behavior. No uncaught browser errors.
- 57 browser checks for period alignment, recess and lunch, switches and responsive layout.
- 36 notification, alarm and offscreen audio checks, plus 11 consent checks including repeated Apply during a pending permission request.
- 14 local privacy and deletion checks, plus 12 browser restart and delayed operation checks.
- 90 calendar, day boundary, reminder planning and school-day model cases.
- Additional targeted runs covered the date edit and reduced motion fixes, Canvas colour matching and refresh, A/B rollover, the minigame, and the clickable layout prototype.
- Visually reviewed the extension at 1440 px and 320 px, including the timetable and Help dialogs. The visual samples use fictional timetable entries.

Canvas was exercised with a simulated Dashboard. Notification delivery used an isolated browser fixture with permissions pregranted. The permission request itself was simulated for denial and repeated Apply. The standalone layout prototype uses sample data.
