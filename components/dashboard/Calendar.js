"use client";

import { useMemo } from "react";
import { eventStyles, priorityStyles } from "@/lib/ui";
import {
  HOURS,
  clampHour,
  hourLabel,
  sameDay,
  dayKey,
  weekDaysFrom,
  monthWeeks,
  groupByDay,
} from "@/lib/calendar";

const MAX_PER_DAY = 3; // month view shows 3 then "+N more"
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function timeLabel(date) {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// one task/event box. tasks use priority colors, events use source colors
function Chip({ item, showTime }) {
  const style = item.kind === "task" ? priorityStyles[item.priority] : eventStyles[item.source];
  return (
    <div
      title={`${item.title} (${timeLabel(item.date)})`}
      className={`rounded-md border px-2 py-1 ${style.bg} ${style.border} ${style.text} ${
        item.done ? "opacity-50 line-through" : ""
      } ${showTime ? "truncate text-[11px]" : ""}`}
    >
      {showTime && <span className="font-medium">{timeLabel(item.date)} </span>}
      {item.title}
    </div>
  );
}

// items = due tasks + events, each w/ an ISO date in `at`
// cursor = the date we're looking at
export default function Calendar({ items, view, cursor }) {
  const today = useMemo(() => new Date(), []);

  // ISO string -> Date, then group by day
  const parsed = useMemo(() => items.map((i) => ({ ...i, date: new Date(i.at) })), [items]);
  const byDay = useMemo(() => groupByDay(parsed), [parsed]);

  if (view === "weekly") {
    const days = weekDaysFrom(cursor);
    const first = days[0].toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const last = days[6].toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return <WeekGrid title={`${first} to ${last}`} days={days} byDay={byDay} today={today} />;
  }

  return (
    <MonthGrid
      title={cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
      weeks={monthWeeks(cursor)}
      month={cursor.getMonth()}
      byDay={byDay}
      today={today}
    />
  );
}

// rows = hours, columns = days
function WeekGrid({ title, days, byDay, today }) {
  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="px-4 py-3 border-b font-semibold">{title}</div>
      <div className="grid grid-cols-8 border-b text-sm font-medium">
        <div className="p-3" />
        {days.map((d) => (
          <div
            key={dayKey(d)}
            className={`p-3 border-l text-center ${sameDay(d, today) ? "bg-blue-50 text-blue-700" : ""}`}
          >
            {d.toLocaleDateString("en-US", { weekday: "short" })} {d.getDate()}
          </div>
        ))}
      </div>
      {HOURS.map((hour) => (
        <div key={hour} className="grid grid-cols-8 border-b text-xs">
          <div className="p-3 text-inksoft">{hourLabel(hour)}</div>
          {days.map((d) => {
            const slot = (byDay.get(dayKey(d)) || []).filter(
              (i) => clampHour(i.date.getHours()) === hour
            );
            return (
              <div key={dayKey(d)} className="border-l p-1 min-h-[64px] space-y-1">
                {slot.map((i) => (
                  <Chip key={i.id} item={i} />
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// rows = weeks
function MonthGrid({ title, weeks, month, byDay, today }) {
  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="px-4 py-3 border-b font-semibold">{title}</div>
      <div className="grid grid-cols-7 border-b text-sm font-medium">
        {DAY_NAMES.map((n) => (
          <div key={n} className="p-3 text-center">
            {n}
          </div>
        ))}
      </div>
      {weeks.map((week) => (
        <div key={dayKey(week[0])} className="grid grid-cols-7 border-b">
          {week.map((d) => {
            const list = byDay.get(dayKey(d)) || [];
            const shown = list.slice(0, MAX_PER_DAY);
            const extra = list.length - shown.length;

            let dayColor = "text-neutral-300"; // days from prev/next month
            if (sameDay(d, today)) dayColor = "bg-blue-700 text-white";
            else if (d.getMonth() === month) dayColor = "text-ink";

            return (
              <div key={dayKey(d)} className="border-l min-h-[100px] p-2">
                <span
                  className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full text-sm ${dayColor}`}
                >
                  {d.getDate()}
                </span>
                <div className="mt-1 space-y-1">
                  {shown.map((i) => (
                    <Chip key={i.id} item={i} showTime />
                  ))}
                  {extra > 0 && <div className="text-[11px] text-inksoft">+{extra} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
