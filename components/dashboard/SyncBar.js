"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

// "just now", "5 min ago", or the full date if it's been a while
function ago(date, now) {
  const s = Math.max(0, Math.round((now - date.getTime()) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  return date.toLocaleString();
}

export default function SyncBar() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [connected, setConnected] = useState(false);
  const [needsReconnect, setNeedsReconnect] = useState(false); // signed in before Tasks permission
  const [lastSynced, setLastSynced] = useState(null);
  const [settings, setSettings] = useState({ autoSync: false, minutes: 15 });
  const [now, setNow] = useState(() => Date.now()); // so "2 min ago" keeps updating
  const running = useRef(false); // stops two syncs from overlapping
  const lastRun = useRef(0); // when the last sync started (for the throttle)

  const runSync = useCallback(
    async ({ quiet = false } = {}) => {
      if (running.current) return;
      // automatic syncs run at most once every 15 seconds; the button is never throttled
      if (quiet && Date.now() - lastRun.current < 15000) return;
      lastRun.current = Date.now();

      running.current = true;
      setBusy(true);
      if (!quiet) setMsg("");

      try {
        const res = await fetch("/api/calendar/sync", { method: "POST" });
        const data = await res.json();
        if (!res.ok) {
          setMsg(data.message || "Sync failed.");
          return;
        }
        setLastSynced(new Date(data.lastSyncedAt));
        setNeedsReconnect(!!data.needsReconnect);

        if (data.tasksFailed) setMsg("Events synced, but Tasks couldn't sync.");
        else if (data.count > 0) setMsg(`${data.count} change${data.count === 1 ? "" : "s"} synced`);
        else setMsg("");

        if (data.count > 0) router.refresh();
      } catch {
        setMsg("Sync failed. Check your connection.");
      } finally {
        running.current = false;
        setBusy(false);
      }
    },
    [router]
  );

  // load status once, then sync right away if it's been a while
  useEffect(() => {
    let cancelled = false;
    fetch("/api/calendar/sync")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const last = d.lastSyncedAt ? new Date(d.lastSyncedAt) : null;
        const minutes = Math.max(1, d.autoSyncMinutes || 15);
        setConnected(!!d.connected);
        setNeedsReconnect(!!d.connected && !d.tasksConnected);
        setLastSynced(last);
        setSettings({ autoSync: !!d.autoSync, minutes });

        const stale = !last || Date.now() - last.getTime() > minutes * 60000;
        if (d.connected && d.autoSync && stale) runSync({ quiet: true });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [runSync]);

  // repeat every N minutes, and sync when you come back to the tab or window
  useEffect(() => {
    if (!connected || !settings.autoSync) return;

    const tick = () => {
      if (document.visibilityState === "visible") runSync({ quiet: true });
    };
    const timer = setInterval(tick, settings.minutes * 60000);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
    };
  }, [connected, settings, runSync]);

  // refresh the "x min ago" text
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  // hide the result message after a few seconds
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(""), 6000);
    return () => clearTimeout(t);
  }, [msg]);

  // left side
  let dot = "bg-emerald-500";
  let label = settings.autoSync
    ? `Google synced · auto every ${settings.minutes} min`
    : "Google connected";
  if (!connected) {
    dot = "bg-neutral-300";
    label = "Google not connected";
  } else if (needsReconnect) {
    dot = "bg-amber-400";
    label = "Google Tasks needs permission";
  }

  // middle
  let status = "Not synced yet";
  if (busy) status = "Syncing...";
  else if (msg) status = msg;
  else if (lastSynced) status = `Last synced: ${ago(lastSynced, now)}`;

  return (
    <div className="flex items-center justify-between gap-4 bg-blue-50 border-t border-blue-100 px-6 py-3 text-sm">
      <div className="flex items-center gap-2 text-ink font-medium">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        {label}
      </div>

      <span className="text-inksoft">{status}</span>

      <div className="flex items-center gap-2">
        {!connected && (
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="rounded-md bg-blue-600 px-4 py-1.5 text-white text-sm font-medium hover:bg-blue-700"
          >
            Connect Google
          </button>
        )}
        {connected && needsReconnect && (
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="rounded-md bg-amber-500 px-4 py-1.5 text-white text-sm font-medium hover:bg-amber-600"
          >
            Reconnect Google
          </button>
        )}
        {connected && (
          <button
            onClick={() => runSync()}
            disabled={busy}
            className="rounded-md bg-blue-600 px-4 py-1.5 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {busy ? "Syncing..." : "Resync Now"}
          </button>
        )}
      </div>
    </div>
  );
}