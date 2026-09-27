"use client";
import { useState } from "react";
import BackLink from "@/components/BackLink";

const connectedAccounts =["Google Calendar", "Google Drive", "Notion"];

export default function Settings(){
  const [emailNotif, setEmailNotif] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const Toggle = ({ on, onClick }) =>(
    <button
      onClick={onClick}
      className={`h-6 w-11 rounded-full transition-colors ${on ? "bg-emerald-500" : "bg-neutral-300"}`}
    >
      <span
        className={`block h-5 w-5 bg-white rounded-full shadow transform transition-transform ${
          on ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
  return(
    <div className="min-h-screen bg-[#F6F7F9]">
      <BackLink title="Profile & Settings" />
      <div className="flex justify-center pt-10 px-6">
        <div className="w-full max-w-md space-y-5">
          <div className="bg-white rounded-lg border p-5 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-violet-300" />
            <div>
              <div className="font-medium">Kyle C. Tubod</div>
              <div className="text-sm text-inksoft">22103894@usc.edu.ph</div>
            </div>
          </div>
          <div className="bg-white rounded-lg border p-5">
            <h2 className="font-semibold mb-3">Connected Accounts</h2>
            <ul className="space-y-3">
              {connectedAccounts.map((acc) =>(
                <li key={acc} className="flex items-center justify-between text-sm">
                  <span>{acc}</span>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
                    Connected
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-lg border p-5">
            <h2 className="font-semibold mb-3">Preferences</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>Email Notifications</span>
                <Toggle on={emailNotif} onClick={() => setEmailNotif(!emailNotif)} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Dark Mode</span>
                <Toggle on={darkMode} onClick={() => setDarkMode(!darkMode)} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Auto-sync every 15 min</span>
                <Toggle on={autoSync} onClick={() => setAutoSync(!autoSync)} />
              </div>
            </div>
          </div>
          <button className="w-full text-left px-4 py-2.5 rounded-md bg-rose-100 text-rose-700 text-sm font-medium hover:bg-rose-200">
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}