import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Service-worker lifecycle UI. Shows a German toast when the app becomes
 * available offline, and a non-intrusive "update available" prompt so a new
 * version never reloads mid-inspection without the user's consent.
 */
export default function PwaPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!offlineReady && !needRefresh) return null;

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <div className="safe-bottom fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-4">
      <div className="flex w-full max-w-md items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-xl dark:bg-white dark:text-slate-900">
        <span className="flex-1">
          {needRefresh
            ? 'Neue Version verfügbar.'
            : 'App ist jetzt offline verfügbar.'}
        </span>
        {needRefresh && (
          <button
            type="button"
            onClick={() => updateServiceWorker(true)}
            className="tap rounded-xl bg-brand px-3 py-1.5 font-semibold text-white"
          >
            Aktualisieren
          </button>
        )}
        <button
          type="button"
          onClick={close}
          aria-label="Schließen"
          className="tap rounded-xl px-2 py-1.5 font-semibold opacity-70"
        >
          {needRefresh ? 'Später' : 'OK'}
        </button>
      </div>
    </div>
  );
}
