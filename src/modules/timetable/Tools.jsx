import { useMemo } from "react";
import { DataTable } from "../../ui/DataTable.jsx";
import { Panel } from "../../ui/Panel.jsx";

export default function Tools({ data }) {
  const { conflicts, faculty_load: loads } = data.derived;
  const ltpRows = data.derived.ltp_check || [];
  const lookups = useMemo(
    () => ({
      subjectByCode: Object.fromEntries(data.subjects.map((s) => [s.code, s])),
      facultyById: Object.fromEntries(data.faculties.map((f) => [f.id, f])),
      sectionById: Object.fromEntries(data.sections.map((s) => [s.id, s])),
    }),
    [data]
  );

  const none =
    !conflicts.faculty.length && !conflicts.room.length && !conflicts.section.length;

  const offeringRows = useMemo(
    () =>
      data.offerings.map((offering) => {
        const sub = lookups.subjectByCode[offering.subject_code] || {};
        const fac = lookups.facultyById[offering.faculty_id] || {};
        const sec = lookups.sectionById[offering.section_id] || {};
        const ltp = [sub.L, sub.T, sub.P].every((x) => x !== undefined && x !== "")
          ? `${sub.L}-${sub.T}-${sub.P}`
          : "—";
        return { offering, sub, fac, sec, ltp };
      }),
    [data.offerings, lookups]
  );

  return (
    <section className="tools-panel">
      <Panel className="tool-card">
        <h2>Conflict finder</h2>
        <p className="tool-lead">Same faculty or room booked twice in one period.</p>
        {none ? (
          <div className="ok">No conflicts detected in current slots.</div>
        ) : (
          <>
            {conflicts.faculty.map((c, i) => {
              const name =
                data.faculties.find((f) => f.id === c.faculty_id)?.name || c.faculty_id;
              return (
                <div key={`f-${i}`} className="conflict">
                  <strong>Faculty</strong> · {name} · {c.day} P{c.period}:{" "}
                  {c.summaries.join(" vs ")}
                </div>
              );
            })}
            {conflicts.room.map((c, i) => (
              <div key={`r-${i}`} className="conflict">
                <strong>Room</strong> · {c.room_id} · {c.day} P{c.period}:{" "}
                {c.summaries.join(" vs ")}
              </div>
            ))}
            {conflicts.section.map((c, i) => (
              <div key={`s-${i}`} className="conflict">
                <strong>Section</strong> · {c.section_id} · {c.day} P{c.period}:{" "}
                {c.summaries.join(" vs ")}
              </div>
            ))}
          </>
        )}
      </Panel>

      <Panel className="tool-card">
        <h2>Faculty load</h2>
        <p className="tool-lead">Scheduled contact hours this week (from slots).</p>
        <DataTable
          className="load-table"
          rows={loads}
          rowKey={(row) => row.faculty_id}
          columns={[
            { key: "name", label: "Faculty", render: (row) => row.faculty_name },
            { key: "hours", label: "Hours", render: (row) => row.hours },
            { key: "L", label: "L", render: (row) => row.L },
            { key: "T", label: "T", render: (row) => row.T },
            { key: "P", label: "P", render: (row) => row.P },
          ]}
        />
      </Panel>

      <Panel className="tool-card">
        <h2>LTP check</h2>
        <p className="tool-lead">
          Scheduled weekly periods vs subject L-T-P (labs/groups may differ by design).
        </p>
        <DataTable
          className="offer-table"
          rows={ltpRows}
          rowKey={(row, i) => `${row.section_id}-${row.subject_code}-${i}`}
          columns={[
            { key: "section", label: "Section", render: (row) => row.section_id },
            {
              key: "subject",
              label: "Subject",
              render: (row) => row.subject_short || row.subject_code,
            },
            { key: "required", label: "Required", render: (row) => row.required },
            { key: "scheduled", label: "Scheduled", render: (row) => row.scheduled },
            {
              key: "status",
              label: "Status",
              tdClass: (row) => (row.ok ? undefined : "is-warn"),
              render: (row) => (row.ok ? "OK" : "Check"),
            },
          ]}
        />
      </Panel>

      <Panel className="tool-card">
        <h2>Offerings</h2>
        <p className="tool-lead">Subjects with L-T-P and assigned faculty.</p>
        <DataTable
          className="offer-table"
          rows={offeringRows}
          rowKey={(row, i) =>
            `${row.offering.section_id}-${row.offering.subject_code}-${i}`
          }
          columns={[
            {
              key: "section",
              label: "Section",
              render: (row) => row.sec.label || row.offering.section_id,
            },
            { key: "code", label: "Code", render: (row) => row.offering.subject_code },
            { key: "subject", label: "Subject", render: (row) => row.sub.name || "" },
            { key: "ltp", label: "L-T-P", render: (row) => row.ltp },
            {
              key: "faculty",
              label: "Faculty",
              render: (row) => row.fac.name || row.offering.faculty_id,
            },
          ]}
        />
      </Panel>
    </section>
  );
}
