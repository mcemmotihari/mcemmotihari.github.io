import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { cx } from "../../ui/cx.js";
import {
  findCurrentPeriod,
  findLunchNow,
  findNextPeriod,
  formatWait,
  periodProgress,
  toMinutes,
} from "./clock.js";
import {
  DAY_NAMES,
  clockRange,
  facultyOf,
  groupByDayPeriod,
  sectionOf,
  subjectOf,
} from "./lib.js";

function typeLabel(type) {
  if (type === "P") return "Lab";
  if (type === "T") return "Tutorial";
  return "Lecture";
}

function slotTitle(data, slot) {
  const sub = subjectOf(data, slot.subject_code);
  return slot.subject_short || sub?.short || slot.subject_code || "Class";
}

function slotDetail(data, view, slot) {
  const fac = facultyOf(data, slot.faculty_id);
  const sec = sectionOf(data, slot.section_id);
  if (view === "section") return fac?.name;
  if (view === "faculty") return sec?.label;
  return `${sec?.label || slot.section_id}${fac?.name ? ` · ${fac.name}` : ""}`;
}

function firstSlots(byDayPeriod, day, period) {
  return byDayPeriod.get(`${day}|${period.id}`) || [];
}

export default function ScheduleCards({ data, view, slots, clock }) {
  const days = data.meta.days;
  const periods = data.meta.periods;
  const lunch = data.meta.breaks?.[0];
  const lunchAfter = lunch?.after_period ?? 3;
  const byDayPeriod = useMemo(() => groupByDayPeriod(slots), [slots]);
  const today = clock.weekday;
  const campusOff = !days.includes(today);
  const [activeDay, setActiveDay] = useState(() =>
    days.includes(today) ? today : days[0]
  );
  const [slide, setSlide] = useState("in");
  const [stuck, setStuck] = useState(false);
  const [pill, setPill] = useState({ left: 0, width: 0 });
  const chipsRef = useRef(null);
  const anchorRef = useRef(null);
  const touchRef = useRef(null);

  useEffect(() => {
    if (!days.includes(activeDay)) {
      setActiveDay(days.includes(today) ? today : days[0]);
    }
  }, [days, activeDay, today]);

  function goToDay(next) {
    if (next === activeDay) return;
    const from = days.indexOf(activeDay);
    const to = days.indexOf(next);
    setSlide(to > from ? "left" : "right");
    setActiveDay(next);
  }

  useLayoutEffect(() => {
    const root = chipsRef.current;
    if (!root) return undefined;

    function measure() {
      const active = root.querySelector(".day-chip.is-active");
      if (!active) return;
      setPill({ left: active.offsetLeft, width: active.offsetWidth });
    }

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [activeDay, days]);

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      setStuck(!entry.isIntersecting);
    });
    observer.observe(anchor);
    return () => observer.disconnect();
  }, []);

  const nowMin = clock.minutes;
  const isToday = activeDay === today;
  const currentPeriod = isToday ? findCurrentPeriod(periods, nowMin) : null;
  const lunchNow = isToday ? findLunchNow(data.meta.breaks, nowMin) : null;
  const nextPeriod = isToday ? findNextPeriod(periods, nowMin) : null;
  const nextSlots = nextPeriod ? firstSlots(byDayPeriod, activeDay, nextPeriod) : [];
  const dayHasClasses = periods.some((p) => firstSlots(byDayPeriod, activeDay, p).length);
  const doneToday =
    isToday && !currentPeriod && !lunchNow && !nextPeriod && nowMin >= toMinutes(periods.at(-1)?.end || "00:00");

  function onTouchStart(event) {
    const t = event.changedTouches[0];
    touchRef.current = { x: t.clientX, y: t.clientY };
  }

  function onTouchEnd(event) {
    const start = touchRef.current;
    touchRef.current = null;
    if (!start) return;
    const t = event.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
    const i = days.indexOf(activeDay);
    if (dx < 0 && i < days.length - 1) goToDay(days[i + 1]);
    if (dx > 0 && i > 0) goToDay(days[i - 1]);
  }

  const nextLabel = nextSlots.length
    ? slotTitle(data, nextSlots[0])
    : nextPeriod
      ? "Free period"
      : "";

  return (
    <section className="schedule-mobile" aria-label="Weekly schedule">
      {campusOff ? (
        <p className="day-banner" role="status">
          No classes today. Showing {DAY_NAMES[days[0]] || days[0]}.
        </p>
      ) : null}
      <div ref={anchorRef} className="day-chips-anchor" aria-hidden="true" />
      <div className={cx("day-chips", stuck && "is-stuck")} ref={chipsRef} role="tablist" aria-label="Day">
        <span
          className="day-chip-pill"
          style={{
            width: pill.width,
            transform: `translateX(${pill.left}px)`,
            opacity: pill.width ? 1 : 0,
          }}
        />
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
            onClick={() => goToDay(day)}
          >
            {(DAY_NAMES[day] || day).slice(0, 3)}
          </button>
        ))}
      </div>

      {isToday && lunchNow ? (
        <p className="up-next-banner" role="status">
          Lunch · up next {nextLabel ? `${nextLabel} · ` : ""}
          {nextPeriod ? formatWait(toMinutes(nextPeriod.start) - nowMin) : ""}
        </p>
      ) : null}
      {isToday && !currentPeriod && !lunchNow && nextPeriod ? (
        <p className="up-next-banner" role="status">
          Up next · {nextLabel}
          {nextSlots[0]?.room_id ? ` · Room ${nextSlots[0].room_id}` : ""} ·{" "}
          {formatWait(toMinutes(nextPeriod.start) - nowMin)}
        </p>
      ) : null}
      {doneToday ? (
        <p className="up-next-banner is-done" role="status">
          Classes done for today
        </p>
      ) : null}
      {isToday && !campusOff && !dayHasClasses && !doneToday ? (
        <p className="up-next-banner" role="status">
          No classes scheduled today
        </p>
      ) : null}

      <div
        key={activeDay}
        className={cx("period-list", `slide-${slide}`)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {periods.flatMap((p) => {
          const list = firstSlots(byDayPeriod, activeDay, p);
          const current = currentPeriod?.id === p.id;
          const nodes = [
            <article
              key={p.id}
              className={cx(
                "period-card",
                current && "is-now",
                !list.length && "is-free"
              )}
            >
              {current ? (
                <span className="now-progress" aria-hidden="true">
                  <span style={{ transform: `scaleX(${periodProgress(p, nowMin)})` }} />
                </span>
              ) : null}
              <div className="period-time">
                <span className="period-no">{p.label}</span>
                <span className="period-clock">{clockRange(p.start, p.end)}</span>
                {current ? <span className="now-pill">Now</span> : null}
              </div>
              {list.length ? (
                <ul className="period-items">
                  {list.map((s, i) => {
                    const title = slotTitle(data, s);
                    const detail = slotDetail(data, view, s);
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
              {current && nextPeriod ? (
                <p className="period-next">
                  Up next · {nextLabel} · {formatWait(toMinutes(nextPeriod.start) - nowMin)}
                </p>
              ) : null}
            </article>,
          ];
          if (p.id === lunchAfter) {
            nodes.push(
              <div key="lunch" className={cx("lunch-break", lunchNow && "is-now")} role="note">
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
