"use client";

import { useMemo } from "react";
import { eventTypeStyles, priorityStyles } from "@/lib/data";
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

const MAX_PER_DAY = 3; // month view shows this many, then "+N more"

function timeLabel(date) {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// One task or event, styled by priority (tasks) or type (events).
function Chip({ item, showTime }) {
  const style =
    item.kind === "task" ? priorityStyles[item.priority] : eventTypeStyles[item.type];
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

export default function Calendar({ items, view, cursor }) {
  const today = useMemo(() => new Date(), []);
  const parsed = useMemo(
    () => items.map((i) => ({ ...i, date: new Date(i.at) })),
    [items]
  );
  const byDay = useMemo(() => groupByDay(parsed), [parsed]);

  if (view === "weekly") {
    const days = weekDaysFrom(cursor);
    const title = `${days[0].toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} - ${days[6].toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
    return <WeekGrid title={title} days={days} byDay={byDay} today={today} />;
  }

  const title = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  return (
    <MonthGrid
      title={title}
      weeks={monthWeeks(cursor)}
      month={cursor.getMonth()}
      byDay={byDay}
      today={today}
    />
  );
}

function WeekGrid({ title, days, byDay, today }) {
  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="px-4 py-3 border-b font-semibold">{title}</div>
      <div className="grid grid-cols-8 border-b text-sm font-medium">
        <div className="p-3" />
        {days.map((d) => (
          <div
            key={dayKey(d)}
            className={`p-3 border-l text-center ${
              sameDay(d, today) ? "bg-blue-50 text-blue-700" : ""
            }`}
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

function MonthGrid({ title, weeks, month, byDay, today }) {
  const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="px-4 py-3 border-b font-semibold">{title}</div>
      <div className="grid grid-cols-7 border-b text-sm font-medium">
        {names.map((n) => (
          <div key={n} className="p-3 text-center">
            {n}
          </div>
        ))}
      </div>
      {weeks.map((week) => (
        <div key={dayKey(week[0])} className="grid grid-cols-7 border-b">
          {week.map((d) => {
            const inMonth = d.getMonth() === month;
            const list = byDay.get(dayKey(d)) || [];
            const shown = list.slice(0, MAX_PER_DAY);
            const extra = list.length - shown.length;
            return (
              <div key={dayKey(d)} className="border-l min-h-[100px] p-2">
                <span
                  className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full text-sm ${
                    sameDay(d, today)
                      ? "bg-blue-700 text-white"
                      : inMonth
                      ? "text-ink"
                      : "text-neutral-300"
                  }`}
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