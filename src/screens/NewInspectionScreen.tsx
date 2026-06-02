import { useRef } from 'react';
import type { Inspection, VehicleType, Workshop } from '../types/inspection';
import { VEHICLE_TYPES } from '../types/inspection';
import VehicleOutline from '../components/VehicleOutline';

interface Props {
  inspection: Inspection;
  update: (patch: Partial<Inspection>) => void;
  workshop: Workshop;
  updateWorkshop: (patch: Partial<Workshop>) => void;
}

/** Downscale a logo to a small square data URL. */
function readLogo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = Math.min(256, Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        const scale = size / Math.max(img.width, img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function fuelLabel(level: number): string {
  if (level <= 5) return 'leer';
  if (level >= 95) return 'voll';
  return `${Math.round(level / 12.5)}/8`;
}

export default function NewInspectionScreen({
  inspection,
  update,
  workshop,
  updateWorkshop,
}: Props) {
  const logoInput = useRef<HTMLInputElement>(null);

  // value for <input type="datetime-local"> (strip seconds + timezone)
  const dtLocal = (() => {
    const d = new Date(inspection.dateTime);
    const off = d.getTimezoneOffset();
    return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
  })();

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">Neue Inspektion</h1>

      {/* Workshop branding — persisted separately, reused across inspections */}
      <div className="card space-y-3">
        <label className="label">Werkstatt</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => logoInput.current?.click()}
            className="tap flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-300 bg-slate-50 text-slate-400 dark:border-slate-600 dark:bg-slate-700"
            aria-label="Logo hochladen"
          >
            {workshop.logo ? (
              <img src={workshop.logo} alt="Logo" className="h-full w-full object-contain" />
            ) : (
              <span className="text-xs">Logo</span>
            )}
          </button>
          <input
            className="field flex-1"
            placeholder="Werkstattname"
            value={workshop.name}
            onChange={(e) => updateWorkshop({ name: e.target.value })}
          />
          {workshop.logo && (
            <button
              type="button"
              onClick={() => updateWorkshop({ logo: null })}
              className="tap text-xs text-slate-400 underline"
            >
              entfernen
            </button>
          )}
        </div>
        <input
          ref={logoInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) updateWorkshop({ logo: await readLogo(file) });
            e.target.value = '';
          }}
        />
      </div>

      <div className="card space-y-4">
        <div>
          <label className="label">Kennzeichen</label>
          <input
            className="field uppercase tracking-wider"
            placeholder="z. B. M-AB 1234"
            value={inspection.licensePlate}
            onChange={(e) => update({ licensePlate: e.target.value.toUpperCase() })}
          />
        </div>

        <div>
          <label className="label">Kundenname</label>
          <input
            className="field"
            placeholder="Vor- und Nachname"
            value={inspection.customerName}
            onChange={(e) => update({ customerName: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Mechaniker</label>
          <input
            className="field"
            placeholder="Ihr Name"
            value={inspection.mechanicName}
            onChange={(e) => update({ mechanicName: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Datum &amp; Uhrzeit</label>
          <input
            type="datetime-local"
            className="field"
            value={dtLocal}
            onChange={(e) =>
              update({ dateTime: new Date(e.target.value).toISOString() })
            }
          />
        </div>

        <div>
          <label className="label">Kilometerstand</label>
          <input
            type="number"
            inputMode="numeric"
            className="field"
            placeholder="km"
            value={inspection.mileage}
            onChange={(e) => update({ mileage: e.target.value })}
          />
        </div>

        <div>
          <label className="label">
            Tankfüllung: {inspection.fuelLevel}% ({fuelLabel(inspection.fuelLevel)})
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={inspection.fuelLevel}
            onChange={(e) => update({ fuelLevel: Number(e.target.value) })}
            className="h-3 w-full cursor-pointer appearance-none rounded-full bg-gradient-to-r from-red-400 via-amber-400 to-green-500 accent-brand"
          />
          <div className="mt-1 flex justify-between text-xs text-slate-400">
            <span>leer</span>
            <span>½</span>
            <span>voll</span>
          </div>
        </div>
      </div>

      <div className="card space-y-3">
        <label className="label">Fahrzeugtyp</label>
        <div className="grid grid-cols-4 gap-2">
          {VEHICLE_TYPES.map((t) => {
            const active = inspection.vehicleType === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => update({ vehicleType: t as VehicleType })}
                className={`tap flex min-h-touch flex-col items-center justify-center gap-1 rounded-2xl border px-1 py-2 text-xs font-semibold ${
                  active
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-300'
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* live preview of the selected outline */}
        <div className="mx-auto h-56 w-40">
          <VehicleOutline vehicleType={inspection.vehicleType} readOnly />
        </div>
      </div>
    </div>
  );
}
