const DATA_URL = "data/timetable.json";

const state = {
  data: null,
  view: "section",
  primaryId: "",
  dept: "",
};

const els = {
  metaLine: document.getElementById("metaLine"),
  primarySelect: document.getElementById("primarySelect"),
  deptFilter: document.getElementById("deptFilter"),
  selectorLabel: document.getElementById("selectorLabel"),
  selectionHint: document.getElementById("selectionHint"),
  controlsPanel: document.getElementById("controlsPanel"),
  gridSection: document.getElementById("gridSection"),
  toolsPanel: document.getElementById("toolsPanel"),
  table: document.getElementById("timetable"),
  sheetTitle: document.getElementById("sheetTitle"),
  sheetMeta: document.getElementById("sheetMeta"),
  mappingTable: document.getElementById("mappingTable"),
  sheetSign: document.getElementById("sheetSign"),
  conflictsOut: document.getElementById("conflictsOut"),
  loadOut: document.getElementById("loadOut"),
  ltpOut: document.getElementById("ltpOut"),
  offeringsOut: document.getElementById("offeringsOut"),
};

const DAY_NAMES = {
  MON: "MONDAY",
  TUE: "TUESDAY",
  WED: "WEDNESDAY",
  THU: "THURSDAY",
  FRI: "FRIDAY",
  SAT: "SATURDAY",
};

const SEM_ROMAN = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 7: "VII", 8: "VIII" };
const SEM_ORD = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th", 5: "5th", 6: "6th", 7: "7th", 8: "8th" };
const LUNCH_LETTERS = ["L", "U", "N", "C", "H", ""];

document.querySelectorAll(".tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((b) => {
      b.classList.toggle("is-active", b === btn);
      b.setAttribute("aria-selected", b === btn ? "true" : "false");
    });
    state.view = btn.dataset.view;
    syncSelector();
    render();
  });
});

els.primarySelect.addEventListener("change", () => {
  state.primaryId = els.primarySelect.value;
  render();
});

els.deptFilter.addEventListener("change", () => {
  state.dept = els.deptFilter.value;
  syncSelector();
  render();
});

async function boot() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`Failed to load ${DATA_URL}`);
  state.data = await res.json();

  const depts = [...new Set(state.data.sections.map((s) => s.department).filter(Boolean))].sort();
  els.deptFilter.innerHTML =
    `<option value="">All</option>` + depts.map((d) => `<option value="${esc(d)}">${esc(d)}</option>`).join("");

  const wef = state.data.sections.map((s) => s.wef).find(Boolean) || "";
  els.metaLine.textContent = `${state.data.meta.college_short || state.data.meta.college} · ${state.data.slots.length} slots · w.e.f. ${wef}`;

  syncSelector();
  render();
}

function filteredSections() {
  return state.data.sections.filter((s) => !state.dept || s.department === state.dept);
}

function syncSelector() {
  const { view } = state;
  const showControls = view !== "tools";
  els.controlsPanel.classList.toggle("hidden", !showControls);
  els.gridSection.classList.toggle("hidden", view === "tools");
  els.toolsPanel.classList.toggle("hidden", view !== "tools");

  if (view === "tools") return;

  let options = [];
  if (view === "section") {
    els.selectorLabel.textContent = "Section";
    options = filteredSections().map((s) => ({
      id: s.id,
      label: `${s.label} (${s.academic_year})`,
    }));
  } else if (view === "faculty") {
    els.selectorLabel.textContent = "Faculty";
    const ids = new Set(
      state.data.slots
        .filter((s) => !state.dept || s.department === state.dept)
        .map((s) => s.faculty_id)
        .filter(Boolean)
    );
    options = state.data.faculties
      .filter((f) => ids.has(f.id))
      .map((f) => ({ id: f.id, label: f.name }));
  } else if (view === "room") {
    els.selectorLabel.textContent = "Room / Lab";
    const ids = new Set(
      state.data.slots
        .filter((s) => !state.dept || s.department === state.dept)
        .map((s) => s.room_id)
        .filter(Boolean)
    );
    options = state.data.rooms
      .filter((r) => ids.has(r.id))
      .map((r) => ({ id: r.id, label: `${r.name} (${r.type})` }));
  }

  els.primarySelect.innerHTML = options
    .map((o) => `<option value="${esc(o.id)}">${esc(o.label)}</option>`)
    .join("");

  if (!options.find((o) => o.id === state.primaryId)) {
    state.primaryId = options[0]?.id || "";
  }
  els.primarySelect.value = state.primaryId;
}

function matchingSlots() {
  const { view, primaryId, dept } = state;
  return state.data.slots.filter((s) => {
    if (dept && s.department !== dept) return false;
    if (view === "section") return s.section_id === primaryId;
    if (view === "faculty") return s.faculty_id === primaryId;
    if (view === "room") return s.room_id === primaryId;
    return false;
  });
}

function render() {
  if (state.view === "tools") {
    renderTools();
    return;
  }
  renderGrid(matchingSlots());
}

function sectionOf(id) {
  return state.data.sections.find((s) => s.id === id);
}

function subjectOf(code) {
  return state.data.subjects.find((s) => s.code === code);
}

function facultyOf(id) {
  return state.data.faculties.find((f) => f.id === id);
}

function clockRange(start, end) {
  return `${toClock(start)} to ${toClock(end)}`;
}

function toClock(hhmm) {
  const [h, m] = String(hhmm).split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function paperCode(sub) {
  if (!sub?.code) return "";
  const p = Number(sub.P);
  return p > 0 ? `${sub.code}(+P)` : sub.code;
}

function ltpText(sub) {
  if (!sub) return "-";
  const empty = (v) => v === undefined || v === null || v === "";
  if (empty(sub.L) && empty(sub.T) && empty(sub.P)) return "-";
  return `${sub.L || 0}-${sub.T || 0}-${sub.P || 0}`;
}

function branchTag(section) {
  if (!section) return "";
  return section.program === "CSE-AI" ? "AI" : section.program;
}

function sectionTag(section) {
  if (!section) return "";
  const ord = SEM_ORD[Number(section.semester)] || String(section.semester);
  return `${ord}/${branchTag(section)}`;
}

function subjectLine(slots, view) {
  return slots
    .map((s) => {
      const short = s.subject_short || s.subject_code || "";
      const tag = sectionTag(sectionOf(s.section_id));
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

function roomLine(slots) {
  const rooms = slots.map((s) => s.room_id || "");
  if (rooms.every((r) => !r)) return "";
  if (rooms.length === 1) return `Room No - ${rooms[0]}`;
  return `Room No. - ${rooms.join(" / ")}`;
}

function renderGrid(slots) {
  const days = state.data.meta.days;
  const periods = state.data.meta.periods;
  const lunchAfter = state.data.meta.breaks?.[0]?.after_period ?? 3;
  const withRooms = state.view === "section";

  renderSheetChrome();

  const thead = els.table.querySelector("thead");
  const tbody = els.table.querySelector("tbody");

  thead.innerHTML = `<tr>
    <th class="corner" rowspan="2">Period, Time &amp; Days</th>
    ${periods
      .flatMap((p) => {
        const cells = [`<th>${esc(p.label)}</th>`];
        if (p.id === lunchAfter) cells.push(`<th class="lunch-head" rowspan="2"></th>`);
        return cells;
      })
      .join("")}
  </tr>
  <tr class="time-row">
    ${periods.map((p) => `<th>${esc(clockRange(p.start, p.end))}</th>`).join("")}
  </tr>`;

  const byDayPeriod = new Map();
  for (const s of slots) {
    const key = `${s.day}|${s.period}`;
    if (!byDayPeriod.has(key)) byDayPeriod.set(key, []);
    byDayPeriod.get(key).push(s);
  }

  tbody.innerHTML = days
    .map((day, di) => {
      const lunch = LUNCH_LETTERS[di] ?? "";
      const subjCells = periods.flatMap((p) => {
        const list = byDayPeriod.get(`${day}|${p.id}`) || [];
        const line = list.length ? subjectLine(list, state.view) : "";
        const td = `<td class="subj">${esc(line)}</td>`;
        if (p.id === lunchAfter) {
          const lunchTd = withRooms
            ? `<td class="lunch" rowspan="2">${esc(lunch)}</td>`
            : `<td class="lunch">${esc(lunch)}</td>`;
          return [td, lunchTd];
        }
        return [td];
      });

      if (!withRooms) {
        return `<tr><th class="day">${esc(DAY_NAMES[day] || day)}</th>${subjCells.join("")}</tr>`;
      }

      const roomCells = periods.map((p) => {
        const list = byDayPeriod.get(`${day}|${p.id}`) || [];
        const line = list.length ? roomLine(list) : "";
        return `<td class="room">${esc(line)}</td>`;
      });

      return `<tr>
        <th class="day" rowspan="2">${esc(DAY_NAMES[day] || day)}</th>
        ${subjCells.join("")}
      </tr>
      <tr>${roomCells.join("")}</tr>`;
    })
    .join("");

  renderMapping();
  renderSignatures();

  const label =
    state.view === "section"
      ? sectionOf(state.primaryId)?.label
      : state.view === "faculty"
        ? facultyOf(state.primaryId)?.name
        : state.data.rooms.find((r) => r.id === state.primaryId)?.name;

  els.selectionHint.textContent = label ? label : "No selection";
}

function renderSheetChrome() {
  const college = (state.data.meta.college || "Motihari College of Engineering, Motihari").toUpperCase();
  els.sheetTitle.textContent = college;

  if (state.view === "section") {
    const sec = sectionOf(state.primaryId);
    const sem = SEM_ROMAN[Number(sec?.semester)] || sec?.semester || "";
    els.sheetMeta.className = "sheet-meta";
    els.sheetMeta.innerHTML = `
      <span>A.Y :- ${esc(sec?.academic_year || "")}</span>
      <span>Branch :- ${esc(sec?.program || "")}</span>
      <span>Semester :- ${esc(sem)}</span>
      <span>Session :- ${esc(sec?.batch_session || "")}</span>
      <span>w.e.f :- ${esc(sec?.wef || "")}</span>`;
    return;
  }

  els.sheetMeta.className = "sheet-meta meta-2";
  const wef = state.data.sections.map((s) => s.wef).find(Boolean) || "";
  if (state.view === "faculty") {
    const fac = facultyOf(state.primaryId);
    els.sheetMeta.innerHTML = `
      <span>Faculty Name :- ${esc(fac?.name || "")}</span>
      <span>w.e.f :- ${esc(wef)}</span>`;
    return;
  }

  const room = state.data.rooms.find((r) => r.id === state.primaryId);
  els.sheetMeta.innerHTML = `
    <span>Room Number :- ${esc(room?.id || "")}</span>
    <span>w.e.f :- ${esc(wef)}</span>`;
}

function renderMapping() {
  const thead = els.mappingTable.querySelector("thead");
  const tbody = els.mappingTable.querySelector("tbody");
  const rows = mappingRows();

  if (state.view === "section") {
    thead.innerHTML = `<tr>
      <th class="col-sno">S.No.</th>
      <th class="col-code">Paper Code</th>
      <th class="col-ltp">L-T-P</th>
      <th>Subjects</th>
      <th class="col-short">Course Short Form</th>
      <th>Faculty</th>
    </tr>`;
    tbody.innerHTML = rows
      .map(
        (r, i) => `<tr>
        <td>${i + 1}</td>
        <td>${esc(r.code)}</td>
        <td>${esc(r.ltp)}</td>
        <td class="left">${esc(r.subject)}</td>
        <td>${esc(r.short)}</td>
        <td class="left">${esc(r.faculty)}</td>
      </tr>`
      )
      .join("");
    return;
  }

  if (state.view === "faculty") {
    thead.innerHTML = `<tr>
      <th class="col-sno">S.No.</th>
      <th class="col-code">Paper Code</th>
      <th class="col-ltp">L-T-P</th>
      <th>Subjects</th>
      <th class="col-short">Course Short Form</th>
      <th>Branch</th>
      <th>Semester</th>
    </tr>`;
    tbody.innerHTML = rows
      .map(
        (r, i) => `<tr>
        <td>${i + 1}</td>
        <td>${esc(r.code)}</td>
        <td>${esc(r.ltp)}</td>
        <td class="left">${esc(r.subject)}</td>
        <td>${esc(r.short)}</td>
        <td>${esc(r.branch)}</td>
        <td>${esc(r.semester)}</td>
      </tr>`
      )
      .join("");
    return;
  }

  thead.innerHTML = `<tr>
    <th class="col-sno">S.No.</th>
    <th class="col-code">Paper Code</th>
    <th class="col-ltp">L-T-P</th>
    <th>Subjects</th>
    <th class="col-short">Course Short Form</th>
    <th>Faculty</th>
    <th>Branch</th>
    <th>Semester</th>
  </tr>`;
  tbody.innerHTML = rows
    .map(
      (r, i) => `<tr>
      <td>${i + 1}</td>
      <td>${esc(r.code)}</td>
      <td>${esc(r.ltp)}</td>
      <td class="left">${esc(r.subject)}</td>
      <td>${esc(r.short)}</td>
      <td class="left">${esc(r.faculty)}</td>
      <td>${esc(r.branch)}</td>
      <td>${esc(r.semester)}</td>
    </tr>`
    )
    .join("");
}

function mappingRows() {
  if (state.view === "section") {
    return state.data.offerings
      .filter((o) => o.section_id === state.primaryId)
      .map((o) => {
        const sub = subjectOf(o.subject_code) || {};
        const fac = facultyOf(o.faculty_id);
        return {
          code: paperCode(sub) || o.subject_code,
          ltp: ltpText(sub),
          subject: sub.name || "",
          short: sub.short || "",
          faculty: fac?.name || "",
        };
      });
  }

  if (state.view === "faculty") {
    return state.data.offerings
      .filter((o) => o.faculty_id === state.primaryId)
      .map((o) => {
        const sub = subjectOf(o.subject_code) || {};
        const sec = sectionOf(o.section_id);
        return {
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
  for (const s of matchingSlots()) {
    const key = `${s.section_id}|${s.subject_code}`;
    if (seen.has(key) || !s.subject_code) continue;
    seen.add(key);
    const sub = subjectOf(s.subject_code) || {};
    const sec = sectionOf(s.section_id);
    const off = state.data.offerings.find(
      (o) => o.section_id === s.section_id && o.subject_code === s.subject_code
    );
    const fac = facultyOf(off?.faculty_id || s.faculty_id);
    rows.push({
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

function renderSignatures() {
  const dept =
    state.view === "section"
      ? sectionOf(state.primaryId)?.department || "CSE"
      : "CSE";
  els.sheetSign.innerHTML = `
    <span>Time Table In-Charge</span>
    <span>HOD(${esc(dept)})</span>
    <span>Principal</span>`;
}

function renderTools() {
  const { conflicts, faculty_load: loads } = state.data.derived;

  const blocks = [];
  if (!conflicts.faculty.length && !conflicts.room.length && !conflicts.section.length) {
    blocks.push(`<div class="ok">No conflicts detected in current slots.</div>`);
  } else {
    for (const c of conflicts.faculty) {
      const name = state.data.faculties.find((f) => f.id === c.faculty_id)?.name || c.faculty_id;
      blocks.push(
        `<div class="conflict"><strong>Faculty</strong> · ${esc(name)} · ${esc(c.day)} P${esc(String(c.period))}: ${esc(c.summaries.join(" vs "))}</div>`
      );
    }
    for (const c of conflicts.room) {
      blocks.push(
        `<div class="conflict"><strong>Room</strong> · ${esc(c.room_id)} · ${esc(c.day)} P${esc(String(c.period))}: ${esc(c.summaries.join(" vs "))}</div>`
      );
    }
    for (const c of conflicts.section) {
      blocks.push(
        `<div class="conflict"><strong>Section</strong> · ${esc(c.section_id)} · ${esc(c.day)} P${esc(String(c.period))}: ${esc(c.summaries.join(" vs "))}</div>`
      );
    }
  }
  els.conflictsOut.innerHTML = blocks.join("");

  els.loadOut.innerHTML = `<table class="load-table">
    <thead><tr><th>Faculty</th><th>Hours</th><th>L</th><th>T</th><th>P</th></tr></thead>
    <tbody>
      ${loads
        .map(
          (r) => `<tr>
        <td>${esc(r.faculty_name)}</td>
        <td>${r.hours}</td>
        <td>${r.L}</td>
        <td>${r.T}</td>
        <td>${r.P}</td>
      </tr>`
        )
        .join("")}
    </tbody>
  </table>`;

  const ltpRows = state.data.derived.ltp_check || [];
  els.ltpOut.innerHTML = `<table class="offer-table">
    <thead><tr><th>Section</th><th>Subject</th><th>Required</th><th>Scheduled</th><th>Status</th></tr></thead>
    <tbody>
      ${ltpRows
        .map((r) => {
          const status = r.ok ? "OK" : "Check";
          const cls = r.ok ? "" : ' style="color:#9b2c2c;font-weight:700"';
          return `<tr>
            <td>${esc(r.section_id)}</td>
            <td>${esc(r.subject_short || r.subject_code)}</td>
            <td>${esc(r.required)}</td>
            <td>${esc(r.scheduled)}</td>
            <td${cls}>${status}</td>
          </tr>`;
        })
        .join("")}
    </tbody>
  </table>`;

  const subjectByCode = Object.fromEntries(state.data.subjects.map((s) => [s.code, s]));
  const facultyById = Object.fromEntries(state.data.faculties.map((f) => [f.id, f]));
  const sectionById = Object.fromEntries(state.data.sections.map((s) => [s.id, s]));

  els.offeringsOut.innerHTML = `<table class="offer-table">
    <thead><tr><th>Section</th><th>Code</th><th>Subject</th><th>L-T-P</th><th>Faculty</th></tr></thead>
    <tbody>
      ${state.data.offerings
        .map((o) => {
          const sub = subjectByCode[o.subject_code] || {};
          const fac = facultyById[o.faculty_id] || {};
          const sec = sectionById[o.section_id] || {};
          const ltp = [sub.L, sub.T, sub.P].every((x) => x !== undefined && x !== "")
            ? `${sub.L}-${sub.T}-${sub.P}`
            : "—";
          return `<tr>
            <td>${esc(sec.label || o.section_id)}</td>
            <td>${esc(o.subject_code)}</td>
            <td>${esc(sub.name || "")}</td>
            <td>${esc(ltp)}</td>
            <td>${esc(fac.name || o.faculty_id)}</td>
          </tr>`;
        })
        .join("")}
    </tbody>
  </table>`;
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

boot().catch((err) => {
  els.metaLine.textContent = `Could not load timetable data: ${err.message}`;
  console.error(err);
});
