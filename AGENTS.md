# AGENTS.md — WerkCheck

Guidance for AI coding agents (OpenAI Codex, etc.) working in this repository.
Read this first; it captures the commands, architecture, and conventions you
need to be productive without breaking existing behaviour.

## What this is

**WerkCheck** is a mobile-first, offline-capable **PWA** for automotive
workshops: digital vehicle-handover documentation. A mechanic records vehicle
data, marks damages on an interactive 2D vehicle outline (arrival & departure),
attaches photos, collects a customer signature, and exports a one-page **PDF**
report shared via the iOS share sheet.

- **No backend, no auth, no database.** All state lives in-memory + `localStorage`.
- **German UI throughout.** All user-facing strings are German. Keep them German.
- Target: **Safari on iOS 16+**, touch-only.

## Tech stack

- React 18 + TypeScript (strict) — built with **Vite 5**
- Tailwind CSS 3 (mobile-first, dark mode via `prefers-color-scheme`)
- `jspdf` + `html2canvas` for client-side PDF (lazy-loaded)
- `vite-plugin-pwa` (Workbox) for the service worker + web app manifest

## Commands

```bash
npm ci            # install exact deps (preferred in CI/agent sandboxes)
npm run dev       # Vite dev server (NOTE: service worker is NOT active here)
npm run build     # tsc -b + vite build — MUST stay green after every change
npm run lint      # type-check only (tsc --noEmit); there is no ESLint config
npm run preview   # serve the production build (use this to test the PWA/SW)
```

There is **no test suite**. "Verification" = `npm run build` passes cleanly,
and for behavioural changes, a manual check via `npm run build && npm run
preview` (ideally in iOS Safari or responsive mode). Always run `npm run build`
before committing.

Requires **Node 20+** (see `.nvmrc` / `package.json#engines`).

## Project structure

```
src/
  App.tsx                 wizard state machine + localStorage persistence
  main.tsx                React entry
  index.css               Tailwind + reusable @layer component classes
  vite-env.d.ts           Vite + vite-plugin-pwa type references
  types/
    inspection.ts         domain model + factory + enums/constants
  components/
    StepWizard.tsx        top progress bar + 5-step nav + "Neue Prüfung"
    VehicleOutline.tsx    parametric top-down SVG outline (by vehicle type)
    DamageMarker.tsx      numbered marker rendered inside the SVG
    SignatureCanvas.tsx   hi-dpi touch/stylus signature pad
    PhotoUpload.tsx       capture/upload + client-side downscale + lightbox
    PwaPrompt.tsx         SW offline-ready / update toasts
  screens/
    NewInspectionScreen.tsx   step 1: vehicle + customer + workshop branding
    DamageMarkingScreen.tsx   step 2: interactive damage map + editor
    PhotoScreen.tsx           step 3: photos per damage marker
    SignatureScreen.tsx       step 4: signature + confirmation checkbox
    ReviewScreen.tsx          step 5: summary + PDF export
  utils/
    pdfExport.ts          html2canvas capture + jsPDF layout + Web Share
scripts/
  generate-icons.mjs      one-off PWA icon generator (needs sharp ad-hoc)
public/                   committed PWA icons + favicon
.github/workflows/deploy.yml  CI build-check + GitHub Pages deploy on main
```

## Architecture & key decisions

- **Wizard state** lives entirely in `App.tsx` as a single `Inspection` object
  (`useState`), mutated via an `update(patch)` helper. Steps are an index
  (0–4). There is no router.
- **Persistence:** two separate `localStorage` keys —
  `werkcheck.inspection.v1` (the current inspection) and
  `werkcheck.workshop.v1` (workshop name + logo). Workshop branding is kept
  separate on purpose so it **survives "Neue Prüfung"** (reset).
- **Damage markers use fractional coordinates** `(x, y)` in `0..1` relative to
  the SVG `viewBox` (300×640), so they stay anchored when the SVG scales or is
  re-rendered at PDF time. See `VehicleOutline.tsx` (`OUTLINE_W/OUTLINE_H`) and
  `DamageMarker.tsx`. Do not switch markers to pixel coordinates.
- **Two damage phases:** `Ankunft` (arrival) and `Abfahrt` (departure), each an
  independent marker list; the UI swipes between them.
- **PDF is lazy-loaded:** `jspdf` and `html2canvas` are `await import()`-ed
  inside `utils/pdfExport.ts` so they stay out of the initial bundle (~172 kB
  vs ~732 kB). `generatePdf` is therefore `async`. Keep it that way.
- **PDF layout** is drawn manually with jsPDF primitives (not an HTML export).
  The two damage maps are captured from live DOM nodes with html2canvas at
  `scale: 2`. Empty phases render a "Keine Schäden dokumentiert" label instead
  of a bare outline image.
- **Web Share:** `sharePdf` returns `'shared' | 'downloaded' | 'cancelled'` and
  falls back to a download when `navigator.share` with files is unavailable
  (e.g. non-HTTPS / desktop). The success toast is suppressed on `'cancelled'`.
- **PWA:** Workbox precaches the full app shell **including** the lazy PDF
  chunks, so PDF export works offline after the first visit. Updates use a
  **prompt** strategy (`PwaPrompt.tsx`) so a new version never reloads during an
  in-progress inspection.

## Conventions

- **German for all UI text**, including validation messages, toasts, buttons.
- **Styling:** prefer the reusable component classes defined in `index.css`
  (`btn-primary`, `btn-ghost`, `field`, `label`, `card`, `tap`) over ad-hoc
  utility soup. `tap` provides the CSS press-feedback ("haptic-style").
- **Touch/pointer only.** No hover-dependent UI. Keep tap targets ≥ 44px
  (`min-h-touch` / `min-w-touch`). iOS needs non-passive `touchmove`
  `preventDefault` on drawing surfaces (see `SignatureCanvas.tsx`).
- **Dark mode** must keep working (`dark:` variants, `prefers-color-scheme`).
- **TypeScript strict** — no `any` escapes, keep `npm run lint` clean.
- **iOS safe areas:** `safe-top` / `safe-bottom` classes add
  `env(safe-area-inset-*)`; they are additive on the fixed nav/header.

## Gotchas (read before debugging)

- The **service worker only runs in a production build over HTTPS or
  `localhost`** — never under `npm run dev`. Test PWA/offline with
  `npm run build && npm run preview`.
- **Web Share with a file needs HTTPS + a real iOS device.** Over plain HTTP or
  on desktop it correctly falls back to a PDF download.
- `beforeunload` unsaved-changes prompt is **best-effort on iOS Safari** (Apple
  often suppresses it); the `localStorage` autosave is the real safety net.
- **Icons in `public/` are committed static assets.** `sharp` is intentionally
  NOT a dependency — regenerate via `npm i -D sharp && node
  scripts/generate-icons.mjs && npm un sharp` (see the script header).
- **`base: './'`** (relative) in `vite.config.ts` is deliberate so the build
  works at the GitHub Pages subpath `/WerkCheck/`. Don't change it to an
  absolute base without updating the manifest `start_url`/`scope`.

## Deployment

`.github/workflows/deploy.yml` build-checks every PR and deploys to **GitHub
Pages** on pushes to `main`. One-time repo setting required: **Settings → Pages
→ Source: "GitHub Actions"**. Live URL: `https://<owner>.github.io/WerkCheck/`.

## Do / Don't

- ✅ Keep changes small and scoped; run `npm run build` before committing.
- ✅ Keep all new UI strings German.
- ✅ Preserve fractional marker coords, lazy PDF loading, and the two
  `localStorage` keys.
- ❌ Don't add a backend, auth, router, or a test framework unless asked.
- ❌ Don't introduce hover-only interactions or shrink tap targets below 44px.
- ❌ Don't commit `node_modules`, `dist`, or `*.tsbuildinfo` (already ignored).
