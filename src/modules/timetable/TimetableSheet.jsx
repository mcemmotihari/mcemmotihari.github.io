import { useState } from "react";
import Grid from "./Grid.jsx";
import LiveStrip from "./LiveStrip.jsx";
import Mapping from "./Mapping.jsx";
import { formatIn, toMinutes } from "./clock.js";
import { signDept } from "./lib.js";

export function TimetableSheet({
  sheetRef,
  college,
  view,
  metaLines,
  data,
  slots,
  rows,
  primaryId,
  today,
  live,
  clockMinutes,
  nowPeriodId,
  clockPeriodId,
  nextPeriodId,
  lunchNow,
  nowProgress,
}) {
  const [highlightKeys, setHighlightKeys] = useState([]);
  const nextWaitLabel =
    live?.nextPeriod && clockMinutes != null
      ? formatIn(toMinutes(live.nextPeriod.start) - clockMinutes)
      : "";

  return (
    <section className="grid-wrap sheet-desktop">
      <article className="sheet" ref={sheetRef}>
        <h2 className="sheet-title">{college}</h2>
        <div className={view === "section" ? "sheet-meta" : "sheet-meta meta-2"}>
          {metaLines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
        <LiveStrip data={data} view={view} live={live} minutes={clockMinutes} />
        <Grid
          data={data}
          view={view}
          slots={slots}
          highlightKeys={highlightKeys}
          onHoverCodes={setHighlightKeys}
          today={today}
          nowPeriodId={nowPeriodId}
          clockPeriodId={clockPeriodId}
          nextPeriodId={nextPeriodId}
          nextWaitLabel={nextWaitLabel}
          lunchNow={lunchNow}
          nowProgress={nowProgress}
        />
        <div className="mapping-wrap">
          <Mapping
            view={view}
            rows={rows}
            highlightKeys={highlightKeys}
            onHoverCodes={setHighlightKeys}
          />
        </div>
        <footer className="sheet-sign">
          <span>Time Table In-Charge</span>
          <span>HOD({signDept(data, view, primaryId)})</span>
          <span>Principal</span>
        </footer>
      </article>
    </section>
  );
}
