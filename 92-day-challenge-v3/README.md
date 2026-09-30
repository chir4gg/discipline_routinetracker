# 92 Day Discipline Dashboard

A responsive, local-first habit and productivity tracker for **October 1, 2026 → December 31, 2026**.

## Stack

- HTML5
- CSS3
- Vanilla JavaScript
- localStorage
- Chart.js CDN
- PWA manifest + service worker

## Folder structure

```text
92-day-challenge/
├── index.html
├── days.html
├── statistics.html
├── settings.html
├── manifest.json
├── service-worker.js
├── css/
│   ├── style.css
│   ├── dashboard.css
│   └── responsive.css
├── js/
│   ├── app.js
│   ├── calendar.js
│   ├── habits.js
│   ├── statistics.js
│   └── storage.js
└── assets/icons/icon.svg
```

## Run in VS Code

1. Open this folder in VS Code.
2. Install the **Live Server** extension.
3. Right-click `index.html`.
4. Choose **Open with Live Server**.
5. The dashboard opens in your browser.

Do not simply double-click the HTML file if you want the PWA service worker to work. Use Live Server or another local web server.

## localStorage

All habit check-ins, steps, reading pages, settings and custom habits are stored in the browser under:

`discipline92_v1`

Refreshing or reopening the browser keeps the data on that device/browser.

This first version has no account or cloud sync.

## Test a day

1. Open Dashboard.
2. Tick a few habits.
3. Enter steps, e.g. `13245`.
4. Enter book pages, e.g. `20`.
5. Refresh the page.
6. The values should remain.
7. Open **Days** to see the date's progress.

Use `index.html?date=2026-10-01` to open a specific challenge date.

## Test weekly statistics

Complete several habits across Oct 1–7. Enter steps on a few days. Open **Statistics** and the Week 1 section will calculate:

- habit completions
- completion percentage
- each habit's x/7 count
- weekly steps
- average entered-day steps
- days reaching the step goal

## Backup

Go to Settings → Export JSON.

To restore:
Settings → Import JSON → choose your backup.

Always export before a full reset.

## PWA

The project contains `manifest.json` and `service-worker.js`.

The service worker needs HTTP/HTTPS (for example Live Server) and will cache the app shell for offline use. Chart.js is loaded from a CDN, so fully offline chart loading depends on whether the CDN resource has already been cached.

## Future app conversion

A practical next step is:

```text
This website
   ↓
PWA
   ↓
Capacitor / native wrapper
   ↓
iOS + Android
```

For true multi-device sync, add authentication + a cloud database/API later. The current localStorage layer is intentionally isolated in `js/storage.js`, making that migration easier.
