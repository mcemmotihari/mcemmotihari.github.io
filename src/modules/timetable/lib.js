export const DATA_URL = "/data/timetable.json";

export const DAY_NAMES = {
  MON: "MONDAY",
  TUE: "TUESDAY",
  WED: "WEDNESDAY",
  THU: "THURSDAY",
  FRI: "FRIDAY",
  SAT: "SATURDAY",
};

export const SEM_ROMAN = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 7: "VII", 8: "VIII" };
export const SEM_ORD = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th", 5: "5th", 6: "6th", 7: "7th", 8: "8th" };
export const LUNCH_LETTERS = ["L", "U", "N", "C", "H", ""];

export function sectionOf(data, id) {
  return data.sections.find((s) => s.id === id);
}

export function subjectOf(data, code) {
  return data.subjects.find((s) => s.code === code);
}

export function facultyOf(data, id) {
  return data.faculties.find((f) => f.id === id);
}

export function toClock(hhmm) {
  const [h, m] = String(hhmm).split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function clockRange(start, end) {
  return `${toClock(start)} to ${toClock(end)}`;
}

export function slotTypeLabel(type) {
  if (type === "P") return "Lab";
  if (type === "T") return "Tutorial";
  return "Lecture";
}

export function slotTitle(data, slot) {
  const sub = subjectOf(data, slot.subject_code);
  return slot.subject_short || sub?.short || slot.subject_code || "Class";
}

export function slotCounterpart(data, view, slot) {
  const fac = facultyOf(data, slot.faculty_id);
  const sec = sectionOf(data, slot.section_id);
  if (view === "section") return fac?.name || "";
  if (view === "faculty") return sec?.label || "";
  return [sec?.label, fac?.name].filter(Boolean).join(" · ");
}

export function describeSlots(data, view, slots) {
  return (slots || []).map((slot) => ({
    title: slotTitle(data, slot),
    type: slotTypeLabel(slot.type),
    group: slot.group ? `Group ${slot.group}` : "",
    room: view === "room" ? "" : slot.room_id ? `Room ${slot.room_id}` : "",
    who: slotCounterpart(data, view, slot),
  }));
}

export function formatLiveClass(data, view, slots) {
  return describeSlots(data, view, slots)
    .map((row) => [row.title, row.type, row.group, row.room, row.who].filter(Boolean).join(" · "))
    .join(" / ");
}

export function idleNowLabel(view) {
  if (view === "faculty") return "No class now";
  if (view === "room") return "Room vacant";
  return "Free period";
}

export function paperCode(sub) {
  if (!sub?.code) return "";
  const p = Number(sub.P);
  return p > 0 ? `${sub.code}(+P)` : sub.code;
}

export function ltpText(sub) {
  if (!sub) return "-";
  const empty = (v) => v === undefined || v === null || v === "";
  if (empty(sub.L) && empty(sub.T) && empty(sub.P)) return "-";
  return `${sub.L || 0}-${sub.T || 0}-${sub.P || 0}`;
}

export function branchTag(section) {
  if (!section) return "";
  return section.program === "CSE-AI" ? "AI" : section.program;
}

export function sectionTag(section) {
  if (!section) return "";
  const ord = SEM_ORD[Number(section.semester)] || String(section.semester);
  return `${ord}/${branchTag(section)}`;
}

export function subjectLine(data, slots, view) {
  return slots
    .map((s) => {
      const short = s.subject_short || s.subject_code || "";
      const tag = sectionTag(sectionOf(data, s.section_id));
      if (view === "section") {
        if (s.type === "P") return `${short} LAB${s.group ? ` ${s.group}` : ""}`;
        if (s.type === "T") return `${short}(T)`;
        return short;
      }
      if (view === "faculty") {
        if (s.type === "P") return `${short} LAB${s.group ? ` ${s.group}` : ""}(${tag})`;
        if (s.type === "T") return `${short}(T)(${tag})`;
        return `${short}(${tag})`;
      }
      if (s.type === "P") return `${short}(${tag}) LAB${s.group ? ` ${s.group}` : ""}`;
      if (s.type === "T") return `${short}(T)(${tag})`;
      return `${short}(${tag})`;
    })
    .join(" / ");
}

export function roomLine(slots) {
  const rooms = slots.map((s) => s.room_id || "");
  if (rooms.every((r) => !r)) return "";
  if (rooms.length === 1) return `Room No - ${rooms[0]}`;
  return `Room No. - ${rooms.join(" / ")}`;
}

export function filteredSections(data, dept) {
  return data.sections.filter((s) => !dept || s.department === dept);
}

export function matchingSlots(data, view, primaryId, dept) {
  return data.slots.filter((s) => {
    if (dept && s.department !== dept) return false;
    if (view === "section") return s.section_id === primaryId;
    if (view === "faculty") return s.faculty_id === primaryId;
    if (view === "room") return s.room_id === primaryId;
    return false;
  });
}

export function slotHours(slot) {
  const n = Number(slot?.hours);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}

export function lunchAfterPeriod(meta) {
  return meta?.breaks?.[0]?.after_period ?? 3;
}

export function maxPeriodId(meta) {
  return Math.max(0, ...(meta?.periods || []).map((p) => p.id));
}

/** Period ids this slot occupies (does not cross lunch). */
export function slotPeriodIds(slot, lunchAfter, lastPeriodId) {
  const start = Number(slot.period);
  const ids = [];
  for (let i = 0; i < slotHours(slot); i += 1) {
    const id = start + i;
    if (lastPeriodId && id > lastPeriodId) break;
    if (start <= lunchAfter && id > lunchAfter) break;
    ids.push(id);
  }
  return ids.length ? ids : [start];
}

export function groupByDayPeriod(slots) {
  const map = new Map();
  for (const s of slots) {
    const key = `${s.day}|${s.period}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(s);
  }
  return map;
}

/** Slots covering each day+period, including multi-hour continuations. */
export function occupyByDayPeriod(slots, meta) {
  const lunchAfter = lunchAfterPeriod(meta);
  const lastId = maxPeriodId(meta);
  const map = new Map();
  for (const s of slots) {
    for (const pid of slotPeriodIds(s, lunchAfter, lastId)) {
      const key = `${s.day}|${pid}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    }
  }
  return map;
}

export function slotPeriodLabel(periods, slot, meta) {
  const ids = slotPeriodIds(slot, lunchAfterPeriod(meta), maxPeriodId(meta));
  const labels = ids.map((id) => periods.find((p) => p.id === id)?.label).filter(Boolean);
  if (labels.length <= 1) return labels[0] || "";
  return `${labels[0]}–${labels[labels.length - 1]}`;
}

export function slotClockRange(periods, slot, meta) {
  const ids = slotPeriodIds(slot, lunchAfterPeriod(meta), maxPeriodId(meta));
  const first = periods.find((p) => p.id === ids[0]);
  const last = periods.find((p) => p.id === ids[ids.length - 1]) || first;
  if (!first || !last) return "";
  return clockRange(first.start, last.end);
}

/**
 * Walk a day's columns. Multi-hour classes become one cell with colspan;
 * continuation periods are omitted. Lunch is still emitted after its period.
 */
export function iterateDayColumns(periods, meta, startMap, day) {
  const lunchAfter = lunchAfterPeriod(meta);
  const lastId = maxPeriodId(meta);
  const skip = new Set();
  const cols = [];
  for (const period of periods) {
    if (!skip.has(period.id)) {
      const slots = startMap.get(`${day}|${period.id}`) || [];
      let colspan = 1;
      if (slots.length) {
        const spans = slots.map((s) => slotPeriodIds(s, lunchAfter, lastId).length);
        if (spans.every((h) => h === spans[0])) colspan = Math.max(1, spans[0]);
      }
      for (let i = 1; i < colspan; i += 1) skip.add(period.id + i);
      cols.push({ kind: "period", period, slots, colspan });
    }
    if (period.id === lunchAfter) cols.push({ kind: "lunch" });
  }
  return cols;
}

export function slotSubjectCodes(slots) {
  return [...new Set(slots.map((s) => s.subject_code).filter(Boolean))];
}

export function slotTypeClass(slots) {
  if (!slots.length) return "";
  const types = [...new Set(slots.map((s) => s.type || "L"))];
  if (types.length === 1) return `cell-${types[0]}`;
  return "cell-mix";
}

export function slotsMatchCodes(slots, codes) {
  if (!codes?.length) return false;
  return slots.some((s) => codes.includes(s.subject_code));
}

export function mappingRows(data, view, primaryId, slots) {
  if (view === "section") {
    return data.offerings
      .filter((o) => o.section_id === primaryId)
      .map((o) => {
        const sub = subjectOf(data, o.subject_code) || {};
        const fac = facultyOf(data, o.faculty_id);
        return {
          subjectCode: o.subject_code,
          code: paperCode(sub) || o.subject_code,
          ltp: ltpText(sub),
          subject: sub.name || "",
          short: sub.short || "",
          faculty: fac?.name || "",
        };
      });
  }

  if (view === "faculty") {
    return data.offerings
      .filter((o) => o.faculty_id === primaryId)
      .map((o) => {
        const sub = subjectOf(data, o.subject_code) || {};
        const sec = sectionOf(data, o.section_id);
        return {
          subjectCode: o.subject_code,
          code: paperCode(sub) || o.subject_code,
          ltp: ltpText(sub),
          subject: sub.name || "",
          short: `${sub.short || ""}(${sectionTag(sec)})`,
          branch: sec?.program || "",
          semester: SEM_ROMAN[Number(sec?.semester)] || "",
        };
      });
  }

  const seen = new Set();
  const rows = [];
  for (const s of slots) {
    const key = `${s.section_id}|${s.subject_code}`;
    if (seen.has(key) || !s.subject_code) continue;
    seen.add(key);
    const sub = subjectOf(data, s.subject_code) || {};
    const sec = sectionOf(data, s.section_id);
    const off = data.offerings.find(
      (o) => o.section_id === s.section_id && o.subject_code === s.subject_code
    );
    const fac = facultyOf(data, off?.faculty_id || s.faculty_id);
    rows.push({
      subjectCode: s.subject_code,
      code: paperCode(sub) || s.subject_code,
      ltp: ltpText(sub),
      subject: sub.name || "",
      short: `${sub.short || s.subject_short || ""}(${sectionTag(sec)})`,
      faculty: fac?.name || s.faculty_name || "",
      branch: sec?.program || "",
      semester: SEM_ROMAN[Number(sec?.semester)] || "",
    });
  }
  return rows;
}

export function sheetMetaLines(data, view, primaryId) {
  if (view === "section") {
    const sec = sectionOf(data, primaryId);
    const sem = SEM_ROMAN[Number(sec?.semester)] || sec?.semester || "";
    return [
      `A.Y :- ${sec?.academic_year || ""}`,
      `Branch :- ${sec?.program || ""}`,
      `Semester :- ${sem}`,
      `Session :- ${sec?.batch_session || ""}`,
      `w.e.f :- ${sec?.wef || ""}`,
    ];
  }
  const wef = data.sections.map((s) => s.wef).find(Boolean) || "";
  if (view === "faculty") {
    const fac = facultyOf(data, primaryId);
    return [`Faculty Name :- ${fac?.name || ""}`, `w.e.f :- ${wef}`];
  }
  const room = data.rooms.find((r) => r.id === primaryId);
  return [`Room Number :- ${room?.id || ""}`, `w.e.f :- ${wef}`];
}

export function signDept(data, view, primaryId) {
  if (view === "section") return sectionOf(data, primaryId)?.department || "CSE";
  return "CSE";
}

export function downloadName(data, view, primaryId) {
  const raw =
    view === "section"
      ? sectionOf(data, primaryId)?.label
      : view === "faculty"
        ? facultyOf(data, primaryId)?.name
        : data.rooms.find((r) => r.id === primaryId)?.name;
  const slug = String(raw || view)
    .replace(/[^\w]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "timetable"}-${view}`;
}

/**
 * Distinct academic programmes (branches) for the branch dropdown.
 * @return {Array<{id: string, label: string}>}
 */
export function branchOptions(data) {
  const seen = new Map();
  for (const section of data.sections) {
    const id = section.program;
    if (!id || seen.has(id)) continue;
    seen.set(id, section.program_name || id);
  }
  return [...seen.entries()]
    .map(([id, label]) => ({ id, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Sections of one branch, oldest semester first.
 * @return {Array<{id: string, label: string, semester: number}>}
 */
export function semesterTabsForBranch(data, program) {
  return data.sections
    .filter((section) => section.program === program)
    .sort((a, b) => Number(a.semester) - Number(b.semester))
    .map((section) => {
      const sem = Number(section.semester);
      const ord = SEM_ORD[sem] || String(section.semester);
      return {
        id: section.id,
        label: `${ord} Sem`,
        semester: sem,
      };
    });
}

export function selectorOptions(data, view, dept) {
  if (view === "section") {
    return filteredSections(data, dept).map((s) => ({
      id: s.id,
      label: `${s.label} (${s.academic_year})`,
    }));
  }
  if (view === "faculty") {
    const ids = new Set(
      data.slots
        .filter((s) => !dept || s.department === dept)
        .map((s) => s.faculty_id)
        .filter(Boolean)
    );
    return data.faculties.filter((f) => ids.has(f.id)).map((f) => ({ id: f.id, label: f.name }));
  }
  const ids = new Set(
    data.slots
      .filter((s) => !dept || s.department === dept)
      .map((s) => s.room_id)
      .filter(Boolean)
  );
  return data.rooms.filter((r) => ids.has(r.id)).map((r) => ({ id: r.id, label: `${r.name} (${r.type})` }));
}

export function selectionLabel(data, view, primaryId) {
  if (view === "section") return sectionOf(data, primaryId)?.label || "";
  if (view === "faculty") return facultyOf(data, primaryId)?.name || "";
  return data.rooms.find((r) => r.id === primaryId)?.name || "";
}
