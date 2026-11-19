"use client";

import { useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import BackLink from "@/components/common/BackLink";
import UserAvatar from "@/components/common/UserAvatar";
import Alert from "@/components/common/Alert";
import { callApi } from "@/lib/callApi";

const INTERVALS = [1, 2, 5, 15, 30];

// on/off switch
function Toggle({ on, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={on}
      className={`h-6 w-11 rounded-full transition-colors ${on ? "bg-emerald-500" : "bg-neutral-300"}`}
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
    ok: "bg-emerald-100 text-emerald-700",
    warn: "bg-amber-100 text-amber-700",
    off: "bg-neutral-100 text-inksoft",
  };
  return <span className={`text-xs px-2.5 py-1 rounded-full ${styles[tone]}`}>{children}</span>;
}

export default function Settings() {
  const { data: session } = useSession();
  const [prefs, setPrefs] = useState(null); // loaded from the db
  const [google, setGoogle] = useState(null); // { connected, tasksConnected }
  const [error, setError] = useState("");

  useEffect(() => {
    callApi("/api/settings", "GET").then(({ ok, data }) => {
      if (ok) setPrefs(data.settings);
      else setError(data.message || "Could not load your settings.");
    });
    callApi("/api/calendar/sync", "GET").then(({ ok, data }) => {
      if (ok) setGoogle({ connected: data.connected, tasksConnected: data.tasksConnected });
    });
  }, []);

  // change one setting: update the screen right away, save, and undo if saving fails
  async function save(key, value) {
    const before = prefs;
    setPrefs({ ...prefs, [key]: value });
    setError("");
    const { ok, data } = await callApi("/api/settings", "PATCH", { [key]: value });
    if (!ok) {
      setPrefs(before);
      setError(data.message || "Could not save that setting.");
    }
  }

  const reconnect = () => signIn("google", { callbackUrl: "/settings" });

  return (
    <div className="min-h-screen">
      <BackLink title="Profile & Settings" />
      <div className="flex justify-center pt-10 px-6">
        <div className="w-full max-w-md space-y-5">
          <div className="bg-white rounded-lg border p-5 flex items-center gap-3">
            <UserAvatar size="h-12 w-12" />
            <div>
              <div className="font-medium">{session?.user?.name ?? "Your account"}</div>
              <div className="text-sm text-inksoft">{session?.user?.email}</div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-5">
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
              <li className="flex items-center justify-between text-sm">
                <span>Google Drive</span>
                <Pill tone="off">Coming soon</Pill>
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

          <div className="bg-white rounded-lg border p-5">
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
                  <span>
                    Dark Mode <span className="text-xs text-inksoft">(coming soon)</span>
                  </span>
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
                    className="rounded-md border px-2 py-1 text-sm disabled:opacity-50"
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
            className="w-full text-left px-4 py-2.5 rounded-md bg-rose-100 text-rose-700 text-sm font-medium hover:bg-rose-200"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}