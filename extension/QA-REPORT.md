# Afterbell v1.10.0 — Verification

## New feature checks

29 break/day-model cases and 61 real-extension browser checks passed. Period-marker centres were compared against their actual Period-label centres with less than one CSS pixel difference, across all 14 interface fonts and widths of 375, 430, 900 and 1440px.

The browser checks also cover fixed 32×18px switches and 12px thumbs for every font, numbered 01–06 Doto navigation, named/inferred break rows, estimation labels, inference/visibility toggles, threshold validation, Apply/Cancel, saved preferences, recess/lunch live countdowns, optional percentage, complete-day state and no horizontal overflow. No uncaught browser errors were observed.

Model checks cover the actual supplied Sentral sample (20-minute recess, 40-minute lunch), named breaks, legacy titles, generic Break, subjects that must not be mistaken for breaks, missing period numbers, long/free gaps, overlap handling, percentage boundaries, empty/future/completed days, and excluding breaks from class reminders.

## Regression checks

137 real-extension regression checks, 12 saved-state/concurrency checks, and 14 privacy/encryption/deletion checks passed. Existing calendar, day-end and reminder-plan checks also passed. Tests used isolated Windows Chromium profiles with the real extension loaded.

## Behavior and limits

Explicit breaks come from the selected calendar. Inferred gaps are estimates, not authoritative bell times. They can be disabled separately from named breaks. Long gaps or skipped period numbers are labelled free periods/gaps. No new permissions or network access were added.

The percentage measures elapsed time from first class start to last class end, including breaks. The vertical fill interpolates through displayed rows so period markers align with the correct labels even when text wraps. Missing period labels fall back to subject-row alignment. The percentage is off by default.

These results describe the tested browser and fixtures, rather than guaranteeing the absence of all bugs across every platform.
