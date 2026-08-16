import { useEffect, useMemo, useState } from "react";
import { cx } from "../../ui/cx.js";
import {
  DAY_NAMES,
  clockRange,
  facultyOf,
  groupByDayPeriod,
  sectionOf,
  subjectOf,
} from "./lib.js";

const WEEKDAY = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function minutesNow() {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}

function toMinutes(hhmm) {
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + m;
}

function typeLabel(type) {
  if (type === "P") return "Lab";
  if (type === "T") return "Tutorial";
  return "Lecture";
}

export default function ScheduleCards({ data, view, slots }) {
  const days = data.meta.days;
  const periods = data.meta.periods;
  const lunchAfter = data.meta.breaks?.[0]?.after_period ?? 3;
  const byDayPeriod = useMemo(() => groupByDayPeriod(slots), [slots]);
  const today = WEEKDAY[new Date().getDay()];
  const [activeDay, setActiveDay] = useState(() =>
    days.includes(today) ? today : days[0]
  );

  useEffect(() => {
    if (!days.includes(activeDay)) {
      setActiveDay(days.includes(today) ? today : days[0]);
    }
  }, [days, activeDay, today]);

  const nowMin = minutesNow();
  const isToday = activeDay === today;

  return (
    <section className="schedule-mobile" aria-label="Weekly schedule">
      <div className="day-chips" role="tablist" aria-label="Day">
        {days.map((day) => (
          <button
            key={day}
            type="button"
            role="tab"
            aria-selected={activeDay === day}
            className={cx(
              "day-chip",
              activeDay === day && "is-active",
              day === today && "is-today"
            )}
            onClick={() => setActiveDay(day)}
          >
            {(DAY_NAMES[day] || day).slice(0, 3)}
          </button>
        ))}
      </div>

      <div className="period-list">
        {periods.flatMap((p) => {
          const list = byDayPeriod.get(`${activeDay}|${p.id}`) || [];
          const current =
            isToday && nowMin >= toMinutes(p.start) && nowMin < toMinutes(p.end);
          const nodes = [
            <article
              key={p.id}
              className={cx(
                "period-card",
                current && "is-now",
                !list.length && "is-free"
              )}
            >
              <div className="period-time">
                <span className="period-no">{p.label}</span>
                <span className="period-clock">{clockRange(p.start, p.end)}</span>
                {current ? <span className="now-pill">Now</span> : null}
              </div>
              {list.length ? (
                <ul className="period-items">
                  {list.map((s, i) => {
                    const sub = subjectOf(data, s.subject_code);
                    const fac = facultyOf(data, s.faculty_id);
                    const sec = sectionOf(data, s.section_id);
                    const title = s.subject_short || sub?.short || s.subject_code || "Class";
                    const detail =
                      view === "section"
                        ? fac?.name
                        : view === "faculty"
                          ? sec?.label
                          : `${sec?.label || s.section_id}${fac?.name ? ` · ${fac.name}` : ""}`;
                    return (
                      <li key={`${s.id || i}`}>
                        <p className="period-title">{title}</p>
                        <p className="period-meta">
                          <span className={`type-pill type-${s.type || "L"}`}>{typeLabel(s.type)}</span>
                          {s.group ? <span>Group {s.group}</span> : null}
                          {s.room_id ? <span>Room {s.room_id}</span> : null}
                          {detail ? <span>{detail}</span> : null}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="period-free">Free period</p>
              )}
            </article>,
          ];
          if (p.id === lunchAfter) {
            nodes.push(
              <div key="lunch" className="lunch-break" role="note">
                Lunch break
              </div>
            );
          }
          return nodes;
        })}
      </div>
    </section>
  );
}
