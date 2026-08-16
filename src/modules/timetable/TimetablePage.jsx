import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StatusMessage } from "../../ui/StatusMessage.jsx";
import { TabList } from "../../ui/TabList.jsx";
import { runViewTransition } from "../../ui/viewTransition.js";
import { COLLEGE_NAME_FULL } from "../../constants/site.js";
import {
  findCurrentPeriod,
  findLunchNow,
  periodProgress,
  useCampusClock,
} from "./clock.js";
import ScheduleCards from "./ScheduleCards.jsx";
import TimetableSkeleton from "./TimetableSkeleton.jsx";
import { TimetableControls } from "./TimetableControls.jsx";
import { TimetableSheet } from "./TimetableSheet.jsx";
import { downloadExcel, downloadPdf } from "./download.js";
import {
  branchOptions,
  groupByDayPeriod,
  mappingRows,
  matchingSlots,
  semesterTabsForBranch,
  sheetMetaLines,
} from "./lib.js";
import { useTimetableData } from "./useTimetable.js";

const VIEW = "section";

export default function TimetablePage() {
  const { data, error } = useTimetableData();
  const [program, setProgram] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [busy, setBusy] = useState("");
  const [downloaded, setDownloaded] = useState(false);
  const sheetRef = useRef(null);
  const doneTimer = useRef(0);

  const branches = useMemo(() => (data ? branchOptions(data) : []), [data]);

  useEffect(() => {
    if (!branches.length) {
      setProgram("");
      return;
    }
    if (!branches.some((branch) => branch.id === program)) {
      setProgram(branches[0].id);
    }
  }, [branches, program]);

  const semesterTabs = useMemo(
    () => (data && program ? semesterTabsForBranch(data, program) : []),
    [data, program]
  );

  useEffect(() => {
    if (!semesterTabs.length) {
      setSectionId("");
      return;
    }
    if (!semesterTabs.some((tab) => tab.id === sectionId)) {
      setSectionId(semesterTabs[0].id);
    }
  }, [semesterTabs, sectionId]);

  const slots = useMemo(
    () => (data ? matchingSlots(data, VIEW, sectionId, "") : []),
    [data, sectionId]
  );
  const byDayPeriod = useMemo(() => groupByDayPeriod(slots), [slots]);
  const rows = useMemo(
    () => (data ? mappingRows(data, VIEW, sectionId, slots) : []),
    [data, sectionId, slots]
  );
  const metaLines = useMemo(
    () => (data ? sheetMetaLines(data, VIEW, sectionId) : []),
    [data, sectionId]
  );

  const clock = useCampusClock(data?.meta?.timezone);
  const liveToday =
    data && data.meta.days.includes(clock.weekday) ? clock.weekday : "";
  const nowPeriod = data && liveToday ? findCurrentPeriod(data.meta.periods, clock.minutes) : null;
  const lunch = data && liveToday ? findLunchNow(data.meta.breaks, clock.minutes) : null;
  const lunchNow = Boolean(lunch);
  const nowProgress = nowPeriod ? periodProgress(nowPeriod, clock.minutes) : lunch ? periodProgress(lunch, clock.minutes) : 0;

  const markDownloaded = useCallback(() => {
    setDownloaded(true);
    window.clearTimeout(doneTimer.current);
    doneTimer.current = window.setTimeout(() => setDownloaded(false), 1600);
  }, []);

  useEffect(() => () => window.clearTimeout(doneTimer.current), []);

  const onExcel = useCallback(async () => {
    if (!data || !sectionId) return;
    setBusy("xlsx");
    try {
      await downloadExcel({
        data,
        view: VIEW,
        primaryId: sectionId,
        slots,
        byDayPeriod,
      });
    } catch (err) {
      console.error(err);
      alert(`Could not download Excel: ${err.message}`);
      return;
    } finally {
      setBusy("");
    }
    markDownloaded();
  }, [data, sectionId, slots, byDayPeriod, markDownloaded]);

  const onPdf = useCallback(async () => {
    if (!data || !sectionId || !sheetRef.current) return;
    setBusy("pdf");
    try {
      await downloadPdf(sheetRef.current, data, VIEW, sectionId);
    } catch (err) {
      console.error(err);
      alert(`Could not download PDF: ${err.message}`);
      return;
    } finally {
      setBusy("");
    }
    markDownloaded();
  }, [data, sectionId, markDownloaded]);

  if (error) {
    return (
      <StatusMessage tone="error">Could not load timetable data: {error}</StatusMessage>
    );
  }
  if (!data) {
    return <TimetableSkeleton />;
  }

  const college = (data.meta.college || COLLEGE_NAME_FULL).toUpperCase();

  return (
    <div className="page-body">
      <TimetableControls
        program={program}
        onProgramChange={(next) => runViewTransition(() => setProgram(next))}
        branches={branches}
        busy={busy}
        downloaded={downloaded}
        onExcel={onExcel}
        onPdf={onPdf}
      />

      {sectionId ? (
        <div className="tt-stage">
          {semesterTabs.length ? (
            <TabList
              variant="pages"
              label="Semester"
              items={semesterTabs}
              value={sectionId}
              onChange={(next) => runViewTransition(() => setSectionId(next))}
            />
          ) : null}
          <ScheduleCards data={data} view={VIEW} slots={slots} clock={clock} />
          <TimetableSheet
            sheetRef={sheetRef}
            college={college}
            view={VIEW}
            metaLines={metaLines}
            data={data}
            slots={slots}
            rows={rows}
            primaryId={sectionId}
            today={liveToday}
            nowPeriodId={nowPeriod?.id ?? null}
            lunchNow={lunchNow}
            nowProgress={nowProgress}
          />
        </div>
      ) : (
        <StatusMessage>Select a branch to view its timetable.</StatusMessage>
      )}
    </div>
  );
}
