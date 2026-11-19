"use client";

import { useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import BackLink from "@/components/common/BackLink";
import UserAvatar from "@/components/common/UserAvatar";
import Alert from "@/components/common/Alert";
import { useTheme } from "@/components/common/ThemeProvider";
import { callApi } from "@/lib/callApi";

const INTERVALS = [1, 2, 5, 15, 30];

function Toggle({ on, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={on}
      className={`h-6 w-11 rounded-full transition-colors ${
        on ? "bg-emerald-500" : "bg-neutral-300 dark:bg-neutral-700"
      }`}
    >
      <span
        className={`block h-5 w-5 bg-white rounded-full shadow transform transition-transform ${
          on ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function Pill({ tone, children }) {
  const styles = {
    ok: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    warn: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    off: "bg-neutral-100 text-inksoft dark:bg-neutral-800 dark:text-neutral-300",
  };
  return <span className={`text-xs px-2.5 py-1 rounded-full ${styles[tone]}`}>{children}</span>;
}

export default function Settings() {
  const { data: session } = useSession();
  const { setDarkMode } = useTheme();
  const [prefs, setPrefs] = useState(null);
  const [google, setGoogle] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    callApi("/api/settings", "GET").then(({ ok, data }) => {
      if (ok) {
        setPrefs(data.settings);
        if (typeof data.settings?.darkMode === "boolean") {
          setDarkMode(data.settings.darkMode);
        }
      } else {
        setError(data.message || "Could not load your settings.");
      }
    });
    callApi("/api/calendar/sync", "GET").then(({ ok, data }) => {
      if (ok) setGoogle({ connected: data.connected, tasksConnected: data.tasksConnected });
    });
  }, [setDarkMode]);

  async function save(key, value) {
    const before = prefs;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setError("");
    if (key === "darkMode") setDarkMode(value);

    const { ok, data } = await callApi("/api/settings", "PATCH", { [key]: value });
    if (!ok) {
      setPrefs(before);
      if (key === "darkMode" && before) setDarkMode(before.darkMode);
      setError(data.message || "Could not save that setting.");
    }
  }

  const reconnect = () => signIn("google", { callbackUrl: "/settings" });

  return (
    <div className="min-h-screen">
      <BackLink title="Profile & Settings" />
      <div className="flex justify-center pt-10 px-6">
        <div className="w-full max-w-md space-y-5">
          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-5 flex items-center gap-3">
            <UserAvatar size="h-12 w-12" />
            <div>
              <div className="font-medium">{session?.user?.name ?? "Your account"}</div>
              <div className="text-sm text-inksoft">{session?.user?.email}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-5">
            <h2 className="font-semibold mb-3">Connected Accounts</h2>
            <ul className="space-y-3">
              <li className="flex items-center justify-between text-sm">
                <span>Google Calendar</span>
                {google === null ? (
                  <Pill tone="off">Checking...</Pill>
                ) : google.connected ? (
                  <Pill tone="ok">Connected</Pill>
                ) : (
                  <Pill tone="off">Not connected</Pill>
                )}
              </li>
              <li className="flex items-center justify-between text-sm">
                <span>Google Tasks</span>
                {google === null ? (
                  <Pill tone="off">Checking...</Pill>
                ) : google.tasksConnected ? (
                  <Pill tone="ok">Connected</Pill>
                ) : google.connected ? (
                  <Pill tone="warn">Needs permission</Pill>
                ) : (
                  <Pill tone="off">Not connected</Pill>
                )}
              </li>
            </ul>

            {google && (!google.connected || !google.tasksConnected) && (
              <button
                type="button"
                onClick={reconnect}
                className="mt-4 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                {google.connected ? "Reconnect Google" : "Connect Google"}
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-5">
            <h2 className="font-semibold mb-3">Preferences</h2>
            <Alert>{error}</Alert>

            {prefs ? (
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span>Email Notifications</span>
                  <Toggle
                    label="Email notifications"
                    on={prefs.emailNotifications}
                    onClick={() => save("emailNotifications", !prefs.emailNotifications)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>Dark Mode</span>
                  <Toggle
                    label="Dark mode"
                    on={prefs.darkMode}
                    onClick={() => save("darkMode", !prefs.darkMode)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>Auto-sync with Google</span>
                  <Toggle
                    label="Auto-sync"
                    on={prefs.autoSync}
                    onClick={() => save("autoSync", !prefs.autoSync)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className={prefs.autoSync ? "" : "text-inksoft"}>Sync every</span>
                  <select
                    value={prefs.autoSyncMinutes}
                    disabled={!prefs.autoSync}
                    onChange={(e) => save("autoSyncMinutes", Number(e.target.value))}
                    className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 py-1 text-sm disabled:opacity-50"
                  >
                    {INTERVALS.map((m) => (
                      <option key={m} value={m}>
                        {m} {m === 1 ? "minute" : "minutes"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <p className="text-sm text-inksoft">Loading...</p>
            )}
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full text-left px-4 py-2.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-sm font-medium hover:bg-rose-200 dark:hover:bg-rose-900"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}