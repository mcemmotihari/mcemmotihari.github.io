import {
  DAY_NAMES,
  LUNCH_LETTERS,
  clockRange,
  groupByDayPeriod,
  roomLine,
  subjectLine,
} from "./lib.js";

export default function Grid({ data, view, slots }) {
  const days = data.meta.days;
  const periods = data.meta.periods;
  const lunchAfter = data.meta.breaks?.[0]?.after_period ?? 3;
  const withRooms = view === "section";
  const byDayPeriod = groupByDayPeriod(slots);

  return (
    <div className="table-scroll">
      <table className="excel-tt">
        <thead>
          <tr>
            <th className="corner" rowSpan={2}>
              Period, Time &amp; Days
            </th>
            {periods.flatMap((p) => {
              const cells = [<th key={p.id}>{p.label}</th>];
              if (p.id === lunchAfter) {
                cells.push(<th key="lunch-h" className="lunch-head" rowSpan={2} />);
              }
              return cells;
            })}
          </tr>
          <tr className="time-row">
            {periods.map((p) => (
              <th key={p.id}>{clockRange(p.start, p.end)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day, di) => {
            const lunch = LUNCH_LETTERS[di] ?? "";
            const subjCells = [];
            periods.forEach((p) => {
              const list = byDayPeriod.get(`${day}|${p.id}`) || [];
              const line = list.length ? subjectLine(data, list, view) : "";
              subjCells.push(
                <td key={`${day}-s-${p.id}`} className="subj">
                  {line}
                </td>
              );
              if (p.id === lunchAfter) {
                subjCells.push(
                  <td
                    key={`${day}-lunch`}
                    className="lunch"
                    rowSpan={withRooms ? 2 : undefined}
                  >
                    {lunch}
                  </td>
                );
              }
            });

            if (!withRooms) {
              return (
                <tr key={day}>
                  <th className="day">{DAY_NAMES[day] || day}</th>
                  {subjCells}
                </tr>
              );
            }

            return (
              <DayRows
                key={day}
                day={day}
                subjCells={subjCells}
                periods={periods}
                byDayPeriod={byDayPeriod}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DayRows({ day, subjCells, periods, byDayPeriod }) {
  return (
    <>
      <tr>
        <th className="day" rowSpan={2}>
          {DAY_NAMES[day] || day}
        </th>
        {subjCells}
      </tr>
      <tr>
        {periods.map((p) => {
          const list = byDayPeriod.get(`${day}|${p.id}`) || [];
          const line = list.length ? roomLine(list) : "";
          return (
            <td key={`${day}-r-${p.id}`} className="room">
              {line}
            </td>
          );
        })}
      </tr>
    </>
  );
}
