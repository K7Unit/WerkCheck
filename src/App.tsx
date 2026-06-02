import { useEffect, useState } from 'react';
import type { Inspection } from './types/inspection';
import { createEmptyInspection } from './types/inspection';
import StepWizard from './components/StepWizard';
import NewInspectionScreen from './screens/NewInspectionScreen';
import DamageMarkingScreen from './screens/DamageMarkingScreen';
import PhotoScreen from './screens/PhotoScreen';
import SignatureScreen from './screens/SignatureScreen';
import ReviewScreen from './screens/ReviewScreen';

const STEPS = ['Fahrzeug', 'Schäden', 'Fotos', 'Unterschrift', 'PDF'];
const STORAGE_KEY = 'werkcheck.inspection.v1';

function loadInspection(): Inspection {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...createEmptyInspection(), ...JSON.parse(raw) };
  } catch {
    /* ignore corrupt storage */
  }
  return createEmptyInspection();
}

export default function App() {
  const [step, setStep] = useState(0);
  const [inspection, setInspection] = useState<Inspection>(loadInspection);

  // persist to localStorage so an interrupted handover survives a refresh
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inspection));
    } catch {
      /* storage full / unavailable — keep working in-memory */
    }
  }, [inspection]);

  const update = (patch: Partial<Inspection>) =>
    setInspection((prev) => ({ ...prev, ...patch }));

  const reset = () => {
    if (!confirm('Aktuelle Inspektion verwerfen und neu starten?')) return;
    const fresh = createEmptyInspection();
    setInspection(fresh);
    setStep(0);
  };

  const canNext = (() => {
    if (step === 0) return inspection.licensePlate.trim().length > 0;
    if (step === 3) return inspection.confirmed && !!inspection.signature;
    return true;
  })();

  return (
    <div className="flex min-h-full flex-col bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <StepWizard steps={STEPS} current={step} onStep={setStep} />

      <main className="mx-auto w-full max-w-md flex-1 pb-28">
        {step === 0 && <NewInspectionScreen inspection={inspection} update={update} />}
        {step === 1 && <DamageMarkingScreen inspection={inspection} update={update} />}
        {step === 2 && <PhotoScreen inspection={inspection} update={update} />}
        {step === 3 && <SignatureScreen inspection={inspection} update={update} />}
        {step === 4 && <ReviewScreen inspection={inspection} onReset={reset} />}
      </main>

      {/* sticky bottom navigation */}
      {step < STEPS.length - 1 && (
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/90 backdrop-blur-lg dark:border-slate-700 dark:bg-slate-900/90">
          <div className="mx-auto flex w-full max-w-md gap-3 p-3">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="btn-ghost flex-1"
            >
              Zurück
            </button>
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              disabled={!canNext}
              className="btn-primary flex-[2]"
            >
              {step === 0 && !inspection.licensePlate.trim()
                ? 'Kennzeichen eingeben'
                : 'Weiter'}
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
