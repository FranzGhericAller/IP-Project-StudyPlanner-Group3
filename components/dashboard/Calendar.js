"use client";

import { useEffect, useMemo, useState } from "react";
import GoogleBadge from "@/components/common/GoogleBadge";
import { eventStyle, priorityStyles, studyStyle } from "@/lib/ui";
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

const BOX =
  "bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden";
const LINE = "border-neutral-200 dark:border-neutral-700";

// events only. all-day events are finished once their day is over, timed events once they end
function isFinished(item, now) {
  if (item.kind !== "event" || !item.endAt) return false;
  if (item.allDay) {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return new Date(item.at) < startOfToday;
  }
  return new Date(item.endAt) < now;
}

function timeLabel(date) {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// one task/event/study box.
// task  = priority color + a ring (like the sidebar circle), no time
// event = neutral gray + dark left bar + time
// study = dashed outline + minutes (logged time, not clickable)
// "G" badge = linked to Google. click a task/event to open the details panel
// comfortable = bigger text and tap area (used in the phone/tablet list)
function Chip({ item, showTime, comfortable, onSelect }) {
  const isTask = item.kind === "task";
  const isStudy = item.kind === "study";
  const style = isTask ? priorityStyles[item.priority] : isStudy ? studyStyle : eventStyle;
  const size = comfortable ? "text-sm py-2" : showTime ? "text-[11px] py-1" : "py-1";

  const className = `flex w-full min-w-0 items-center gap-1.5 rounded-md border px-2 text-left ${size} ${
    style.bg
  } ${style.border} ${style.text} ${
    isTask || isStudy ? "" : `border-l-4 ${eventStyle.accent}`
  } ${isStudy ? "border-dashed" : "hover:brightness-95 dark:hover:brightness-110"} ${
    item.done ? "opacity-50 line-through" : item.finished ? "opacity-60" : ""
  }`;

  if (isStudy) {
    return (
      <div title={`Study: ${item.title} (${item.minutes} min)`} className={className}>
        <span className="shrink-0 font-medium">{item.minutes}m</span>
        <span className={`min-w-0 flex-1 ${showTime && !comfortable ? "truncate" : "break-words"}`}>
          {item.title}
        </span>
      </div>
    );
  }

  const title = `${isTask ? "Task" : "Event"}: ${item.title} (${timeLabel(item.date)})${
    item.finished ? ", finished" : ""
  }`;

  return (
    <button type="button" onClick={() => onSelect?.(item)} title={title} className={className}>
      {isTask && <span className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-current" />}
      {!isTask && showTime && <span className="shrink-0 font-medium">{timeLabel(item.date)}</span>}
      <span className={`min-w-0 flex-1 ${showTime && !comfortable ? "truncate" : "break-words"}`}>
        {item.title}
      </span>
      {item.finished && (
        <>
          <span aria-hidden="true" className="shrink-0 text-[10px]">
            ✓
          </span>
          <span className="sr-only">Finished</span>
        </>
      )}
      {item.linked && <GoogleBadge />}
    </button>
  );
}

// items = due tasks + events, each w/ an ISO date in `at`
// cursor = the date we're looking at, onSelect = called when a chip is clicked
export default function Calendar({ items, view, cursor, onSelect }) {
  const today = useMemo(() => new Date(), []);

  // "now" ticks every minute so an event gets marked finished while the page is open
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const parsed = useMemo(
    () => items.map((i) => ({ ...i, date: new Date(i.at), finished: isFinished(i, now) })),
    [items, now]
  );
  const byDay = useMemo(() => groupByDay(parsed), [parsed]);

  if (view === "weekly") {
    const days = weekDaysFrom(cursor);
    const first = days[0].toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const last = days[6].toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const title = `${first} to ${last}`;

    // below 1024px the hour grid is too cramped, so show a day-by-day list instead
    return (
      <>
        <div className="lg:hidden">
          <WeekList title={title} days={days} byDay={byDay} today={today} onSelect={onSelect} />
        </div>
        <div className="hidden lg:block">
          <WeekGrid title={title} days={days} byDay={byDay} today={today} onSelect={onSelect} />
        </div>
      </>
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

// phone/tablet: one section per day
function WeekList({ title, days, byDay, today, onSelect }) {
  return (
    <div className={BOX}>
      <div className={`px-4 py-3 border-b ${LINE} font-semibold`}>{title}</div>
      {days.map((d) => {
        const list = byDay.get(dayKey(d)) || [];
        const isToday = sameDay(d, today);
        return (
          <div key={dayKey(d)} className={`border-b ${LINE} px-4 py-3 last:border-b-0`}>
            <div
              className={`mb-2 flex items-center gap-2 text-sm font-medium ${
                isToday ? "text-blue-700 dark:text-blue-300" : ""
              }`}
            >
              <span>
                {d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </span>
              {isToday && (
                <span className="rounded-full bg-blue-700 dark:bg-blue-600 px-2 py-0.5 text-[10px] text-white">
                  Today
                </span>
              )}
            </div>
            {list.length === 0 ? (
              <p className="text-xs text-inksoft">Nothing planned</p>
            ) : (
              <div className="space-y-1.5">
                {list.map((i) => (
                  <Chip key={i.id} item={i} showTime comfortable onSelect={onSelect} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// desktop: rows = hours, columns = days
function WeekGrid({ title, days, byDay, today, onSelect }) {
  return (
    <div className={BOX}>
      <div className={`px-4 py-3 border-b ${LINE} font-semibold`}>{title}</div>
      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <div className={`grid grid-cols-8 border-b ${LINE} text-sm font-medium`}>
            <div className="p-3" />
            {days.map((d) => (
              <div
                key={dayKey(d)}
                className={`p-3 border-l ${LINE} text-center ${
                  sameDay(d, today) ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" : ""
                }`}
              >
                {d.toLocaleDateString("en-US", { weekday: "short" })} {d.getDate()}
              </div>
            ))}
          </div>
          {HOURS.map((hour) => (
            <div key={hour} className={`grid grid-cols-8 border-b ${LINE} text-xs`}>
              <div className="p-3 text-inksoft">{hourLabel(hour)}</div>
              {days.map((d) => {
                const slot = (byDay.get(dayKey(d)) || []).filter(
                  (i) => clampHour(i.date.getHours()) === hour
                );
                return (
                  <div key={dayKey(d)} className={`border-l ${LINE} p-1 min-h-[64px] space-y-1`}>
                    {slot.map((i) => (
                      <Chip key={i.id} item={i} onSelect={onSelect} />
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// rows = weeks. scrolls sideways on small screens instead of squeezing the days
function MonthGrid({ title, weeks, month, byDay, today, onSelect }) {
  return (
    <div className={BOX}>
      <div className={`px-4 py-3 border-b ${LINE} font-semibold`}>{title}</div>
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className={`grid grid-cols-7 border-b ${LINE} text-sm font-medium`}>
            {DAY_NAMES.map((n) => (
              <div key={n} className="p-3 text-center">
                {n}
              </div>
            ))}
          </div>
          {weeks.map((week) => (
            <div key={dayKey(week[0])} className={`grid grid-cols-7 border-b ${LINE}`}>
              {week.map((d) => {
                const list = byDay.get(dayKey(d)) || [];
                const shown = list.slice(0, MAX_PER_DAY);
                const extra = list.length - shown.length;

                let dayColor = "text-neutral-300 dark:text-neutral-600"; // days from prev/next month
                if (sameDay(d, today)) dayColor = "bg-blue-700 text-white dark:bg-blue-600";
                else if (d.getMonth() === month) dayColor = "text-ink";

                return (
                  <div key={dayKey(d)} className={`border-l ${LINE} min-h-[100px] p-2`}>
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
      </div>
    </div>
  );
}