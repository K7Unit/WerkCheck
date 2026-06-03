import type { DamagePhase, Inspection } from '../types/inspection';
import { SEVERITY_COLORS } from '../types/inspection';
import PhotoUpload from '../components/PhotoUpload';

interface Props {
  inspection: Inspection;
  update: (patch: Partial<Inspection>) => void;
}

const PHASES: DamagePhase[] = ['Ankunft', 'Abfahrt'];

export default function PhotoScreen({ inspection, update }: Props) {
  const setPhotos = (phase: DamagePhase, id: string, photos: string[]) =>
    update({
      damages: {
        ...inspection.damages,
        [phase]: inspection.damages[phase].map((m) =>
          m.id === id ? { ...m, photos } : m
        ),
      },
    });

  const hasMarkers = PHASES.some((p) => inspection.damages[p].length > 0);

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">Fotos</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Füge je markiertem Schaden Fotos hinzu. Tippe ein Foto an, um es zu vergrößern.
      </p>

      {!hasMarkers && (
        <div className="card text-center text-sm text-slate-500 dark:text-slate-400">
          Noch keine Schäden markiert. Gehe zurück zu <b>Schäden</b>, um Marker zu setzen.
        </div>
      )}

      {PHASES.map((phase) => {
        const markers = inspection.damages[phase];
        if (!markers.length) return null;
        return (
          <div key={phase} className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">
              {phase}
            </h2>
            {markers.map((m, i) => (
              <div key={m.id} className="card space-y-3">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: SEVERITY_COLORS[m.severity] }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {m.type} · {m.severity}
                  </span>
                  <span className="ml-auto text-xs text-slate-400">
                    {m.photos.length} Foto(s)
                  </span>
                </div>
                <PhotoUpload
                  photos={m.photos}
                  onChange={(photos) => setPhotos(phase, m.id, photos)}
                />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
