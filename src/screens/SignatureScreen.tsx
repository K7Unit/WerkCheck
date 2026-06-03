import type { Inspection } from '../types/inspection';
import SignatureCanvas from '../components/SignatureCanvas';

interface Props {
  inspection: Inspection;
  update: (patch: Partial<Inspection>) => void;
}

export default function SignatureScreen({ inspection, update }: Props) {
  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">Unterschrift</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Bitte unterschreiben Sie zur Bestätigung des dokumentierten Fahrzeugzustands.
      </p>

      <div className="card">
        <SignatureCanvas
          value={inspection.signature}
          onChange={(sig) => update({ signature: sig })}
        />
      </div>

      <label className="card flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={inspection.confirmed}
          onChange={(e) => update({ confirmed: e.target.checked })}
          className="mt-0.5 h-6 w-6 shrink-0 accent-brand"
        />
        <span className="text-sm text-slate-700 dark:text-slate-200">
          Ich bestätige den dokumentierten Fahrzeugzustand.
        </span>
      </label>

      <div className="text-xs text-slate-400">
        Kunde: <b>{inspection.customerName || '–'}</b> · Kennzeichen:{' '}
        <b>{inspection.licensePlate || '–'}</b>
      </div>
    </div>
  );
}
