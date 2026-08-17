import { countdownParts, formatIn, formatWait, toMinutes } from "./clock.js";
import { describeSlots, formatLiveClass, idleNowLabel } from "./lib.js";
import NowLive from "./NowLive.jsx";

function ChipMeta({ rows }) {
  if (!rows.length) return null;
  const row = rows[0];
  const extra = rows.length > 1 ? ` +${rows.length - 1}` : "";
  return (
    <>
      <strong>{row.title}{extra}</strong>
      <span>
        {[row.type, row.group, row.room, row.who].filter(Boolean).join(" · ")}
      </span>
    </>
  );
}

function Countdown({ minutesFromNow, prefix }) {
  const parts = countdownParts(minutesFromNow);
  const label = prefix === "ends" ? `ends in ${formatWait(minutesFromNow)}` : formatIn(minutesFromNow);
  return (
    <span className="live-countdown" aria-label={label}>
      {prefix === "ends" ? <small>ends</small> : null}
      <em>{parts.value}</em>
      {parts.unit ? <span>{parts.unit}</span> : null}
    </span>
  );
}

export default function LiveStrip({ data, view, live, minutes }) {
  if (!live) return null;

  const nowRows = describeSlots(data, view, live.currentSlots);
  const nextRows = describeSlots(data, view, live.nextSlots);
  const nextWait = live.nextPeriod ? toMinutes(live.nextPeriod.start) - minutes : null;
  const remain = live.currentOccupied ? toMinutes(live.currentOccupied.end) - minutes : null;

  let status;
  if (live.doneToday) {
    status = (
      <div className="live-chip is-done">
        <span>Classes done for today</span>
      </div>
    );
  } else if (!live.dayHasClasses) {
    status = (
      <div className="live-chip is-done">
        <span>No classes scheduled today</span>
      </div>
    );
  } else if (live.lunchNow) {
    status = (
      <div className="live-chip is-lunch">
        <NowLive label="Lunch now" />
      </div>
    );
  } else if (live.currentOccupied) {
    status = (
      <div className="live-chip is-live">
        <NowLive />
        <div className="live-copy">
          <ChipMeta rows={nowRows} />
        </div>
        {remain != null ? <Countdown minutesFromNow={remain} prefix="ends" /> : null}
      </div>
    );
  } else {
    status = (
      <div className="live-chip is-idle">
        <span>{idleNowLabel(view)}</span>
      </div>
    );
  }

  const nextChip =
    live.nextPeriod && nextRows.length ? (
      <div className="live-chip is-next">
        <span className="live-kicker">Up next</span>
        <div className="live-copy">
          <ChipMeta rows={nextRows} />
        </div>
        {nextWait != null ? <Countdown minutesFromNow={nextWait} /> : null}
      </div>
    ) : null;

  return (
    <div className="live-strip" role="status" aria-label={formatLiveClass(data, view, live.nextSlots) || "Live timetable"}>
      {status}
      {nextChip}
    </div>
  );
}
