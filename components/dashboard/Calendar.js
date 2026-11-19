"use client";

import { useMemo } from "react";
import GoogleBadge from "@/components/common/GoogleBadge";
import { eventStyle, priorityStyles } from "@/lib/ui";
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

// one task/event box.
// task  = priority color + a ring (like the sidebar circle), no time
// event = neutral gray + dark left bar + time
// "G" badge = linked to Google. click the chip to open the details panel
function Chip({ item, showTime, onSelect }) {
  const isTask = item.kind === "task";
  const style = isTask ? priorityStyles[item.priority] : eventStyle;

  const className = `flex w-full min-w-0 items-center gap-1.5 rounded-md border px-2 py-1 text-left hover:brightness-95 ${
    style.bg
  } ${style.border} ${style.text} ${isTask ? "" : `border-l-4 ${eventStyle.accent}`} ${
    item.done ? "opacity-50 line-through" : ""
  } ${showTime ? "text-[11px]" : ""}`;

  const title = `${isTask ? "Task" : "Event"}: ${item.title} (${timeLabel(item.date)})`;

  return (
    <button type="button" onClick={() => onSelect?.(item)} title={title} className={className}>
      {isTask && <span className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-current" />}
      {!isTask && showTime && <span className="shrink-0 font-medium">{timeLabel(item.date)}</span>}
      <span className={`min-w-0 flex-1 ${showTime ? "truncate" : "break-words"}`}>{item.title}</span>
      {item.linked && <GoogleBadge />}
    </button>
  );
}

// items = due tasks + events, each w/ an ISO date in `at`
// cursor = the date we're looking at, onSelect = called when a chip is clicked
export default function Calendar({ items, view, cursor, onSelect }) {
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
    return (
      <WeekGrid title={`${first} to ${last}`} days={days} byDay={byDay} today={today} onSelect={onSelect} />
    );
  }

  return (
    <MonthGrid
      title={cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
      weeks={monthWeeks(cursor)}
      month={cursor.getMonth()}
      byDay={byDay}
      today={today}
      onSelect={onSelect}
    />
  );
}

// rows = hours, columns = days
function WeekGrid({ title, days, byDay, today, onSelect }) {
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
                  <Chip key={i.id} item={i} onSelect={onSelect} />
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
function MonthGrid({ title, weeks, month, byDay, today, onSelect }) {
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
                    <Chip key={i.id} item={i} showTime onSelect={onSelect} />
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