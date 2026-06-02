interface Props {
  steps: string[];
  current: number; // 0-based
  onStep?: (index: number) => void;
}

/** Top progress bar + step labels for the 5-step wizard. */
export default function StepWizard({ steps, current, onStep }: Props) {
  const pct = ((current + 1) / steps.length) * 100;

  return (
    <div className="safe-top sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-lg dark:border-slate-700 dark:bg-slate-900/80">
      <div className="flex items-center gap-3 px-4 pb-1 pt-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white">
          W
        </div>
        <div className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
          WerkCheck
        </div>
        <div className="ml-auto text-sm font-medium text-slate-500 dark:text-slate-400">
          Schritt {current + 1}/{steps.length}
        </div>
      </div>

      {/* progress track */}
      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700">
        <div
          className="h-full bg-brand transition-all duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* step dots */}
      <div className="flex items-stretch justify-between px-2 py-2">
        {steps.map((label, i) => {
          const done = i < current;
          const isCurrent = i === current;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onStep?.(i)}
              className="tap flex flex-1 flex-col items-center gap-1"
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  isCurrent
                    ? 'bg-brand text-white'
                    : done
                      ? 'bg-brand/20 text-brand'
                      : 'bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
                }`}
              >
                {done ? '✓' : i + 1}
              </span>
              <span
                className={`text-[10px] leading-tight ${
                  isCurrent
                    ? 'font-semibold text-slate-900 dark:text-white'
                    : 'text-slate-400'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
