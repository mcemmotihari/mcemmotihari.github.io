import { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "../../ui/Button.jsx";
import { StatusMessage } from "../../ui/StatusMessage.jsx";
import { TabList } from "../../ui/TabList.jsx";
import { COLLEGE_NAME_FULL } from "../../constants/site.js";
import ScheduleCards from "./ScheduleCards.jsx";
import Tools from "./Tools.jsx";
import { TimetableControls, TIMETABLE_VIEWS } from "./TimetableControls.jsx";
import { TimetableSheet } from "./TimetableSheet.jsx";
import { downloadExcel, downloadPdf } from "./download.js";
import {
  groupByDayPeriod,
  mappingRows,
  matchingSlots,
  selectorOptions,
  sheetMetaLines,
} from "./lib.js";
import { usePrimaryId, useTimetableData } from "./useTimetable.js";

export default function TimetablePage() {
  const { data, error } = useTimetableData();
  const [view, setView] = useState("section");
  const [dept, setDept] = useState("");
  const [busy, setBusy] = useState("");
  const [showMore, setShowMore] = useState(false);
  const sheetRef = useRef(null);

  const depts = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.sections.map((s) => s.department).filter(Boolean))].sort();
  }, [data]);

  const options = useMemo(() => {
    if (!data || view === "tools") return [];
    return selectorOptions(data, view, dept);
  }, [data, view, dept]);

  const [primaryId, setPrimaryId] = usePrimaryId(options);

  const slots = useMemo(
    () => (data ? matchingSlots(data, view, primaryId, dept) : []),
    [data, view, primaryId, dept]
  );
  const byDayPeriod = useMemo(() => groupByDayPeriod(slots), [slots]);
  const rows = useMemo(
    () => (data ? mappingRows(data, view, primaryId, slots) : []),
    [data, view, primaryId, slots]
  );
  const metaLines = useMemo(
    () => (data ? sheetMetaLines(data, view, primaryId) : []),
    [data, view, primaryId]
  );

  const onExcel = useCallback(async () => {
    if (view === "tools" || !data) return;
    setBusy("xlsx");
    try {
      await downloadExcel({ data, view, primaryId, slots, byDayPeriod });
    } catch (err) {
      console.error(err);
      alert(`Could not download Excel: ${err.message}`);
    } finally {
      setBusy("");
    }
  }, [data, view, primaryId, slots, byDayPeriod]);

  const onPdf = useCallback(async () => {
    if (view === "tools" || !sheetRef.current || !data) return;
    setBusy("pdf");
    try {
      await downloadPdf(sheetRef.current, data, view, primaryId);
    } catch (err) {
      console.error(err);
      alert(`Could not download PDF: ${err.message}`);
    } finally {
      setBusy("");
    }
  }, [data, view, primaryId]);

  if (error) {
    return (
      <StatusMessage tone="error">Could not load timetable data: {error}</StatusMessage>
    );
  }
  if (!data) {
    return <StatusMessage className="tt-loading">Loading timetable…</StatusMessage>;
  }

  const college = (data.meta.college || COLLEGE_NAME_FULL).toUpperCase();
  const showGrid = view !== "tools";

  return (
    <div className="page-body">
      {showMore ? (
        <TabList
          label="Timetable view"
          items={TIMETABLE_VIEWS}
          value={view}
          onChange={setView}
        />
      ) : null}

      {showGrid ? (
        <TimetableControls
          view={view}
          primaryId={primaryId}
          onPrimaryChange={setPrimaryId}
          options={options}
          showMore={showMore}
          dept={dept}
          onDeptChange={setDept}
          depts={depts}
          busy={busy}
          onExcel={onExcel}
          onPdf={onPdf}
          onToggleMore={() => setShowMore((open) => !open)}
        />
      ) : null}

      {!showGrid ? (
        <div className="tools-toolbar">
          <Button
            variant="ghost"
            className="more-toggle"
            onClick={() => {
              setView("section");
              setShowMore(false);
            }}
          >
            Back to class
          </Button>
        </div>
      ) : null}

      {showGrid ? (
        <>
          <ScheduleCards data={data} view={view} slots={slots} />
          <TimetableSheet
            sheetRef={sheetRef}
            college={college}
            view={view}
            metaLines={metaLines}
            data={data}
            slots={slots}
            rows={rows}
            primaryId={primaryId}
          />
        </>
      ) : (
        <Tools data={data} />
      )}
    </div>
  );
}
