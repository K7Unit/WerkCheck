# WerkCheck — Projektübergabe / Handoff

Vollständiger Kontext für die Weiterarbeit in **ChatGPT / Codex**. Dieses
Dokument fasst zusammen, was gebaut wurde, warum, was bekannt ist und was als
Nächstes ansteht — damit kein Wissen aus der bisherigen Entwicklung verloren
geht. Technische Details für Agenten stehen in `AGENTS.md`, Nutzer-Doku im
`README.md`.

## 1. Was ist WerkCheck?

Mobile-first PWA (iPhone, Safari iOS 16+) zur **digitalen
Fahrzeug-Übergabedokumentation** in Kfz-Werkstätten. Ablauf als 5-Schritt-Assistent:

1. **Fahrzeug** — Kennzeichen, Kunde, Mechaniker, Datum/Uhrzeit (autom.),
   Kilometerstand, Tankfüllung (Slider), Fahrzeugtyp
   (PKW/Kombi/SUV/Transporter), Werkstatt-Branding (Name + Logo).
2. **Schäden** — interaktiver 2D-Fahrzeugumriss (SVG). Tippen setzt nummerierte
   Schadensmarker; Editor pro Marker (Art: Delle/Kratzer/Riss/Glasschaden/
   Fehlend, Schweregrad: leicht/mittel/stark, Notiz). Zwei getrennte Karten:
   **Ankunft** / **Abfahrt** (per Swipe).
3. **Fotos** — pro Schadensmarker Fotos aufnehmen/hochladen, Thumbnails,
   Lightbox.
4. **Unterschrift** — Touch/Stylus-Canvas, „Unterschrift löschen", Bestätigungs-
   Checkbox.
5. **PDF** — einseitiger Bericht (Werkstatt-Kopf, Fahrzeugtabelle, beide
   Schadenskarten, Schadensliste, bis 6 Fotos, Unterschrift, Zeitstempel/
   Mechaniker), geteilt über die native iOS-Freigabe (Web Share API), sonst
   Download-Fallback.

Kein Backend, kein Login, keine Datenbank — alles läuft lokal
(In-Memory + `localStorage`) und **offline**.

## 2. Tech-Stack

React 18 + TypeScript (strict), Vite 5, Tailwind CSS 3, `jspdf` +
`html2canvas` (lazy), `vite-plugin-pwa` (Workbox). Node 20+.

## 3. Entwicklungsverlauf (was in welcher Reihenfolge gemacht wurde)

**Phase 1 — Erstaufbau (PR #1, in `main` gemerged)**
Komplettes Scaffold + alle 5 Screens end-to-end; interaktiver parametrischer
SVG-Umriss zuerst (Kern-Differenzierer). Fraktionale Marker-Koordinaten,
localStorage-Persistenz, dunkler Modus, deutsche UI, 44px-Tap-Targets.

**Phase 2 — Härtung (5 Abschnitte, in `main` gemerged)**
1. **PDF lazy-load** — `jspdf`/`html2canvas` als dynamische Imports; Initial-
   Bundle 732 kB → 172 kB; „PDF wird vorbereitet…"-Status.
2. **Datensicherheit** — `beforeunload`-Warnung bei ungespeicherten Daten;
   „Neue Prüfung"-Button mit Bestätigung; Pflichtfeld-Validierung (Kennzeichen,
   Kundenname, Unterschrift) mit deutschen Inline-Fehlern vor PDF-Export.
3. **iOS Safari** — nicht-passiver `touchmove`-Listener auf dem Signatur-Canvas
   (verhindert Scroll/Zoom beim Unterschreiben); `capture="environment"`
   (Rückkamera); additive Safe-Area-Paddings.
4. **PDF-Qualität** — leere Phase zeigt „Keine Schäden dokumentiert" statt
   leerem Umriss; `scale: 2` (Retina); `splitTextToSize` für lange Notizen.
5. **Politur** — `sharePdf` liefert `shared|downloaded|cancelled`; Toast
   „Bericht erstellt" nur bei Erfolg; Werkstatt-Name + Logo editierbar,
   separat unter `werkcheck.workshop.v1` gespeichert (überlebt „Neue Prüfung"),
   im PDF-Kopf verwendet.

**Phase 3 — Installierbare Offline-PWA + CI/Deploy (PR #2, in `main` gemerged)**
- Workbox-Service-Worker: precached die gesamte App-Shell inkl. der lazy
  PDF-Chunks → App startet **und** exportiert PDFs offline nach dem ersten
  Besuch.
- Deutsches Web-App-Manifest → „Zum Home-Bildschirm" installierbar.
- `PwaPrompt`: Toasts „App ist jetzt offline verfügbar" und „Neue Version
  verfügbar / Aktualisieren" (Prompt-Strategie, kein Reload mitten in einer
  Prüfung).
- Marken-Icons (192/512/maskable/apple-touch) + SVG-Favicon.
- **GitHub Actions**: Build-Check bei jedem PR + Deploy auf GitHub Pages bei
  Push auf `main`.

**Phase 4 — Codex-Übergabe (dieser Branch)**
`AGENTS.md`, dieses `HANDOFF.md`, Node-Pinning. Reine Doku/Meta, kein
Verhaltens-Change am Code.

## 4. Aktueller Stand

- Alle Features implementiert; `npm run build` grün; `tsc --noEmit` sauber.
- `main` enthält den kompletten Stand (PR #1 + PR #2 gemerged).
- **iPhone-Gerätetest: „CLEAN"** gemeldet (keine offenen Bugs).

## 5. Offene Punkte / To-dos (einmalig, nicht Code)

- [ ] **GitHub Pages aktivieren**: Repo → Settings → Pages → Source
  „GitHub Actions". Erst danach ist der Deploy live und die Web-Share-Freigabe
  auf einem echten iPhone über HTTPS testbar. URL:
  `https://<owner>.github.io/WerkCheck/`.
- [ ] Nach Pages-Aktivierung ggf. den letzten `deploy.yml`-Lauf erneut starten
  („Re-run jobs") oder einfach den nächsten `main`-Merge abwarten.

## 6. Bekannte Grenzen (kein Bug — erwartetes Verhalten)

- **Service Worker** läuft nur im Production-Build über HTTPS/localhost, nicht
  unter `npm run dev`. Test: `npm run build && npm run preview`.
- **Web Share mit Datei** braucht HTTPS + echtes iOS-Gerät; sonst korrekter
  Download-Fallback.
- **`beforeunload`** ist auf iOS Safari „best-effort" (Apple unterdrückt den
  Dialog oft) — die localStorage-Autospeicherung ist das eigentliche Netz.

## 7. Ideen für die Weiterentwicklung (Backlog, unpriorisiert)

- Mehrere Inspektionen verwalten (Liste/Historie) statt nur einer aktiven.
- Export/Import der Daten (JSON) oder optionaler Cloud-Sync.
- Foto-Anhang auch im PDF pro Schaden zuordnen (aktuell max. 6 Thumbnails
  gesammelt).
- Signatur auch für den Mechaniker; Datenschutz-/DSGVO-Hinweistext.
- Weitere Fahrzeugtypen / genauere Umrisse; Zoom auf der Schadenskarte.
- Tests (Vitest + Testing Library) für die Kernlogik (`utils/pdfExport`,
  Reducer-artige Updates in `App.tsx`).

## 8. So arbeitest du in ChatGPT/Codex weiter

1. **Repo verbinden** (empfohlen): Codex auf das GitHub-Repo `K7Unit/WerkCheck`
   zeigen lassen — `main` ist vollständig und aktuell. Codex liest `AGENTS.md`
   automatisch.
2. **Oder das ZIP hochladen**: falls du ohne GitHub-Anbindung startest, das
   mitgelieferte `WerkCheck-source.zip` (nur getrackte Quelldateien, ohne
   `node_modules`/`dist`/`.git`) in ChatGPT hochladen.
3. **Erststart lokal:** `npm ci && npm run build` — muss grün sein. `npm run
   dev` zum Entwickeln, `npm run preview` zum Testen der PWA.
