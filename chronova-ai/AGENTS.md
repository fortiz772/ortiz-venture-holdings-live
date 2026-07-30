# Chronova AI — agent handoff

Scope: this file governs `chronova-ai/` only. The rest of `ortiz-venture-holdings-live`
(the parent repo) is a separate static marketing site with its own conventions —
don't assume anything here applies outside this directory.

## What this is

Chronova AI is a mobile life-and-calendar app: schedule, live weather, a
computed daily brief, focus-time insight, a breathing coach, goals, tasks,
and a lightweight business/notes view. It's a **web reproduction** built to
match (and exceed, visually) an existing native iOS app of the same name —
the native app's source isn't in this or any repo this session had access
to, so this is an independent implementation, not a port of real code.

Live at `https://www.ortizventureholdings.com/chronova-ai/` once merged to
`main` (Netlify serves the repo root as a static site; this directory is
just a path under it, same pattern as `stockpilot-ai/`).

## Everything is one file, on purpose

`index.html` (~2050 lines) is the entire app: HTML shell, all CSS, and the
full React app in one inline `<script type="text/babel">`. There is no
build step, no `package.json`, no bundler.

**Do not introduce a build step, a framework CLI, or a multi-file split
without discussing it with the human first.** This is a deliberate
architectural choice, matching how the rest of the parent repo works
(`stockpilot-ai/`, the root `index.html`) — plain files that Netlify serves
as-is. If the app grows enough that a single file becomes genuinely
unwieldy, that's a real conversation to have, not a default to reach for.

### Stack (all loaded via CDN `<script>` tags in `<head>`)

- **React 18.3.1** — UMD, **production** build (`react.production.min.js` /
  `react-dom.production.min.js`), not the dev build. This matters: see
  "framer-motion console warning" below.
- **Babel Standalone 7.29.0** — transforms the inline JSX in the browser at
  page-load time. This is why the script tag is `type="text/babel"` instead
  of `type="module"` or plain `text/javascript`.
- **Tailwind CDN (Play CDN)** — JIT-compiles utility classes from the DOM at
  runtime. `tailwind.config` (theme extend: `barlow`/`seriflux` font
  families) is set in a `<script>` tag *after* the CDN script loads — that
  ordering is required by Play CDN, don't reorder it.
- **Framer Motion 11.11.17** — UMD, exposes `window.Motion` (the UMD global
  is `Motion`, not `FramerMotion`; the app does
  `window.Motion || window.FramerMotion` defensively).
- **Google Fonts** — Barlow (weights 400–900) + Instrument Serif (italic
  only) via `fonts.googleapis.com` link tag.

No npm install, no `node_modules` in this directory. If you need to test
locally, just serve the directory (`python3 -m http.server`, `npx serve`,
etc.) and open it — no build command exists or is needed.

### Known gotcha: framer-motion + React dev build

`AnimatePresence` wrapping a single keyed `motion.*` child (used for the
month/week/day view-transition animations) triggers a spurious React
"Each child in a list should have a unique key prop" console warning **when
using React's development build** — confirmed via an isolated minimal
repro (bare `<AnimatePresence><motion.div key="x">` with nothing else on
the page still warns), so it's an upstream framer-motion 11.x quirk, not a
bug in this app's markup. React's **production** build strips the dev-only
check that triggers it entirely, which is why the CDN tags point at
`react.production.min.js` / `react-dom.production.min.js` rather than the
`.development.js` builds the parent site's root `index.html` uses. Don't
"fix" this by switching back to the dev build.

## Design system

The visual identity is inherited from the parent site
(`ortiz-venture-holdings-live/index.html`) — same fonts, same signature
gradient, same "liquid glass" language — applied to a mobile-app UI instead
of a marketing page. Keep new UI consistent with this; don't introduce a
different type system, palette, or corner-radius/shadow language without
reason.

### Color

Brand gradient (used for the app icon, the FAB-adjacent "Insights" nav
button, focus-window cards, and the breathing-coach orb):
```
sky   #0EA5E9 → cyan #22D3EE → emerald #10B981
```
Typical CSS: `linear-gradient(135deg, #0EA5E9, #22D3EE 55%, #10B981)`.

Neutrals (Tailwind `slate` scale, used directly as utility classes —
`text-slate-950`, `border-slate-100`, `bg-slate-50`, etc. — not custom
tokens):
| Role | Class / value |
|---|---|
| Primary text / headings | `text-slate-950` / `#0f172a` (body default) |
| Secondary text | `text-slate-500`, `text-slate-400` |
| Placeholder / faint | `text-slate-300` |
| Hairline borders | `border-slate-100` / `border-slate-200` |
| Page background | `#f7fbff` (near-white, cool) |
| Card surfaces | `#ffffff` or `.liquid-glass` (see below) |
| Primary buttons / active states | `bg-slate-950` (near-black, not pure `#000`) |

Category colors — this is the one place color carries real meaning
(events, goals, and the Business-tab work filter are all colored by these).
Defined once in the `CATEGORIES` array near the top of the script; every
component reads from `CATEGORY_MAP`, nothing hardcodes a category color
elsewhere:
| Category | swatch (dot/bar) | strong (selected chip bg) | soft (pill bg) | text (on soft) |
|---|---|---|---|---|
| Work | `#0EA5E9` | `#0369A1` | `#E0F2FE` | `#0369A1` |
| Personal | `#10B981` | `#047857` | `#D1FAE5` | `#047857` |
| Health | `#F43F5E` | `#BE123C` | `#FFE4E6` | `#BE123C` |
| Travel | `#F59E0B` | `#B45309` | `#FEF3C7` | `#B45309` |
| Other | `#8B5CF6` | `#6D28D9` | `#EDE9FE` | `#6D28D9` |

Adding a 6th category means adding one more row here with all four shades —
don't add a category with only a `swatch` and let the rest fall back to
something improvised.

Semantic (non-brand) colors used sparingly and only for their literal
meaning — don't reuse these for anything else:
- Destructive actions / delete: `rose-500` / `#f43f5e`
- Success toast icon: `emerald-500`
- Live "now" line in the week/day time grid: `#f43f5e`

### Typography

Two families, same pairing as the parent site:
- **Barlow** (sans) — all UI text, body copy, labels, buttons. Weights in
  use: 500 (rare), 600–700 (`font-bold`, most body text), 800–900
  (`font-black`, headings/emphasis/buttons — this app leans heavily on
  `font-black` for anything that needs to read as a heading or a number).
- **Instrument Serif, italic only** (`.font-luxury` / `font-seriflux`
  Tailwind key) — reserved for the one big display moment per screen: the
  "Home" greeting date, each screen's big headline ("Track what matters.",
  "Work, at a glance.", etc.). Never used for body copy or UI chrome. If a
  new screen needs a headline, it gets one `<h1 class="font-luxury text-3xl
  text-slate-950">` — don't invent a second display treatment.

Scale is informal (no `clamp()`/fluid type system) — screen sizes are fixed
around the phone-frame width, so headings use fixed Tailwind text sizes
(`text-3xl` for screen H1s, `text-lg` for modal titles, `text-sm`/`text-xs`
for everything else) rather than viewport-relative sizing.

### The "phone" shell

Every screen renders inside `.phone-body`, which behaves differently by
viewport:
- **< 640px (real phones)**: `.phone-body` is `100dvh` × full width, no
  border, no radius — the app *is* the viewport, no chrome.
- **≥ 640px (desktop/tablet)**: `.phone-body` becomes a fixed 420×860px
  card with a 10px `#020617` bezel, 3rem corner radius, a decorative
  `.phone-notch` pill at the top and `.phone-home-indicator` bar at the
  bottom, centered on a softly gradient-washed page background
  (`.phone-stage`). This is deliberate — a past revision of this app used a
  conventional responsive desktop layout (sidebar, wide grid) and the
  human explicitly rejected that: **the mobile layout is the product, at
  every viewport size**, not a mobile fallback of a desktop design. Don't
  reintroduce a separate desktop layout.

All overlays (modals, the filters bottom sheet, toasts, the breathing
coach) are `position: absolute` scoped to `.phone-body`, not `fixed` to the
browser viewport — that's what keeps them inside the phone frame on
desktop instead of covering the whole browser window. If you add a new
overlay, follow this pattern (`absolute inset-0` inside `.phone-body`, not
`fixed inset-0`).

### Components / surface language

- **`.liquid-glass`** — translucent, blurred card background
  (`backdrop-filter: blur`), used for a small number of "special" cards
  (the Chronova Insight brief, event/goal modals via `.liquid-glass-strong`
  which is more opaque/higher-contrast). Most cards are plain
  `rounded-2xl border border-slate-100` — glass is the exception for
  emphasis, not the default card style.
- **Cards**: `rounded-2xl` (16px) for content cards, `rounded-[26px]` /
  `rounded-[28px]` for modals and the bottom sheet, `rounded-full` for
  every pill/button/chip/avatar. There's no `rounded-lg`/`rounded-md` usage
  — the radius scale is intentionally binary (cards vs. pills), keep it
  that way.
- **Buttons**: primary action = `rounded-full bg-slate-950 text-white
  font-black`; secondary = `rounded-full border border-slate-200
  text-slate-600`; destructive = `text-rose-500` (text-only, or
  `bg-rose-500` for the confirm-delete button specifically).
- **Icons**: hand-drawn inline SVG components (no icon library), 24×24
  viewBox, stroke-based (`stroke="currentColor"`, `strokeWidth` 1.8–2.6,
  `strokeLinecap="round"`), sized via `className="h-4 w-4"` (default) or a
  `className` prop override. Every icon is a small named function
  (`ChevronIcon`, `PlusIcon`, `TargetIcon`, ...) near the top of the
  script, before the components that use them. New icons should follow the
  same shape: a tiny function, stroke style, no fills except for solid
  glyphs like `CheckIcon`/`SparkleIcon`.
- **Motion**: Framer Motion throughout, short durations (`.16`–`.3`s),
  `easeOut`/`easeInOut`. Sheets slide up (`initial={{ y: "100%" }}`),
  modals scale+fade, month/week/day transitions slide horizontally based
  on navigation `direction`. Nothing loops or auto-plays except the
  breathing coach's inhale/hold/exhale animation, which only runs while
  the user has pressed Start. `prefers-reduced-motion` is respected
  globally via a CSS media query that collapses all animation/transition
  durations to ~0.

## Data model (all client-side, `localStorage` only)

No backend. Everything lives in the browser via a small `useLocalStorage`
hook, keyed under `chronova.<name>.v1` (see `STORAGE_KEYS`). If you change
a stored shape, bump the version suffix (`v2`) rather than mutating `v1` in
place, so existing users' stored data doesn't get misread — there's no
migration logic today.

- **`events`** — `{ id, title, date, endDate, allDay, startTime, endTime,
  category, location, notes, reminder }`. `date`/`endDate` are `YYYY-MM-DD`
  strings (see `toKey`/`fromKey`); `startTime`/`endTime` are `HH:MM` 24h
  strings or `null` when `allDay`. `reminder` is a string enum matching
  `REMINDER_OPTIONS` values (`""`, `"0"`, `"5"`, `"15"`, `"30"`, `"60"`,
  `"1440"`), not a number — the empty string means "no reminder" and is
  checked explicitly (`ev.reminder === ""`), don't rely on falsiness alone
  since `"0"` (a real reminder time) is a non-empty truthy string.
- **`goals`** — `{ id, title, target, category, progress, createdAt }`,
  `progress` is 0–100.
- **`tasks`** — `{ id, title, done, createdAt }`.
- **`notes`** — `{ id, text, createdAt }` (Business tab).
- **`reminded`** — array of fired-reminder keys (`eventId:targetTimestamp`)
  so the reminder checker doesn't re-fire the same alert; trimmed to the
  last 200.
- **`weather`** — cached `{ place, temp, code, high, low, precip,
  fetchedAt }`, reused for 45 minutes before refetching.

Seed data (`buildSeedEvents`/`buildSeedGoals`/`buildSeedTasks`/
`buildSeedNotes`) generates realistic-looking demo content anchored to
"today" at first load, so the app never looks empty for a new visitor —
this is deliberate (it's a public showcase page), not test fixtures to
delete.

## Live external data — real, not simulated

- **Weather**: browser Geolocation API → `api.open-meteo.com` (free, no
  API key) for current temp/forecast, plus
  `api.bigdatacloud.net/data/reverse-geocode-client` (free, no key) for the
  place-name label. Both calls are wrapped so a denied permission or
  network failure lands in a friendly "Couldn't load weather right now /
  Try again" state (`WeatherCard`'s `error` status) — it never shows fake
  numbers. Note for testing: this sandbox's network egress policy blocks
  both hosts (same restriction that blocks `unpkg.com`), so weather will
  always show the error state when tested from a Claude Code sandbox
  session — that's an artifact of the test environment, not a bug. It
  works from a normal browser on a normal network.
- **Insight brief, focus window, week stats**: 100% local computation over
  the user's own `events`/`goals`/`tasks` (`computeInsight`,
  `findFocusWindow`, the `weekStats` memo in `App`). No LLM call, no
  network request, no invented text — every number/sentence traces back to
  real data in `localStorage`. Keep it that way: don't wire this to a
  model-generated string, and don't hardcode example insight text.

## Deliberately not built (don't fake these)

The native Chronova app (screenshots the human shared, not in any
reachable repo) has a few features that were **intentionally left out**
here rather than faked:
- **Health metrics** (steps, sleep, heart rate, "Life Score") — need
  HealthKit/device sensors a website cannot read. Do not invent random or
  hardcoded numbers for these.
- **Real conversational AI / chat** — "Ask Chronova" in the native app
  implies an LLM backend. This app has no backend and no API key
  infrastructure. The `Insights` tab's search box is real local keyword
  search over events (honest), not a chat interface — don't relabel it as
  AI chat or wire it to a model without the human explicitly asking for
  that (it'd need a backend, a key, and a cost model that don't exist
  today).
- **App Store billing / "Chronova Pro"** — meaningless for a website; not
  present at all.

If asked to "add the AI chat" or "add health tracking," that's a scope
question for the human, not something to stub with fake data — this
project has an explicit house rule (established during earlier sessions)
of skipping a feature rather than simulating it dishonestly.

## App structure map

Reading order in `index.html`'s script block (top to bottom):

1. **Constants** — `STORAGE_KEYS`, `CATEGORIES`/`CATEGORY_MAP`,
   `REMINDER_OPTIONS`, weekday/month name arrays, `HOURS`.
2. **Date utilities** — `pad2`, `toKey`/`fromKey` (Date ↔ `YYYY-MM-DD`),
   `addDays`/`addMonths`/`startOfWeek`/`startOfDay`, `getMonthMatrix`
   (6-or-fewer-week grid for month view), `getWeekDays`, time formatting
   (`timeToMinutes`, `minutesToTimeLabel`, `formatTimeLabel`, etc.),
   `relativeDateLabel`/`agendaHeaderLabel` ("Today"/"Tomorrow" logic).
3. **Domain logic** — `buildEventsByDayMap`, `computeUpcoming`,
   `findFocusWindow`, `computeInsight`, the four `buildSeed*` functions.
4. **`useLocalStorage`** hook.
5. **Weather** — `WEATHER_CODE_MAP`/`describeWeather` (WMO code → label +
   icon kind), `useWeather` hook (geolocation + fetch + 45-min cache).
6. **ICS export** — `escapeICS`, `icsDate`, `eventToVEVENT`, `buildICS`,
   `downloadText`.
7. **`layoutTimedEvents`** — the week/day time-grid overlap algorithm
   (clusters overlapping events, assigns side-by-side columns).
8. **Icons** — one function per icon (see "Iconography" above).
9. **`BrandMark`** — the app logo SVG (also duplicated inline, as a plain
   SVG string, in the gallery/tour artifacts — if the logo changes, it
   needs updating in both places, they're not shared).
10. **Shared small components** — `MiniMonth`, `FiltersSheet`.
11. **View components** — `MonthView`, `TimeGridView` (shared by Week and
    Day — same component, `days` prop is length-1 for Day), `AgendaView`.
12. **Modals/sheets** — `EventModal`, `GoalModal`, `BreathingModal`
    (+ `BREATH_PATTERNS`), `ConfirmDialog` (generic, reused for both event
    and goal deletion), `ToastStack`, `FAB`.
13. **Chrome** — `Header` (tab-aware: shows the calendar period-nav row
    only when `tab === "calendar"` and search isn't open), `ViewTabs`
    (Month/Week/Day/Agenda, calendar-only), `BottomTabBar` (the 5 primary
    tabs).
14. **Screens** — `WeatherCard`, `HomeScreen`, `InsightsScreen`,
    `GoalsScreen`, `BusinessScreen`.
15. **`App`** — all state, all handlers, the render tree. This is the
    biggest function in the file; if you're looking for "where does X
    happen," it's almost always here.

### Navigation model

Two independent levels of navigation, don't conflate them:
- **`tab`** (`home` | `calendar` | `insights` | `goals` | `business`) —
  the 5 `BottomTabBar` destinations.
- **`view`** (`month` | `week` | `day` | `agenda`) — sub-navigation that
  only matters/renders when `tab === "calendar"`.

The header's search icon and the filters-sheet date picker are
cross-tab: tapping search from any tab calls `openSearchFromAnywhere()`,
which switches to `tab="calendar"` + `view="agenda"` before opening the
search field, because search results only make sense rendered as an
agenda list. Picking a date in `FiltersSheet` similarly force-switches to
the Calendar tab (`handlePickDate`). If you add a new cross-tab action,
follow this pattern rather than trying to render calendar content from
another tab's screen component.

`selectedDayKey` is the single source of truth for "which day is the FAB
targeting / which day's agenda shows under the Month grid" — it's
independent from `anchor` (which page/period is currently displayed).
`selectDay()` updates both together only when the picked date falls
outside the currently-displayed month/week.

### Keyboard shortcuts (desktop convenience, not documented in-app)

`t` today · `n` new event · `←`/`→` prev/next period · `/` open search ·
`1`–`4` switch calendar view · `Escape` closes whatever's open (modal >
sheet > search, in that priority order — see the next section for why
that ordering matters).

**Gotcha already fixed once, don't reintroduce it**: the `Escape` handling
must be checked *before* the "is the user typing in an input" check, not
after. `EventModal`/`GoalModal` auto-focus their title `<input>` on open,
so if the input-focus check runs first, `Escape` just blurs the input
(defocuses it) instead of closing the modal, and the user has to press it
twice. The current `onKeyDown` in `App` checks `e.key === "Escape"` first,
then decides what to close based on what's open, and only falls through to
blur-and-return if nothing was open. Keep that order if you touch this
handler.

## Testing this app

There's no test suite (no Jest/Playwright config committed) — verification
so far has been manual: Playwright driven against a locally-vendored copy
of the CDN dependencies (this sandbox's network policy blocks
`unpkg.com`/`fonts.googleapis.com`/etc. directly, so testing required
downloading React/Babel/Framer Motion/Tailwind's compiled output once and
serving them locally instead of proxying the real CDN — production still
uses the real CDN tags, only the *test* copy substituted local files).
If you're an agent in a different sandbox with open network access, you
may be able to just serve `index.html` directly and test against the real
CDN links — try that first before building a local-vendor workaround.

Things worth re-checking after any structural change:
- Zero console errors/warnings on load (aside from the expected "in-browser
  Babel transformer" notice, which is inherent to this no-build setup).
- All 5 tabs, all 4 calendar views, create/edit/delete for events and
  goals, add/toggle tasks, add/delete notes, the breathing coach
  start/stop, the filters sheet, search (including the cross-tab jump),
  and a single `Escape` press closing whatever's open.
- Both the real-mobile layout (viewport < 640px, edge-to-edge, no bezel)
  and the desktop phone-frame presentation (≥ 640px).

## Repo / deploy context

- Repo: `fortiz772/ortiz-venture-holdings-live`, branch
  `claude/chronova-calendar-app-0ewke8`.
- Deploys via Netlify from the repo root as a static site (see
  `netlify.toml`); this directory is served at `/chronova-ai/`.
- Sibling products in this repo for reference/pattern-matching:
  `stockpilot-ai/` (a much smaller, real shipped native app's legal/support
  pages — not a UI pattern reference, just shows the per-product
  subdirectory convention). The root `index.html` is the actual UI/style
  reference — that's where the liquid-glass/Barlow/Instrument Serif/
  sky-cyan-emerald language originates.
- Nothing in `chronova-ai/` is linked from the parent site's homepage
  showcase yet — that was a deliberate scope decision (not wanting to
  rewrite the homeowner's curated marketing copy without being asked), not
  an oversight. Ask before adding it there.
