import { useEffect, useRef, useState } from 'react';
import type { DamagePhase, Inspection, Workshop } from '../types/inspection';
import { SEVERITY_COLORS } from '../types/inspection';
import VehicleOutline from '../components/VehicleOutline';
import DamageMarker from '../components/DamageMarker';
import { captureNode, generatePdf, sharePdf } from '../utils/pdfExport';
import type { MapImages } from '../utils/pdfExport';

interface Props {
  inspection: Inspection;
  workshop: Workshop;
  onReset: () => void;
}

const PHASES: DamagePhase[] = ['Ankunft', 'Abfahrt'];

export default function ReviewScreen({ inspection, workshop, onReset }: Props) {
  const ankunftRef = useRef<HTMLDivElement>(null);
  const abfahrtRef = useRef<HTMLDivElement>(null);
  // null = idle; otherwise the label shown on the (disabled) export button
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // auto-dismiss the success toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const totalDamages = PHASES.reduce(
    (n, p) => n + inspection.damages[p].length,
    0
  );

  // required before a report may be generated
  const missing: string[] = [];
  if (!inspection.licensePlate.trim()) missing.push('Kennzeichen');
  if (!inspection.customerName.trim()) missing.push('Kundenname');
  if (!inspection.signature) missing.push('Unterschrift');

  const handleExport = async () => {
    if (missing.length) return;
    // the PDF libraries (jsPDF + html2canvas) live in a lazy chunk that is
    // fetched on first use — surface that wait to the user
    setStatus('PDF wird vorbereitet…');
    setError(null);
    try {
      const maps: MapImages = {
        Ankunft: ankunftRef.current ? await captureNode(ankunftRef.current) : null,
        Abfahrt: abfahrtRef.current ? await captureNode(abfahrtRef.current) : null,
      };
      setStatus('Erstelle PDF…');
      const blob = await generatePdf(inspection, maps, workshop);
      const plate = (inspection.licensePlate || 'fahrzeug').replace(/\s+/g, '_');
      const result = await sharePdf(blob, `WerkCheck_${plate}.pdf`);
      if (result !== 'cancelled') setToast('Bericht erstellt');
    } catch (e) {
      setError('PDF konnte nicht erstellt werden. Bitte erneut versuchen.');
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setStatus(null);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">Zusammenfassung</h1>

      {/* vehicle summary */}
      <div className="card space-y-1.5 text-sm">
        <Row label="Kennzeichen" value={inspection.licensePlate || '–'} />
        <Row label="Kunde" value={inspection.customerName || '–'} />
        <Row label="Fahrzeugtyp" value={inspection.vehicleType} />
        <Row
          label="Kilometerstand"
          value={inspection.mileage ? `${inspection.mileage} km` : '–'}
        />
        <Row label="Tankfüllung" value={`${inspection.fuelLevel}%`} />
        <Row label="Schäden gesamt" value={String(totalDamages)} />
        <Row
          label="Unterschrift"
          value={inspection.signature ? '✓ vorhanden' : '✗ fehlt'}
        />
        <Row
          label="Bestätigt"
          value={inspection.confirmed ? '✓ ja' : '✗ nein'}
        />
      </div>

      {/* on-screen damage map previews */}
      <div className="grid grid-cols-2 gap-3">
        {PHASES.map((phase, idx) => (
          <div key={phase} className="card">
            <div className="mb-2 text-center text-sm font-semibold text-slate-700 dark:text-slate-200">
              {phase} ({inspection.damages[phase].length})
            </div>
            <div
              ref={idx === 0 ? ankunftRef : abfahrtRef}
              className="mx-auto h-64 w-full bg-white"
            >
              <VehicleOutline vehicleType={inspection.vehicleType} readOnly>
                {inspection.damages[phase].map((m, i) => (
                  <DamageMarker key={m.id} marker={m} index={i + 1} />
                ))}
              </VehicleOutline>
            </div>
          </div>
        ))}
      </div>

      {/* damage list */}
      {totalDamages > 0 && (
        <div className="card space-y-3">
          {PHASES.map((phase) =>
            inspection.damages[phase].length ? (
              <div key={phase}>
                <div className="mb-1 text-xs font-bold uppercase tracking-wide text-brand">
                  {phase}
                </div>
                <ul className="space-y-1">
                  {inspection.damages[phase].map((m, i) => (
                    <li key={m.id} className="flex items-center gap-2 text-sm">
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{ background: SEVERITY_COLORS[m.severity] }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-slate-700 dark:text-slate-200">
                        {m.type} · {m.severity}
                        {m.note ? ` – ${m.note}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null
          )}
        </div>
      )}

      {missing.length > 0 && (
        <div className="rounded-2xl bg-amber-100 px-4 py-3 text-sm text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
          <p className="font-semibold">Vor dem Erstellen bitte ergänzen:</p>
          <ul className="mt-1 list-inside list-disc">
            {missing.map((m) => (
              <li key={m}>{m} fehlt</li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/40 dark:text-red-200">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleExport}
        disabled={!!status || missing.length > 0}
        className="btn-primary w-full"
      >
        {status ?? 'PDF Erstellen & Teilen'}
      </button>

      <button type="button" onClick={onReset} className="btn-ghost w-full">
        Neue Inspektion starten
      </button>

      {toast && (
        <div className="safe-bottom pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
          <div className="flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-xl dark:bg-white dark:text-slate-900">
            <span>✓</span>
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-semibold text-slate-900 dark:text-white">{value}</span>
    </div>
  );
}
