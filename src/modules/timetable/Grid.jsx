import { useMemo } from "react";
import { cx } from "../../ui/cx.js";
import NowLive, { NowProgress } from "./NowLive.jsx";
import {
  DAY_NAMES,
  LUNCH_LETTERS,
  clockRange,
  groupByDayPeriod,
  roomLine,
  slotTypeClass,
  slotsMatchCodes,
  slotSubjectCodes,
  subjectLine,
} from "./lib.js";

export default function Grid({
  data,
  view,
  slots,
  highlightKeys,
  onHoverCodes,
  today,
  nowPeriodId,
  lunchNow,
  nowProgress = 0,
}) {
  const days = data.meta.days;
  const periods = data.meta.periods;
  const lunchAfter = data.meta.breaks?.[0]?.after_period ?? 3;
  const withRooms = view === "section";
  const byDayPeriod = useMemo(() => groupByDayPeriod(slots), [slots]);

  function hoverList(list) {
    onHoverCodes?.(list.length ? slotSubjectCodes(list) : []);
  }

  return (
    <div className="table-scroll">
      <table className="excel-tt">
        <thead>
          <tr>
            <th className="corner" rowSpan={2}>
              Period, Time &amp; Days
            </th>
            {periods.flatMap((p) => {
              const cells = [
                <th key={p.id} className={cx(p.id === nowPeriodId && "is-now")}>
                  {p.label}
                </th>,
              ];
              if (p.id === lunchAfter) {
                cells.push(
                  <th
                    key="lunch-h"
                    className={cx("lunch-head", lunchNow && "is-now")}
                    rowSpan={2}
                  />
                );
              }
              return cells;
            })}
          </tr>
          <tr className="time-row">
            {periods.map((p) => (
              <th key={p.id} className={cx(p.id === nowPeriodId && "is-now")}>
                {clockRange(p.start, p.end)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day, di) => {
            const lunch = LUNCH_LETTERS[di] ?? "";
            const isToday = day === today;
            const subjCells = [];
            periods.forEach((p) => {
              const list = byDayPeriod.get(`${day}|${p.id}`) || [];
              const line = list.length ? subjectLine(data, list, view) : "";
              const isNowCell = isToday && p.id === nowPeriodId;
              subjCells.push(
                <td
                  key={`${day}-s-${p.id}`}
                  className={cx(
                    "subj",
                    slotTypeClass(list),
                    slotsMatchCodes(list, highlightKeys) && "is-linked",
                    isNowCell && "is-now"
                  )}
                  onMouseEnter={() => hoverList(list)}
                  onMouseLeave={() => onHoverCodes?.([])}
                >
                  {line}
                  {isNowCell ? <NowLive /> : null}
                  {isNowCell ? <NowProgress value={nowProgress} /> : null}
                </td>
              );
              if (p.id === lunchAfter) {
                subjCells.push(
                  <td
                    key={`${day}-lunch`}
                    className={cx("lunch", isToday && lunchNow && "is-now")}
                    rowSpan={withRooms ? 2 : undefined}
                  >
                    {lunch}
                    {isToday && lunchNow ? <NowProgress value={nowProgress} /> : null}
                  </td>
                );
              }
            });

            if (!withRooms) {
              return (
                <tr key={day} className={cx(isToday && "is-today-row")}>
                  <th className={cx("day", isToday && "is-today")}>{DAY_NAMES[day] || day}</th>
                  {subjCells}
                </tr>
              );
            }

            return (
              <DayRows
                key={day}
                day={day}
                isToday={isToday}
                nowPeriodId={nowPeriodId}
                subjCells={subjCells}
                periods={periods}
                byDayPeriod={byDayPeriod}
                highlightKeys={highlightKeys}
                hoverList={hoverList}
                onHoverCodes={onHoverCodes}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DayRows({
  day,
  isToday,
  nowPeriodId,
  subjCells,
  periods,
  byDayPeriod,
  highlightKeys,
  hoverList,
  onHoverCodes,
}) {
  return (
    <>
      <tr className={cx(isToday && "is-today-row")}>
        <th className={cx("day", isToday && "is-today")} rowSpan={2}>
          {DAY_NAMES[day] || day}
        </th>
        {subjCells}
      </tr>
      <tr className={cx("room-row", isToday && "is-today-row")}>
        {periods.map((p) => {
          const list = byDayPeriod.get(`${day}|${p.id}`) || [];
          const line = list.length ? roomLine(list) : "";
          return (
            <td
              key={`${day}-r-${p.id}`}
              className={cx(
                "room",
                slotsMatchCodes(list, highlightKeys) && "is-linked",
                isToday && p.id === nowPeriodId && "is-now"
              )}
              onMouseEnter={() => hoverList(list)}
              onMouseLeave={() => onHoverCodes?.([])}
            >
              {line}
            </td>
          );
        })}
      </tr>
    </>
  );
}
