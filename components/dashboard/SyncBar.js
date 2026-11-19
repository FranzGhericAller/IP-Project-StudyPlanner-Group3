"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

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
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [settings, setSettings] = useState({ autoSync: false, minutes: 15 });
  const [now, setNow] = useState(() => Date.now());
  const running = useRef(false);
  const lastRun = useRef(0);

  const runSync = useCallback(
    async ({ quiet = false } = {}) => {
      if (running.current) return;
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

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(""), 6000);
    return () => clearTimeout(t);
  }, [msg]);

  let dot = "bg-emerald-500";
  let label = settings.autoSync
    ? `Google synced · auto every ${settings.minutes} min`
    : "Google connected";
  if (!connected) {
    dot = "bg-neutral-300 dark:bg-neutral-600";
    label = "Google not connected";
  } else if (needsReconnect) {
    dot = "bg-amber-400";
    label = "Google Tasks needs permission";
  }

  let status = "Not synced yet";
  if (busy) status = "Syncing...";
  else if (msg) status = msg;
  else if (lastSynced) status = `Last synced: ${ago(lastSynced, now)}`;

  return (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-blue-50 dark:bg-neutral-900 border-t border-blue-100 dark:border-neutral-800 px-4 py-3 text-sm md:px-6">
      <div className="flex items-center gap-2 text-ink font-medium">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        {label}
      </div>

      <span className="order-last basis-full text-xs text-inksoft sm:order-none sm:basis-auto sm:text-sm">{status}</span>

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
      </div>
    </div>
  );
}