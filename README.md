# WerkCheck

Mobile-first iPhone web app for automotive workshops — digital vehicle handover
documentation. A mechanic photographs a car on arrival/departure, marks damages
on a 2D vehicle outline, the customer signs digitally, and the app produces a
shareable one-page PDF report.

No backend, no login. All state lives in-memory and in `localStorage`, so an
interrupted handover survives a page refresh. Designed for Safari on iOS 16+.

## Tech stack

- **React + TypeScript** (Vite)
- **Tailwind CSS** — mobile-first, touch-optimized, dark-mode via
  `prefers-color-scheme`
- **html2canvas + jsPDF** — client-side PDF generation
- **vite-plugin-pwa (Workbox)** — installable PWA, service-worker precaching
  for true offline launch
- **Web Share API** — shares the PDF through the native iOS share sheet

## Features

A 5-step wizard with a progress bar:

1. **Fahrzeug** — license plate, customer & mechanic name, auto-filled
   date/time, mileage, fuel-level slider, and a vehicle-type selector
   (PKW / Kombi / SUV / Transporter) that re-shapes the 2D outline.
2. **Schäden** — interactive top-down SVG outline. Tap to drop a numbered
   damage marker; each opens an editor for type (Delle / Kratzer / Riss /
   Glasschaden / Fehlend), severity (leicht / mittel / stark) and a note.
   Markers are editable/deletable. Swipe between **Ankunft** and **Abfahrt**
   maps.
3. **Fotos** — capture or upload photos per damage marker; tap a thumbnail to
   enlarge. Images are downscaled client-side.
4. **Unterschrift** — full-width touch/stylus signature canvas, clear button,
   and a confirmation checkbox.
5. **PDF** — one-page report (workshop header, vehicle table, both damage maps,
   damage list, up to 6 photos, signature, timestamp & mechanic) shared via
   `navigator.share`, with a download fallback.

## Project structure

```
src/
  components/
    StepWizard.tsx       progress bar + step navigation
    VehicleOutline.tsx   parametric SVG outline (by vehicle type)
    DamageMarker.tsx     numbered marker rendered inside the SVG
    SignatureCanvas.tsx  hi-dpi touch signature pad
    PhotoUpload.tsx      capture/upload + downscale + lightbox
  screens/
    NewInspectionScreen.tsx
    DamageMarkingScreen.tsx
    PhotoScreen.tsx
    SignatureScreen.tsx
    ReviewScreen.tsx
  utils/
    pdfExport.ts         html2canvas capture + jsPDF layout + share
  types/
    inspection.ts        domain model
  App.tsx                wizard state + localStorage persistence
```

## Development

```bash
npm install
npm run dev      # start the Vite dev server
npm run build    # type-check + production build
npm run preview  # preview the production build
```

Open the dev URL on an iPhone (same network) or in Safari's responsive design
mode. The Web Share API requires HTTPS (or `localhost`) and a real device for
the native share sheet; elsewhere the PDF falls back to a download.

## PWA / offline

A Workbox service worker (via `vite-plugin-pwa`) precaches the full app shell —
including the lazily-loaded jsPDF/html2canvas chunks — so the app launches and
generates PDFs with no network after the first visit. A web app manifest makes
it installable to the iOS home screen ("Zum Home-Bildschirm").

- The service worker only runs in a production build over HTTPS (or
  `localhost`). Use `npm run build && npm run preview` to test it — it is not
  active under `npm run dev`.
- Updates use a prompt strategy: a German "Neue Version verfügbar" toast lets
  the user choose when to reload, so a new version never interrupts an
  in-progress inspection.

App icons live in `public/` and are committed static assets. To regenerate
them from the source mark, see `scripts/generate-icons.mjs` (needs `sharp`
installed ad-hoc — it is intentionally not a project dependency).
