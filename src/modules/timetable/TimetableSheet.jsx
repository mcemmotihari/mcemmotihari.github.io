import Grid from "./Grid.jsx";
import Mapping from "./Mapping.jsx";
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
}) {
  return (
    <section className="grid-wrap sheet-desktop">
      <article className="sheet" ref={sheetRef}>
        <h2 className="sheet-title">{college}</h2>
        <div className={view === "section" ? "sheet-meta" : "sheet-meta meta-2"}>
          {metaLines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
        <Grid data={data} view={view} slots={slots} />
        <div className="mapping-wrap">
          <Mapping view={view} rows={rows} />
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
