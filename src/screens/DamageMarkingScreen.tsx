import { useState } from 'react';
import type {
  DamageMarkerData,
  DamagePhase,
  DamageType,
  Inspection,
  Severity,
} from '../types/inspection';
import {
  DAMAGE_TYPES,
  SEVERITIES,
  SEVERITY_COLORS,
} from '../types/inspection';
import VehicleOutline from '../components/VehicleOutline';
import DamageMarker from '../components/DamageMarker';

interface Props {
  inspection: Inspection;
  update: (patch: Partial<Inspection>) => void;
}

const PHASES: DamagePhase[] = ['Ankunft', 'Abfahrt'];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function DamageMarkingScreen({ inspection, update }: Props) {
  const [phase, setPhase] = useState<DamagePhase>('Ankunft');
  const [editing, setEditing] = useState<string | null>(null);
  // swipe handling between the two tabs
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const markers = inspection.damages[phase];

  const setMarkers = (next: DamageMarkerData[]) =>
    update({ damages: { ...inspection.damages, [phase]: next } });

  const addMarker = (x: number, y: number) => {
    const marker: DamageMarkerData = {
      id: uid(),
      x,
      y,
      type: 'Kratzer',
      severity: 'leicht',
      note: '',
      photos: [],
    };
    setMarkers([...markers, marker]);
    setEditing(marker.id);
  };

  const updateMarker = (id: string, patch: Partial<DamageMarkerData>) =>
    setMarkers(markers.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const removeMarker = (id: string) => {
    setMarkers(markers.filter((m) => m.id !== id));
    setEditing(null);
  };

  const current = markers.find((m) => m.id === editing) ?? null;

  const onTouchEnd = (endX: number) => {
    if (touchStartX === null) return;
    const dx = endX - touchStartX;
    if (Math.abs(dx) > 60) {
      const idx = PHASES.indexOf(phase);
      const next = dx < 0 ? idx + 1 : idx - 1;
      if (next >= 0 && next < PHASES.length) {
        setPhase(PHASES[next]);
        setEditing(null);
      }
    }
    setTouchStartX(null);
  };

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">Schäden markieren</h1>

      {/* Ankunft / Abfahrt tabs */}
      <div className="flex rounded-2xl bg-slate-200 p-1 dark:bg-slate-700">
        {PHASES.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => {
              setPhase(p);
              setEditing(null);
            }}
            className={`tap flex-1 rounded-xl py-2.5 text-sm font-semibold ${
              phase === p
                ? 'bg-white text-brand shadow dark:bg-slate-900'
                : 'text-slate-500 dark:text-slate-300'
            }`}
          >
            {p}
            <span className="ml-1.5 rounded-full bg-brand/15 px-1.5 text-xs text-brand">
              {inspection.damages[p].length}
            </span>
          </button>
        ))}
      </div>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Tippe auf den Umriss, um einen Schaden zu markieren. Wische, um zwischen Ankunft und
        Abfahrt zu wechseln.
      </p>

      {/* the interactive map */}
      <div
        className="mx-auto h-[60vh] max-h-[560px] w-full max-w-xs touch-pan-y"
        onTouchStart={(e) => setTouchStartX(e.changedTouches[0].clientX)}
        onTouchEnd={(e) => onTouchEnd(e.changedTouches[0].clientX)}
      >
        <VehicleOutline vehicleType={inspection.vehicleType} onTap={addMarker}>
          {markers.map((m, i) => (
            <DamageMarker
              key={m.id}
              marker={m}
              index={i + 1}
              active={editing === m.id}
              onSelect={setEditing}
            />
          ))}
        </VehicleOutline>
      </div>

      {/* damage summary list */}
      {markers.length > 0 && (
        <div className="space-y-2">
          {markers.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setEditing(m.id)}
              className="tap flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-left dark:border-slate-700 dark:bg-slate-800"
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: SEVERITY_COLORS[m.severity] }}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                  {m.type} · {m.severity}
                </span>
                {m.note && (
                  <span className="block truncate text-xs text-slate-500">{m.note}</span>
                )}
              </span>
              <span className="text-slate-300">›</span>
            </button>
          ))}
        </div>
      )}

      {/* editor popover */}
      {current && (
        <MarkerEditor
          marker={current}
          onChange={(patch) => updateMarker(current.id, patch)}
          onDelete={() => removeMarker(current.id)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

interface EditorProps {
  marker: DamageMarkerData;
  onChange: (patch: Partial<DamageMarkerData>) => void;
  onDelete: () => void;
  onClose: () => void;
}

function MarkerEditor({ marker, onChange, onDelete, onClose }: EditorProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="safe-bottom w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-600" />
        <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">Schaden</h2>

        <label className="label">Schadensart</label>
        <div className="mb-4 grid grid-cols-3 gap-2">
          {DAMAGE_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onChange({ type: t as DamageType })}
              className={`tap min-h-touch rounded-xl border px-2 py-2 text-sm font-medium ${
                marker.type === t
                  ? 'border-brand bg-brand/10 text-brand'
                  : 'border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <label className="label">Schweregrad</label>
        <div className="mb-4 grid grid-cols-3 gap-2">
          {SEVERITIES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange({ severity: s as Severity })}
              className={`tap min-h-touch rounded-xl border px-2 py-2 text-sm font-medium capitalize ${
                marker.severity === s
                  ? 'border-transparent text-white'
                  : 'border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300'
              }`}
              style={
                marker.severity === s
                  ? { background: SEVERITY_COLORS[s] }
                  : undefined
              }
            >
              {s}
            </button>
          ))}
        </div>

        <label className="label">Notiz (optional)</label>
        <textarea
          className="field mb-4 resize-none"
          rows={2}
          placeholder="z. B. Stoßstange vorne links"
          value={marker.note}
          onChange={(e) => onChange({ note: e.target.value })}
        />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onDelete}
            className="tap min-h-touch flex-1 rounded-2xl border border-red-300 px-4 py-3 font-semibold text-red-600 dark:border-red-500/50"
          >
            Löschen
          </button>
          <button type="button" onClick={onClose} className="btn-primary flex-1">
            Fertig
          </button>
        </div>
      </div>
    </div>
  );
}
