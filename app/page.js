"use client";

import { useState } from "react";
import Link from "next/link";
import {
  eventTypeStyles,
  priorityStyles,
  tasks,
  weekDays,
  weekHours,
  weekEvents,
  monthGrid,
  monthDots,
} from "@/lib/data";
import SyncBar from "@/components/SyncBar";

const legend =[
  { label: "Synced GCal Event", type: "gcal" },
  { label: "Web Development", type: "physics" },
  { label: "Systems Review", type: "exam" },
  { label: "Mobile Development", type: "chemistry" },
];

export default function Dashboard(){
  const [view, setView] = useState("weekly");
  return(
    <div className="min-h-screen flex flex-col bg-[#F6F7F9]">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">Study Planner</h1>
          <span className="flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Synced with Google Calendar
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-8 w-8 rounded-md border text-inksoft hover:bg-neutral-50">‹</button>
          <button className="h-8 px-3 rounded-md border text-sm hover:bg-neutral-50">Today</button>
          <button className="h-8 w-8 rounded-md border text-inksoft hover:bg-neutral-50">›</button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-md border overflow-hidden text-sm">
            <button
              onClick={() => setView("weekly")}
              className={`px-3 py-1.5 ${view === "weekly" ? "bg-neutral-900 text-white" : "bg-white text-inksoft"}`}
            >
              Weekly
            </button>
            <button
              onClick={() => setView("monthly")}
              className={`px-3 py-1.5 ${view === "monthly" ? "bg-neutral-900 text-white" : "bg-white text-inksoft"}`}
            >
              Monthly
            </button>
          </div>
          <button className="h-8 px-3 rounded-md border text-sm flex items-center gap-1 text-inksoft hover:bg-neutral-50">
            ⌂ Navigator
          </button>
          <div className="h-8 w-8 rounded-full bg-violet-300" />
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 border-r bg-white p-5 space-y-6 overflow-y-auto">
          <div>
            <h2 className="font-semibold mb-3">Task Manager</h2>
            <input
              placeholder="+ Add new task..."
              className="w-full border rounded-[10px] px-3 py-2 text-sm mb-3 placeholder:text-inksoft"
            />
            <div className="flex gap-2 mb-3">
              {Object.keys(priorityStyles).map((p) => (
                <span
                  key={p}
                  className={`text-xs px-2.5 py-1 rounded-full border ${priorityStyles[p].bg} ${priorityStyles[p].text} ${priorityStyles[p].border}`}
                >
                  {p}
                </span>
              ))}
            </div>
            <ul className="space-y-2">
              {tasks.map((t) => (
                <li key={t.id} className="flex items-center gap-2 text-sm">
                  <span className={`h-4 w-4 rounded-full border-2 ${priorityStyles[t.priority].border}`} />
                  {t.name}
                </li>
              ))}
            </ul>
            <Link
              href="/tasks/new"
              className="block mt-3 text-center text-sm border rounded-[10px] py-1.5 text-inksoft hover:bg-neutral-50"
            >
              + Add Task
            </Link>
          </div>
          <div>
            <h2 className="font-semibold mb-3">Resource Center</h2>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 bg-blue-50 rounded-md px-3 py-2 text-sm">
                <span className="h-4 w-4 rounded-full bg-white border" /> Google Drive
              </li>
              <li className="flex items-center gap-2 bg-neutral-100 rounded-md px-3 py-2 text-sm">
                <span className="h-4 w-4 rounded-full bg-white border" /> Notion
              </li>
              <li className="flex items-center gap-2 bg-orange-50 rounded-md px-3 py-2 text-sm">
                <span className="h-4 w-4 rounded-full bg-white border" /> Local Files
              </li>
            </ul>
            <Link href="/resources" className="block mt-3 text-center text-sm text-blue-600 hover:underline">
              Open Resource Center
            </Link>
          </div>
          <div>
            <h2 className="font-semibold mb-3">Progress</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-inksoft">Hours logged</span>
                <span className="font-medium">12.5h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-inksoft">Completed tasks</span>
                <span className="font-medium">8 / 12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-inksoft">Upcoming deadlines</span>
                <span className="font-medium">3</span>
              </div>
              <div className="h-1.5 rounded-full bg-neutral-200 mt-2">
                <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: "66%" }} />
              </div>
            </div>
          </div>
          <Link
            href="/settings"
            className="block mt-3 text-center text-sm border rounded-[10px] py-1.5 text-inksoft hover:bg-neutral-50"
          >
            Profile & Settings
          </Link>
        </aside>
        <main className="flex-1 overflow-auto p-6">
          <div className="flex gap-4 mb-4 text-xs text-inksoft">
            {legend.map((l) =>(
              <span key={l.type} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${eventTypeStyles[l.type].dot}`}/>
                {l.label}
              </span>
            ))}
          </div>
          {view === "weekly" ? <WeekGrid /> : <MonthGrid />}
        </main>
      </div>
      <SyncBar />
    </div>
  );
}

function WeekGrid(){
  return(
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="grid grid-cols-8 border-b text-sm font-medium">
        <div className="p-3" />
        {weekDays.map((d) =>(
          <div key={d.date} className="p-3 border-l text-center">
            {d.label} {d.date}
          </div>
        ))}
      </div>
      {weekHours.map((hour) =>(
        <div key={hour} className="grid grid-cols-8 border-b text-xs">
          <div className="p-3 text-inksoft">{hour}</div>
          {weekDays.map((d) =>{
            const event = weekEvents.find((e) => e.day === d.date && e.hour === hour);
            const style = event ? eventTypeStyles[event.type] : null;
            return(
              <div key={d.date} className="border-l p-1 min-h-[64px]">
                {event &&(
                  <div className={`h-full rounded-md border px-2 py-1 ${style.bg} ${style.border} ${style.text}`}>
                    {event.title}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function MonthGrid(){
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return(
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="px-4 py-3 border-b font-semibold">September 2026</div>
      <div className="grid grid-cols-7 border-b text-sm font-medium">
        {days.map((d) =>(
          <div key={d} className="p-3 text-center">{d}</div>
        ))}
      </div>
      {monthGrid.map((week, wi) =>(
        <div key={wi} className="grid grid-cols-7 border-b">
          {week.map((date, di) =>{
            const isCurrentMonth = !(wi === 0 && date > 7) && !(wi === monthGrid.length - 1 && date < 15);
            const dots = isCurrentMonth ? monthDots[date] : null;
            return(
              <div key={di} className="border-l min-h-[100px] p-2">
                <span className={`text-sm ${isCurrentMonth ? "text-ink" : "text-neutral-300"}`}>{date}</span>
                {dots &&(
                  <div className="flex gap-1 mt-2">
                    {dots.map((type, i) =>(
                      <span key={i} className={`h-1.5 w-1.5 rounded-full ${eventTypeStyles[type].dot}`}/>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
