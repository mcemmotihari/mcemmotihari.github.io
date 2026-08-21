import { useEffect, useState } from "react";
import { lunchAfterPeriod, maxPeriodId, slotPeriodIds } from "./lib.js";

export const WEEKDAY = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const WEEKDAY_FROM_SHORT = {
  Sun: "SUN",
  Mon: "MON",
  Tue: "TUE",
  Wed: "WED",
  Thu: "THU",
  Fri: "FRI",
  Sat: "SAT",
};

export function toMinutes(hhmm) {
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + m;
}

export function campusNow(timeZone = "Asia/Kolkata") {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23",
    })
      .formatToParts(new Date())
      .map((part) => [part.type, part.value])
  );
  return {
    weekday: WEEKDAY_FROM_SHORT[parts.weekday] || "MON",
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
    // weekday: "TUE",
    // minutes: 10 * 60 +64,
  };
}

export function useCampusClock(timeZone = "Asia/Kolkata") {
  const [now, setNow] = useState(() => campusNow(timeZone));

  useEffect(() => {
    const tick = () => setNow(campusNow(timeZone));
    const id = window.setInterval(tick, 10000);
    const onVis = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [timeZone]);

  return now;
}

export function findCurrentPeriod(periods, minutes) {
  return (
    periods.find(
      (period) => minutes >= toMinutes(period.start) && minutes < toMinutes(period.end)
    ) || null
  );
}

export function findLunchNow(breaks, minutes) {
  const lunch = breaks?.[0];
  if (!lunch?.start || !lunch?.end) return null;
  if (minutes >= toMinutes(lunch.start) && minutes < toMinutes(lunch.end)) return lunch;
  return null;
}

export function findNextPeriod(periods, minutes) {
  return periods.find((period) => toMinutes(period.start) > minutes) || null;
}

export function periodSlots(byDayPeriod, day, periodId) {
  return byDayPeriod.get(`${day}|${periodId}`) || [];
}

function slotsEndMinutes(periods, meta, slots) {
  const lunchAfter = lunchAfterPeriod(meta);
  const lastId = maxPeriodId(meta);
  let end = -Infinity;
  for (const slot of slots) {
    const ids = slotPeriodIds(slot, lunchAfter, lastId);
    const last = periods.find((p) => p.id === ids[ids.length - 1]);
    if (last) end = Math.max(end, toMinutes(last.end));
  }
  return Number.isFinite(end) ? end : null;
}

function slotsStartMinutes(periods, meta, slots) {
  const lunchAfter = lunchAfterPeriod(meta);
  const lastId = maxPeriodId(meta);
  let start = Infinity;
  for (const slot of slots) {
    const ids = slotPeriodIds(slot, lunchAfter, lastId);
    const first = periods.find((p) => p.id === ids[0]);
    if (first) start = Math.min(start, toMinutes(first.start));
  }
  return Number.isFinite(start) ? start : null;
}

function withClassSpan(period, periods, meta, slots) {
  const startMin = slotsStartMinutes(periods, meta, slots);
  const endMin = slotsEndMinutes(periods, meta, slots);
  const start = startMin != null ? periodFromMinutes(startMin) : period.start;
  const end = endMin != null ? periodFromMinutes(endMin) : period.end;
  return { ...period, start, end };
}

function periodFromMinutes(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Current clock period only if that cell has a lecture, lab, or tutorial. */
export function findCurrentOccupied(periods, byDayPeriod, day, minutes) {
  const period = findCurrentPeriod(periods, minutes);
  if (!period) return null;
  return periodSlots(byDayPeriod, day, period.id).length ? period : null;
}

/** Next occupied period after the current class ends (or after `minutes`). */
export function findNextOccupied(periods, byDayPeriod, day, minutes, meta, currentSlots) {
  const after =
    currentSlots?.length && meta
      ? slotsEndMinutes(periods, meta, currentSlots)
      : minutes;
  const cutoff = after == null ? minutes : after;
  return (
    periods.find(
      (period) =>
        toMinutes(period.start) >= cutoff &&
        toMinutes(period.start) > minutes &&
        periodSlots(byDayPeriod, day, period.id).length > 0
    ) || null
  );
}

export function formatIn(minutesFromNow) {
  const wait = formatWait(minutesFromNow);
  return wait === "now" ? "now" : `in ${wait}`;
}

export function countdownParts(minutesFromNow) {
  const mins = Math.max(0, Math.round(minutesFromNow));
  if (mins < 1) return { value: "now", unit: "" };
  if (mins < 60) return { value: String(mins), unit: "min" };
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  if (!rest) return { value: String(hours), unit: hours === 1 ? "hr" : "hrs" };
  return { value: `${hours}h`, unit: `${rest}m` };
}

export function buildLive(data, byDayPeriod, day, minutes) {
  const periods = data.meta.periods;
  const clockPeriod = findCurrentOccupied(periods, byDayPeriod, day, minutes);
  const currentSlots = clockPeriod ? periodSlots(byDayPeriod, day, clockPeriod.id) : [];
  const currentOccupied = clockPeriod
    ? withClassSpan(clockPeriod, periods, data.meta, currentSlots)
    : null;
  const nextPeriod = findNextOccupied(
    periods,
    byDayPeriod,
    day,
    minutes,
    data.meta,
    currentSlots
  );
  const lunch = findLunchNow(data.meta.breaks, minutes);
  const dayHasClasses = periods.some((period) => periodSlots(byDayPeriod, day, period.id).length);
  const progressPeriod = currentOccupied || lunch;
  return {
    currentOccupied,
    currentSlots,
    nextPeriod,
    nextSlots: nextPeriod ? periodSlots(byDayPeriod, day, nextPeriod.id) : [],
    lunchNow: Boolean(lunch),
    lunch,
    nowProgress: progressPeriod ? periodProgress(progressPeriod, minutes) : 0,
    doneToday: dayHasClasses && !currentOccupied && !lunch && !nextPeriod,
    dayHasClasses,
  };
}

export function periodProgress(period, minutes) {
  const start = toMinutes(period.start);
  const end = toMinutes(period.end);
  if (end <= start) return 0;
  return Math.min(1, Math.max(0, (minutes - start) / (end - start)));
}

export function formatWait(minutesFromNow) {
  const mins = Math.max(0, Math.round(minutesFromNow));
  if (mins < 1) return "now";
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}
