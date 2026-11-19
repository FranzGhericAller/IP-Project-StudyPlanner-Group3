"use client";

import { useStudyTimer } from "@/components/study/StudyTimerProvider";

// floating timer. shows on every page while a timer runs, and a short message after you stop
export default function StudyTimerBar() {
  const t = useStudyTimer();
  if (!t.active && !t.notice) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-30 flex justify-center px-4 md:bottom-20">
      {t.active ? (
        <div
          role="timer"
          className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3 shadow-lg"
        >
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{t.active.title}</p>
            <p className="text-xs text-inksoft">
              {t.timeUp ? "Focus time is up!" : t.remainingSec !== null ? "left" : "elapsed"}
            </p>
          </div>

          <span className="font-mono text-lg tabular-nums">{t.display}</span>

          <div className="flex shrink-0 items-center gap-2">
            {t.timeUp && (
              <button
                type="button"
                onClick={t.keepGoing}
                className="rounded-md border border-neutral-300 dark:border-neutral-700 px-2.5 py-1.5 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                Keep going
              </button>
            )}
            <button
              type="button"
              onClick={t.stop}
              disabled={t.busy}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {t.timeUp ? "Stop & save" : "Stop"}
            </button>
            {!t.timeUp && (
              <button
                type="button"
                onClick={t.discard}
                disabled={t.busy}
                aria-label="Discard this session"
                title="Discard (nothing is saved)"
                className="text-inksoft hover:text-rose-600 dark:hover:text-rose-400"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          role="status"
          className="pointer-events-auto rounded-full bg-neutral-900 dark:bg-neutral-100 px-4 py-2 text-sm text-white dark:text-neutral-900 shadow-lg"
        >
          {t.notice}
        </div>
      )}
    </div>
  );
}