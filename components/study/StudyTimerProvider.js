"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { callApi } from "@/lib/callApi";

const TimerContext = createContext(null);

export function useStudyTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useStudyTimer must be used inside <StudyTimerProvider>");
  return ctx;
}

// 65 -> "1:05", 3725 -> "1:02:05"
export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

// the focus length (25/45/60) is only kept in this browser. 0 = stopwatch
const storeKey = (id) => `studyTimer:${id}`;

function readFocus(id) {
  try {
    return Number(window.localStorage.getItem(storeKey(id))) || 0;
  } catch {
    return 0;
  }
}

function saveFocus(id, minutes) {
  try {
    if (minutes > 0) window.localStorage.setItem(storeKey(id), String(minutes));
    else window.localStorage.removeItem(storeKey(id));
  } catch {
    // storage blocked: the timer still works, just as a stopwatch after a refresh
  }
}

export default function StudyTimerProvider({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(null); // { id, startedAt, taskId, title } or null
  const [focusMin, setFocusMin] = useState(0); // 0 = stopwatch
  const [now, setNow] = useState(() => Date.now());
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const offset = useRef(0); // server clock minus this browser's clock (ms)

  // remember how far this browser's clock is from the server's
  function syncClock(a) {
    if (a?.serverNow) offset.current = new Date(a.serverNow).getTime() - Date.now();
  }

  // load a timer that is already running (refresh, new tab, another page)
  useEffect(() => {
    let cancelled = false;
    callApi("/api/study-sessions/active", "GET").then(({ ok, data }) => {
      if (cancelled) return;
      if (ok && data.active) {
        syncClock(data.active);
        setActive(data.active);
        setFocusMin(readFocus(data.active.id));
      }
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // tick every second while a timer runs
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    const onVisible = () => setNow(Date.now()); // background tabs slow timers down, so catch up
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [active]);

  // hide the "Saved 25 min" message after a few seconds
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 6000);
    return () => clearTimeout(t);
  }, [notice]);

  const start = useCallback(async ({ taskId = "", subject = "", focus = 0 } = {}) => {
    setBusy(true);
    const { ok, data } = await callApi("/api/study-sessions/start", "POST", { taskId, subject });
    setBusy(false);

    // 201 = started. 409 = one was already running, so show that one
    if (data?.active) {
      syncClock(data.active);
      setActive(data.active);
      if (ok) {
        saveFocus(data.active.id, focus);
        setFocusMin(focus);
      } else {
        setFocusMin(readFocus(data.active.id));
      }
      setNow(Date.now());
    }
    return ok ? { ok: true } : { ok: false, message: data?.message || "Could not start the timer." };
  }, []);

  const stop = useCallback(async () => {
    if (!active) return;
    setBusy(true);
    const { ok, data } = await callApi(`/api/study-sessions/${active.id}/stop`, "POST");
    setBusy(false);

    if (!ok) {
      setNotice(data?.message || "Could not stop the timer.");
      return;
    }
    saveFocus(active.id, 0);
    setActive(null);
    setFocusMin(0);
    setNotice(data.discarded ? "Under a minute, so nothing was saved." : `Saved ${data.minutes} min of study time.`);
    router.refresh(); // updates "Hours logged" and the calendar
  }, [active, router]);

  const discard = useCallback(async () => {
    if (!active) return;
    if (!window.confirm("Discard this session? Nothing will be saved.")) return;
    setBusy(true);
    const { ok, data } = await callApi(`/api/study-sessions/${active.id}`, "DELETE");
    setBusy(false);

    if (!ok) {
      setNotice(data?.message || "Could not discard the timer.");
      return;
    }
    saveFocus(active.id, 0);
    setActive(null);
    setFocusMin(0);
    setNotice("Timer discarded.");
  }, [active]);

  // focus time is up but you want to continue: switch to a stopwatch
  const keepGoing = useCallback(() => {
    if (!active) return;
    saveFocus(active.id, 0);
    setFocusMin(0);
  }, [active]);

  const value = useMemo(() => {
    const startMs = active ? new Date(active.startedAt).getTime() : 0;
    const elapsedSec = active ? Math.max(0, Math.floor((now + offset.current - startMs) / 1000)) : 0;
    const remainingSec = active && focusMin > 0 ? focusMin * 60 - elapsedSec : null;
    const timeUp = remainingSec !== null && remainingSec <= 0;
    const display = !active ? "" : remainingSec !== null ? formatClock(remainingSec) : formatClock(elapsedSec);

    return {
      ready,
      active,
      busy,
      notice,
      focusMin,
      elapsedSec,
      remainingSec,
      timeUp,
      display,
      start,
      stop,
      discard,
      keepGoing,
    };
  }, [ready, active, busy, notice, focusMin, now, start, stop, discard, keepGoing]);

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}