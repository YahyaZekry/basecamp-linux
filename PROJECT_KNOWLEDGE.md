# PROJECT KNOWLEDGE — Basecamp Desktop for Linux

> Last updated: 2026-06-26
> Status: Active

---

## What This Project Does

Unofficial Basecamp GNU/Linux desktop client built with Electron. Wraps `launchpad.37signals.com/signin` in a native window with tray icon, notifications, and unread badges. Upgraded from Electron 22 → 42 for BC5 compatibility.

---

## Tech Stack

| Category      | Details                                |
|---------------|----------------------------------------|
| Language      | JavaScript                             |
| Runtime       | Node.js, Electron 42.5.0               |
| Framework     | Electron (main process only, no renderer framework) |
| Bundler       | @electron/packager 18.4.4              |
| Linting       | ESLint 8 + eslint-config-airbnb-base   |
| Testing       | Vitest 4                                |
| Storage       | electron-settings (sync JSON)          |
| Auth (app)    | None (delegates to 37signals/Google)   |

---

## Project Structure

```
basecamp-linux/
├── app/                    # Electron app source (packaged into app.asar)
│   ├── app.js              # Main process: window, UA, nav, tray, menus
│   ├── compareVersions.js  # Pure function: semver comparison
│   ├── icon.js             # Icon path resolver (black/white scheme)
│   ├── menus.js            # App menu, context menu, tray menu
│   ├── notification.js     # Desktop notification helper
│   ├── package.json        # App metadata (name, version, deps)
│   ├── settings.js         # electron-settings wrapper with defaults
│   └── versionChecker.js   # Checks GitHub releases for updates
├── assets/
│   └── icons/              # Black and white icon sets (16 sizes each)
├── resources/
│   └── basecamp-full-stacked.png  # README logo
├── scripts/
│   └── build.js            # Package into standalone Electron app
├── tests/
│   └── compareVersions.test.js  # Vitest tests for version comparison
├── sources/                # GIMP source files for icons
├── README.md
├── LICENSE                 # MIT
└── package.json            # Dev dependencies & build scripts
```

Key files:
- `app/app.js` — entire main process logic (349 lines)
- `app/menus.js` — all menu definitions (File, Navigation, Edit, View, Settings, Help)
- `scripts/build.js` — packaging pipeline (npm install → @electron/packager → optional tar.gz)
- `app/versionChecker.js` — fetches `main/app/package.json` from GitHub to compare versions

---

## Server Actions / API Routes

None. This is an Electron desktop app — no server-side code. All network requests go directly from the renderer to `launchpad.37signals.com`, `app.basecamp.com`, and `accounts.google.com`.

---

## Hooks & Services

| Name                         | File                   | What It Does                                      |
|------------------------------|------------------------|---------------------------------------------------|
| `versionChecker.check()`     | `versionChecker.js`    | Fetches repo's package.json via HTTPS, compares versions |
| `notification(title, body)`  | `notification.js`      | Shows OS-native notification, click re-focuses window |
| `settings.get(key)`          | `settings.js`          | Reads setting with fallback to default            |
| `settings.set(key, val)`     | `settings.js`          | Writes setting persistently                       |
| `icon(suffix)`               | `icon.js`              | Resolves icon path for current scheme (black/white) |

---

## Component Inventory

No UI components. The app is a single BrowserWindow wrapping a web page.

---

## Environment Variables

None. All configuration is stored via `electron-settings` in the user's app data directory.

---

## Dev Commands

| Command            | What It Does                                              |
|--------------------|-----------------------------------------------------------|
| `npm run dev`      | Launch app in development mode (`electron ./app`)        |
| `npm run lint`     | Run ESLint on `app/` and `scripts/`                       |
| `npm test`         | Run Vitest tests (`vitest run`)                           |
| `npm run build`    | Package for x64 Linux (`node ./scripts/build.js --arch=x64`) |
| `npm run dist`     | Package + compress to tar.gz                              |

---

## External Integrations & Data Contracts

None. The app does not integrate with any external system that reads/writes its data.

---

## Systems

| System             | Status       | Details                                         |
|--------------------|--------------|-------------------------------------------------|
| Window mgmt        | ✅ Active     | BrowserWindow with position/size persistence   |
| Tray               | ✅ Active     | Click to show/hide, unread badge icons         |
| Notifications      | ✅ Active     | OS-native, click re-focuses window             |
| Version checker    | ✅ Active     | Checks GitHub releases, configurable at startup |
| Settings           | ✅ Active     | Persisted via electron-settings (sync JSON)     |
| User-Agent override| ✅ Active     | Strips Electron/Basecamp identifiers, platform-aware |
| Navigation filter  | ✅ Active     | `will-navigate`: allows 37signals/Google, opens external links in browser |
| Popup handler      | ✅ Active     | `setWindowOpenHandler`: allows OAuth popups (900×720), denies others |
| Upgrade CSS/JS     | ✅ Active     | Hides upgrade/update/interstitial elements, removes them via JS |

---

## Features

- **Login** — Multi-step form (email → password) via BC5's desktop.js `LoginForm` *(2026-06-25)*
- **Google sign-in** — OAuth popup opens in-app (900×720) via `setWindowOpenHandler` *(2026-06-25)*
- **Tray** — Icon in system tray, left-click toggles window, right-click for quit *(original)*
- **Unread badge** — Fetches `BC.unreads` or `Launchpad.unreads` count, updates tray icon *(2026-06-25)*
- **Notifications** — OS-native on new unreads, click re-focuses app *(original)*
- **Version checker** — Checks repo for newer releases on startup *(original)*
- **Icon scheme** — Black or white tray icons, configurable in Settings menu *(original)*
- **Clear data** — `session.clearStorageData()` + `session.clearCache()` via File menu *(original)*
- **Back/Forward** — Navigation history traversal via Alt+Left/Right *(original)*

---

## Workflows

**Login Flow**
1. App loads `launchpad.37signals.com/signin`
2. BC5's `desktop.js` (unblocked) creates `LoginForm` handler
3. User enters email → clicks Next → `fetchProfileForUsername()` POSTs to `/session/profile`
4. Server responds with strategies (password / passwordless / google)
5. If password: show password field → user submits → POST `/session`
6. If Google: show notice → user clicks Google button → OAuth popup opens in-app (900×720)
7. After auth: redirect to `app.basecamp.com/<account_id>`

**Unread Detection Flow**
1. `page-title-updated` event fires → `setTitles()` called
2. `executeJavaScript` checks `BC.unreads.all` or `Launchpad.unreads`
3. If unreads > 0: update tray icon with count badge, fire notification (once per session)
4. Window title updated with unread count

---

## Removed

- ~~`yarn`~~ → switched to npm (yarn/corepack not available) *(removed: 2026-06-25)*
- ~~`lzma-native` + `tar` deps~~ → replaced with system `tar -czf` in build script *(removed: 2026-06-25)*
- ~~`electron-packager` (deprecated)~~ → replaced with `@electron/packager` *(removed: 2026-06-25)*
- ~~Debug logging~~ — removed `[PAGE html]`, `[PAGE UA]`, `[app] original UA` etc. *(removed: 2026-06-25)*
- ~~Aggressive no-cache headers~~ — removed `Cache-Control: no-cache, no-store, must-revalidate` from loadURL *(removed: 2026-06-25)*
- ~~Devtools auto-open handler~~ — removed `devtools-opened` → `openDevTools` loop *(removed: 2026-06-25)*
- ~~desktop.js blocking via webRequest~~ — was blocking LoginForm handler, now loads normally *(removed: 2026-06-25)*

---

## Fixed

- "Next" button on login form did nothing — was caused by blocking `desktop.js` (contains `LoginForm` class); fixed by letting it load *(2026-06-25)*
- `console-message` deprecation warning — API changed in Electron 42; fixed by removing handler *(2026-06-25)*
- UA contained `BasecampforLinux/0.6.0` — server-side upgrade redirect; fixed by overriding with clean Chrome UA *(2026-06-25)*
- Unread detection returned 0 for BC5 — `BC` object structure differs; added `Launchpad.unreads` fallback *(2026-06-25)*
- Build failed with `lzma-native` — requires native compilation tools; replaced with system `tar` *(2026-06-25)*
- `compareVersions` returned 0 when missing parts compared to non-zero (e.g. `1.0.1` vs `1.0`) — `Number(undefined)` → `NaN`, `NaN < n` is always false; fixed with `toNum()` guard that treats missing parts as 0 *(2026-06-26)*

---

## Known Issues / TODOs

- [ ] Google sign-in: OAuth popup works but final redirect to `app.basecamp.com` should be tested end-to-end
- [ ] Unread badge: `executeJavaScript` expression may need tuning for BC5's actual `Launchpad` object shape

---

## Decisions & Notes

- **UA override**: Completely replaces Electron's default UA instead of stripping tokens. Uses `process.platform`/`process.arch` to generate platform-appropriate UA. The Browser UA contains `X11; Linux x86_64` for Linux, `Macintosh; Intel Mac OS X 10_15_7` for macOS, `Windows NT 10.0` for Windows.
- **desktop.js NOT blocked**: The file contains the login form handler (`LoginForm` class). Blocking it breaks the multi-step email → password flow. The "Please update" interstitial was a server-side redirect triggered by the `BasecampforLinux` UA, not desktop.js.
- **@electron/packager over electron-packager**: Original used the deprecated `electron-packager` package. Switched to `@electron/packager` (the official successor).
- **npm over yarn**: Original used yarn 4.0.1 but corepack was unavailable, so migrated to npm for portability.
- **GitHub repo**: Complete fresh history (1 commit) at `YahyaZekry/basecamp-linux`. No fork relationship to original.
- **Binary renamed to `basecamp-desktop`**: Changed `baseName` in `app/package.json` from `"basecamp"` to `"basecamp-desktop"` to avoid collision with the official Basecamp CLI (`basecamp`) installed at `~/.local/bin/basecamp`. Desktop entry renamed to `basecamp-desktop.desktop`, install path moved to `~/.local/opt/basecamp-desktop/`. *(2026-06-26)*
- **compareVersions extracted to pure module**: Separated from `versionChecker.js` into `app/compareVersions.js` so it can be tested without mocking Electron. Kept as property shorthand export (`compareVersions,`) in versionChecker for backward compatibility. *(2026-06-26)*

---

## Session Log

| Date       | Summary                                                                 |
|------------|-------------------------------------------------------------------------|
| 2026-06-25 | Upgraded Electron 22 → 42.5.0. Fixed BC5 login by unblocking desktop.js. Overrode UA to clean Chrome. Added Google OAuth popup support. Cleaned up debug logging. Switched yarn → npm. Created GitHub release v0.6.0. |
| 2026-06-26 | Fixed CSS flicker by moving `insertCSS` from `did-navigate` to `did-finish-load`. Extracted `compareVersions` into pure module and added Vitest with 5 tests. Fixed `NaN` bug in version comparison. Replaced nested ternary with flat lookup object for lint compliance. |
