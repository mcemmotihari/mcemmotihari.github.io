import { useEffect, useMemo, useRef, useState } from "react";
import Grid from "./Grid.jsx";
import Mapping from "./Mapping.jsx";
import Tools from "./Tools.jsx";
import { downloadExcel, downloadPdf } from "./download.js";
import {
  DATA_URL,
  groupByDayPeriod,
  mappingRows,
  matchingSlots,
  selectionLabel,
  selectorOptions,
  sheetMetaLines,
  signDept,
} from "./lib.js";

const VIEWS = [
  { id: "section", label: "Class" },
  { id: "faculty", label: "Faculty" },
  { id: "room", label: "Room" },
  { id: "tools", label: "Tools" },
];

export default function TimetablePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [view, setView] = useState("section");
  const [primaryId, setPrimaryId] = useState("");
  const [dept, setDept] = useState("");
  const [busy, setBusy] = useState("");
  const sheetRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetch(DATA_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${DATA_URL}`);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const depts = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.sections.map((s) => s.department).filter(Boolean))].sort();
  }, [data]);

  const options = useMemo(() => {
    if (!data || view === "tools") return [];
    return selectorOptions(data, view, dept);
  }, [data, view, dept]);

  useEffect(() => {
    if (!options.length) {
      setPrimaryId("");
      return;
    }
    if (!options.some((o) => o.id === primaryId)) {
      setPrimaryId(options[0].id);
    }
  }, [options, primaryId]);

  if (error) {
    return <p className="load-err">Could not load timetable data: {error}</p>;
  }
  if (!data) {
    return <p className="brand-sub">Loading timetable…</p>;
  }

  const wef = data.sections.map((s) => s.wef).find(Boolean) || "";
  const slots = matchingSlots(data, view, primaryId, dept);
  const byDayPeriod = groupByDayPeriod(slots);
  const rows = mappingRows(data, view, primaryId, slots);
  const metaLines = sheetMetaLines(data, view, primaryId);
  const college = (data.meta.college || "Motihari College of Engineering, Motihari").toUpperCase();

  async function onExcel() {
    if (view === "tools") return;
    setBusy("xlsx");
    try {
      await downloadExcel({ data, view, primaryId, slots, byDayPeriod });
    } catch (err) {
      console.error(err);
      alert(`Could not download Excel: ${err.message}`);
    } finally {
      setBusy("");
    }
  }

  async function onPdf() {
    if (view === "tools" || !sheetRef.current) return;
    setBusy("pdf");
    try {
      await downloadPdf(sheetRef.current, data, view, primaryId);
    } catch (err) {
      console.error(err);
      alert(`Could not download PDF: ${err.message}`);
    } finally {
      setBusy("");
    }
  }

  const showGrid = view !== "tools";

  return (
    <>
      <p className="brand-sub">
        {data.meta.college_short || data.meta.college} · {data.slots.length} slots · w.e.f. {wef}
      </p>

      <nav className="view-tabs" role="tablist" aria-label="Timetable view" style={{ margin: "0.8rem 0 1rem" }}>
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            className={`tab${view === v.id ? " is-active" : ""}`}
            role="tab"
            aria-selected={view === v.id}
            onClick={() => setView(v.id)}
          >
            {v.label}
          </button>
        ))}
      </nav>

      {showGrid && (
        <section className="controls">
          <label className="field">
            <span>{view === "section" ? "Section" : view === "faculty" ? "Faculty" : "Room / Lab"}</span>
            <select value={primaryId} onChange={(e) => setPrimaryId(e.target.value)}>
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field field-narrow">
            <span>Department</span>
            <select value={dept} onChange={(e) => setDept(e.target.value)}>
              <option value="">All</option>
              {depts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <div className="download-actions">
            <button type="button" className="dl-btn" onClick={onExcel} disabled={!!busy}>
              Download Excel
            </button>
            <button type="button" className="dl-btn dl-btn-ghost" onClick={onPdf} disabled={!!busy}>
              Download PDF
            </button>
          </div>
          <p className="hint">{selectionLabel(data, view, primaryId) || "No selection"}</p>
        </section>
      )}

      {showGrid ? (
        <section className="grid-wrap">
          <article className="sheet" ref={sheetRef}>
            <h2 className="sheet-title">{college}</h2>
            <div className={`sheet-meta${view === "section" ? "" : " meta-2"}`}>
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
      ) : (
        <Tools data={data} />
      )}
    </>
  );
}
