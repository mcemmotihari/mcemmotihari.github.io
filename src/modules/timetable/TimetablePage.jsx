import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useStaffAuth } from "../../auth/StaffAuth.jsx";
import { pathForTimetableView, timetableViewFromPath } from "../../auth/staff.js";
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
import Tools from "./Tools.jsx";
import TimetableSkeleton from "./TimetableSkeleton.jsx";
import { TimetableControls } from "./TimetableControls.jsx";
import { TimetableSheet } from "./TimetableSheet.jsx";
import { downloadExcel, downloadPdf } from "./download.js";
import {
  branchOptions,
  groupByDayPeriod,
  mappingRows,
  matchingSlots,
  selectorOptions,
  semesterTabsForBranch,
  sheetMetaLines,
} from "./lib.js";
import { useTimetableData } from "./useTimetable.js";

const STAFF_VIEWS = [
  { id: "section", label: "Class" },
  { id: "faculty", label: "Faculty" },
  { id: "room", label: "Room" },
  { id: "tools", label: "Tools" },
];

export default function TimetablePage() {
  const { data, error } = useTimetableData();
  const { signedIn, loginOpen, openLogin } = useStaffAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const requested = timetableViewFromPath(pathname);
  const view = signedIn ? requested : "section";

  const [program, setProgram] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [busy, setBusy] = useState("");
  const [downloaded, setDownloaded] = useState(false);
  const sheetRef = useRef(null);
  const doneTimer = useRef(0);

  useEffect(() => {
    if (signedIn || requested === "section" || loginOpen) return;
    openLogin();
  }, [signedIn, requested, loginOpen, openLogin]);

  const branches = useMemo(() => (data ? branchOptions(data) : []), [data]);
  const facultyOptions = useMemo(
    () => (data ? selectorOptions(data, "faculty", "") : []),
    [data]
  );
  const roomOptions = useMemo(() => (data ? selectorOptions(data, "room", "") : []), [data]);

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

  useEffect(() => {
    if (!facultyOptions.length) {
      setFacultyId("");
      return;
    }
    if (!facultyOptions.some((row) => row.id === facultyId)) {
      setFacultyId(facultyOptions[0].id);
    }
  }, [facultyOptions, facultyId]);

  useEffect(() => {
    if (!roomOptions.length) {
      setRoomId("");
      return;
    }
    if (!roomOptions.some((row) => row.id === roomId)) {
      setRoomId(roomOptions[0].id);
    }
  }, [roomOptions, roomId]);

  const primaryId = view === "faculty" ? facultyId : view === "room" ? roomId : sectionId;
  const primaryOptions = view === "faculty" ? facultyOptions : roomOptions;

  const slots = useMemo(
    () => (data && view !== "tools" ? matchingSlots(data, view, primaryId, "") : []),
    [data, view, primaryId]
  );
  const byDayPeriod = useMemo(() => groupByDayPeriod(slots), [slots]);
  const rows = useMemo(
    () => (data && view !== "tools" ? mappingRows(data, view, primaryId, slots) : []),
    [data, view, primaryId, slots]
  );
  const metaLines = useMemo(
    () => (data && view !== "tools" ? sheetMetaLines(data, view, primaryId) : []),
    [data, view, primaryId]
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
    if (!data || !primaryId || view === "tools") return;
    setBusy("xlsx");
    try {
      await downloadExcel({
        data,
        view,
        primaryId,
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
  }, [data, view, primaryId, slots, byDayPeriod, markDownloaded]);

  const onPdf = useCallback(async () => {
    if (!data || !primaryId || view === "tools" || !sheetRef.current) return;
    setBusy("pdf");
    try {
      await downloadPdf(sheetRef.current, data, view, primaryId);
    } catch (err) {
      console.error(err);
      alert(`Could not download PDF: ${err.message}`);
      return;
    } finally {
      setBusy("");
    }
    markDownloaded();
  }, [data, view, primaryId, markDownloaded]);

  const setView = useCallback(
    (next) => {
      runViewTransition(() => navigate(pathForTimetableView(next)));
    },
    [navigate]
  );

  if (error) {
    return (
      <StatusMessage tone="error">Could not load timetable data: {error}</StatusMessage>
    );
  }
  if (!data) {
    return <TimetableSkeleton />;
  }

  const college = (data.meta.college || COLLEGE_NAME_FULL).toUpperCase();
  const showSheet = view !== "tools" && Boolean(primaryId);

  return (
    <div className="page-body">
      {signedIn ? (
        <TabList
          label="Timetable view"
          items={STAFF_VIEWS}
          value={view}
          onChange={setView}
        />
      ) : null}

      <TimetableControls
        view={view}
        program={program}
        onProgramChange={(next) => runViewTransition(() => setProgram(next))}
        branches={branches}
        primaryId={primaryId}
        onPrimaryChange={(next) =>
          runViewTransition(() => {
            if (view === "faculty") setFacultyId(next);
            else setRoomId(next);
          })
        }
        primaryOptions={primaryOptions}
        busy={busy}
        downloaded={downloaded}
        onExcel={onExcel}
        onPdf={onPdf}
      />

      {view === "tools" ? (
        <Tools data={data} />
      ) : showSheet ? (
        <div className="tt-stage">
          {view === "section" && semesterTabs.length ? (
            <TabList
              variant="pages"
              label="Semester"
              items={semesterTabs}
              value={sectionId}
              onChange={(next) => runViewTransition(() => setSectionId(next))}
            />
          ) : null}
          <ScheduleCards data={data} view={view} slots={slots} clock={clock} />
          <TimetableSheet
            sheetRef={sheetRef}
            college={college}
            view={view}
            metaLines={metaLines}
            data={data}
            slots={slots}
            rows={rows}
            primaryId={primaryId}
            today={liveToday}
            nowPeriodId={nowPeriod?.id ?? null}
            lunchNow={lunchNow}
            nowProgress={nowProgress}
          />
        </div>
      ) : (
        <StatusMessage>
          {view === "section"
            ? "Select a branch to view its timetable."
            : `Select a ${view} to view its timetable.`}
        </StatusMessage>
      )}
    </div>
  );
}
