import { useRef, useState } from 'react';
import type { DamagePhase, Inspection } from '../types/inspection';
import { SEVERITY_COLORS } from '../types/inspection';
import VehicleOutline from '../components/VehicleOutline';
import DamageMarker from '../components/DamageMarker';
import { captureNode, generatePdf, sharePdf } from '../utils/pdfExport';
import type { MapImages } from '../utils/pdfExport';

interface Props {
  inspection: Inspection;
  onReset: () => void;
}

const PHASES: DamagePhase[] = ['Ankunft', 'Abfahrt'];

export default function ReviewScreen({ inspection, onReset }: Props) {
  const ankunftRef = useRef<HTMLDivElement>(null);
  const abfahrtRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalDamages = PHASES.reduce(
    (n, p) => n + inspection.damages[p].length,
    0
  );

  const handleExport = async () => {
    setBusy(true);
    setError(null);
    try {
      const maps: MapImages = {
        Ankunft: ankunftRef.current ? await captureNode(ankunftRef.current) : null,
        Abfahrt: abfahrtRef.current ? await captureNode(abfahrtRef.current) : null,
      };
      const blob = generatePdf(inspection, maps);
      const plate = (inspection.licensePlate || 'fahrzeug').replace(/\s+/g, '_');
      await sharePdf(blob, `WerkCheck_${plate}.pdf`);
    } catch (e) {
      setError('PDF konnte nicht erstellt werden. Bitte erneut versuchen.');
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setBusy(false);
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

      {error && (
        <div className="rounded-2xl bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/40 dark:text-red-200">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleExport}
        disabled={busy}
        className="btn-primary w-full"
      >
        {busy ? 'Erstelle PDF…' : 'PDF Erstellen & Teilen'}
      </button>

      <button type="button" onClick={onReset} className="btn-ghost w-full">
        Neue Inspektion starten
      </button>
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
