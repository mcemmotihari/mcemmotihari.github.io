import { COLLEGE_NAME_FULL } from "../../constants/site.js";
import {
  DAY_NAMES,
  LUNCH_LETTERS,
  clockRange,
  downloadName,
  mappingRows,
  roomLine,
  sheetMetaLines,
  signDept,
  subjectLine,
} from "./lib.js";

function colLetter(n) {
  let s = "";
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function thinBorder() {
  const edge = { style: "thin", color: { rgb: "111111" } };
  return { top: edge, bottom: edge, left: edge, right: edge };
}

function excelCell(value, extra = {}) {
  return {
    v: value ?? "",
    t: "s",
    s: {
      font: { name: "Times New Roman", sz: extra.sz || 11, bold: !!extra.bold },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: extra.border === false ? undefined : thinBorder(),
      ...extra.style,
    },
  };
}

function mappingHeads(view) {
  if (view === "section") {
    return ["S.No.", "Paper Code", "L-T-P", "Subjects", "Course Short Form", "Faculty"];
  }
  if (view === "faculty") {
    return ["S.No.", "Paper Code", "L-T-P", "Subjects", "Course Short Form", "Branch", "Semester"];
  }
  return ["S.No.", "Paper Code", "L-T-P", "Subjects", "Course Short Form", "Faculty", "Branch", "Semester"];
}

function mappingValueRows(rows, view) {
  return rows.map((r, i) => {
    if (view === "section") return [String(i + 1), r.code, r.ltp, r.subject, r.short, r.faculty];
    if (view === "faculty") {
      return [String(i + 1), r.code, r.ltp, r.subject, r.short, r.branch, r.semester];
    }
    return [String(i + 1), r.code, r.ltp, r.subject, r.short, r.faculty, r.branch, r.semester];
  });
}

export async function downloadExcel({ data, view, primaryId, slots, byDayPeriod }) {
  const XLSXmod = await import("xlsx-js-style");
  const XLSX = XLSXmod.utils ? XLSXmod : XLSXmod.default;
  const days = data.meta.days;
  const periods = data.meta.periods;
  const lunchAfter = data.meta.breaks?.[0]?.after_period ?? 3;
  const withRooms = view === "section";
  const title = (data.meta.college || COLLEGE_NAME_FULL).toUpperCase();
  const meta = sheetMetaLines(data, view, primaryId);
  const heads = mappingHeads(view);
  const mapRows = mappingValueRows(mappingRows(data, view, primaryId, slots), view);
  const signs = ["Time Table In-Charge", `HOD(${signDept(data, view, primaryId)})`, "Principal"];

  const periodCols = [];
  for (const p of periods) {
    periodCols.push({ kind: "period", period: p });
    if (p.id === lunchAfter) periodCols.push({ kind: "lunch" });
  }
  const colCount = 1 + periodCols.length;

  const ws = {};
  const merges = [];
  let r = 1;

  const set = (row, col, cell) => {
    ws[`${colLetter(col)}${row}`] = cell;
  };

  set(r, 1, excelCell(title, { bold: true, sz: 16 }));
  merges.push({ s: { r: r - 1, c: 0 }, e: { r: r - 1, c: colCount - 1 } });
  r += 1;

  if (meta.length) {
    const span = Math.max(1, Math.floor(colCount / meta.length));
    meta.forEach((text, i) => {
      const start = i * span + 1;
      const end = i === meta.length - 1 ? colCount : (i + 1) * span;
      set(r, start, excelCell(text, { bold: true, sz: 11 }));
      if (end > start) merges.push({ s: { r: r - 1, c: start - 1 }, e: { r: r - 1, c: end - 1 } });
      for (let c = start + 1; c <= end; c += 1) set(r, c, excelCell(""));
    });
  }
  r += 1;

  const headRow = r;
  const timeRow = r + 1;
  set(headRow, 1, excelCell("Period, Time & Days", { bold: true, sz: 11 }));
  set(timeRow, 1, excelCell("", { bold: true }));
  merges.push({ s: { r: headRow - 1, c: 0 }, e: { r: timeRow - 1, c: 0 } });

  periodCols.forEach((col, i) => {
    const c = i + 2;
    if (col.kind === "lunch") {
      set(headRow, c, excelCell("", { bold: true }));
      set(timeRow, c, excelCell("", { bold: true }));
      merges.push({ s: { r: headRow - 1, c: c - 1 }, e: { r: timeRow - 1, c: c - 1 } });
    } else {
      set(headRow, c, excelCell(col.period.label, { bold: true }));
      set(timeRow, c, excelCell(clockRange(col.period.start, col.period.end), { bold: true, sz: 9 }));
    }
  });
  r = timeRow + 1;

  for (let di = 0; di < days.length; di += 1) {
    const day = days[di];
    const lunch = LUNCH_LETTERS[di] ?? "";
    const subjRow = r;
    const roomRow = r + 1;

    if (withRooms) {
      set(subjRow, 1, excelCell(DAY_NAMES[day] || day, { bold: true }));
      set(roomRow, 1, excelCell("", { bold: true }));
      merges.push({ s: { r: subjRow - 1, c: 0 }, e: { r: roomRow - 1, c: 0 } });
    } else {
      set(subjRow, 1, excelCell(DAY_NAMES[day] || day, { bold: true }));
    }

    periodCols.forEach((col, i) => {
      const c = i + 2;
      if (col.kind === "lunch") {
        set(subjRow, c, excelCell(lunch, { bold: true }));
        if (withRooms) {
          set(roomRow, c, excelCell(""));
          merges.push({ s: { r: subjRow - 1, c: c - 1 }, e: { r: roomRow - 1, c: c - 1 } });
        }
        return;
      }
      const list = byDayPeriod.get(`${day}|${col.period.id}`) || [];
      set(subjRow, c, excelCell(list.length ? subjectLine(data, list, view) : "", { sz: 10 }));
      if (withRooms) {
        set(roomRow, c, excelCell(list.length ? roomLine(list) : "", { sz: 9 }));
      }
    });

    r += withRooms ? 2 : 1;
  }

  r += 1;
  const mapCols = Math.max(heads.length, 1);
  heads.forEach((h, i) => set(r, 1 + i, excelCell(h, { bold: true })));
  r += 1;
  for (const row of mapRows) {
    row.forEach((val, i) => set(r, 1 + i, excelCell(val, { sz: 11 })));
    r += 1;
  }

  r += 2;
  const signSpan = Math.max(1, Math.floor(colCount / Math.max(signs.length, 1)));
  signs.forEach((text, i) => {
    const start = i * signSpan + 1;
    const end = i === signs.length - 1 ? colCount : (i + 1) * signSpan;
    set(r, start, excelCell(text, { bold: true }));
    if (end > start) merges.push({ s: { r: r - 1, c: start - 1 }, e: { r: r - 1, c: end - 1 } });
    for (let c = start + 1; c <= end; c += 1) set(r, c, excelCell(""));
  });

  const usedCols = Math.max(colCount, mapCols);
  ws["!ref"] = `A1:${colLetter(usedCols)}${r}`;
  ws["!merges"] = merges;
  ws["!cols"] = Array.from({ length: usedCols }, (_, i) => {
    const periodCol = periodCols[i - 1];
    if (i === 0) return { wch: 22 };
    if (periodCol?.kind === "lunch") return { wch: 8 };
    return { wch: 18 };
  });
  ws["!rows"] = [{ hpt: 24 }, { hpt: 20 }, { hpt: 20 }, { hpt: 18 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Timetable");
  XLSX.writeFile(wb, `${downloadName(data, view, primaryId)}.xlsx`);
}

export async function downloadPdf(sheetEl, data, view, primaryId) {
  const [{ default: html2canvas }, jspdf] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const { jsPDF } = jspdf;
  const clone = sheetEl.cloneNode(true);
  clone.style.width = "1400px";
  clone.style.maxWidth = "1400px";
  clone.style.background = "#ffffff";
  clone.style.color = "#111111";
  clone.querySelectorAll(".now-live, .now-progress, .cell-soon, .live-strip").forEach((el) => el.remove());
  clone.querySelectorAll(".is-now, .is-soon").forEach((el) => el.classList.remove("is-now", "is-soon"));
  clone.querySelectorAll("*").forEach((el) => {
    el.style.color = "#111111";
    el.style.background = "#ffffff";
    if (el.tagName === "TH" || el.tagName === "TD") {
      el.style.borderColor = "#111111";
    }
  });

  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-10000px;top:0;z-index:-1;";
  host.appendChild(clone);
  document.body.appendChild(host);

  try {
    const canvas = await html2canvas(clone, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
    });
    const img = canvas.toDataURL("image/jpeg", 0.92);
    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a3" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 24;
    const maxW = pageW - margin * 2;
    const maxH = pageH - margin * 2;
    const ratio = Math.min(maxW / canvas.width, maxH / canvas.height);
    const w = canvas.width * ratio;
    const h = canvas.height * ratio;
    pdf.addImage(img, "JPEG", (pageW - w) / 2, (pageH - h) / 2, w, h);
    pdf.save(`${downloadName(data, view, primaryId)}.pdf`);
  } finally {
    host.remove();
  }
}
