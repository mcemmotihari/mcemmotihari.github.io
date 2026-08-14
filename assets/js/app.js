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
  conflictsOut: document.getElementById("conflictsOut"),
  loadOut: document.getElementById("loadOut"),
  ltpOut: document.getElementById("ltpOut"),
  offeringsOut: document.getElementById("offeringsOut"),
};

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

function renderGrid(slots) {
  const days = state.data.meta.days;
  const periods = state.data.meta.periods;
  const lunchAfter = state.data.meta.breaks?.[0]?.after_period ?? 3;

  const thead = els.table.querySelector("thead");
  const tbody = els.table.querySelector("tbody");

  thead.innerHTML = `<tr>
    <th>Day</th>
    ${periods
      .flatMap((p) => {
        const cells = [
          `<th>Period ${esc(String(p.label))}<small>${esc(p.start)}–${esc(p.end)}</small></th>`,
        ];
        if (p.id === lunchAfter) {
          cells.push(
            `<th>Lunch<small>${esc(state.data.meta.breaks[0].start)}–${esc(state.data.meta.breaks[0].end)}</small></th>`
          );
        }
        return cells;
      })
      .join("")}
  </tr>`;

  const byDayPeriod = new Map();
  for (const s of slots) {
    const key = `${s.day}|${s.period}`;
    if (!byDayPeriod.has(key)) byDayPeriod.set(key, []);
    byDayPeriod.get(key).push(s);
  }

  tbody.innerHTML = days
    .map((day) => {
      const cells = periods.flatMap((p) => {
        const list = byDayPeriod.get(`${day}|${p.id}`) || [];
        const html = list.length
          ? list.map((s, i) => slotCard(s, i)).join("")
          : `<span class="empty">—</span>`;
        const td = `<td>${html}</td>`;
        if (p.id === lunchAfter) {
          return [td, `<td class="lunch-col">Lunch</td>`];
        }
        return [td];
      });
      return `<tr><th>${esc(day)}</th>${cells.join("")}</tr>`;
    })
    .join("");

  const label =
    state.view === "section"
      ? state.data.sections.find((s) => s.id === state.primaryId)?.label
      : state.view === "faculty"
        ? state.data.faculties.find((f) => f.id === state.primaryId)?.name
        : state.data.rooms.find((r) => r.id === state.primaryId)?.name;

  els.selectionHint.textContent = label
    ? `${label} · ${slots.length} period booking${slots.length === 1 ? "" : "s"}`
    : "No selection";
}

function slotCard(s, index) {
  const type = s.type || "L";
  const lines = [];
  if (state.view === "section") {
    lines.push(s.faculty_name || "Faculty TBA");
    lines.push(s.room_id ? `Room ${s.room_id}` : "Room TBA");
  } else if (state.view === "faculty") {
    lines.push(s.section_label || s.section_id);
    lines.push(s.room_id ? `Room ${s.room_id}` : "Room TBA");
  } else {
    lines.push(s.section_label || s.section_id);
    lines.push(s.faculty_name || "Faculty TBA");
  }
  const group = s.group ? ` ${s.group}` : "";
  return `<div class="slot ${esc(type)}" style="animation-delay:${index * 30}ms">
    <div class="code">${esc(s.subject_short || s.subject_code)}${esc(group)} <small>(${esc(type)})</small></div>
    <div class="meta">${esc(lines.filter(Boolean).join(" · "))}</div>
    <div class="meta">${esc(s.subject_code || "")}</div>
  </div>`;
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
