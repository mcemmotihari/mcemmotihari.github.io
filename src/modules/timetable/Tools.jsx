export default function Tools({ data }) {
  const { conflicts, faculty_load: loads } = data.derived;
  const ltpRows = data.derived.ltp_check || [];
  const subjectByCode = Object.fromEntries(data.subjects.map((s) => [s.code, s]));
  const facultyById = Object.fromEntries(data.faculties.map((f) => [f.id, f]));
  const sectionById = Object.fromEntries(data.sections.map((s) => [s.id, s]));

  const none =
    !conflicts.faculty.length && !conflicts.room.length && !conflicts.section.length;

  return (
    <section className="tools-panel">
      <div className="tool-card">
        <h2>Conflict finder</h2>
        <p className="tool-lead">Same faculty or room booked twice in one period.</p>
        {none ? (
          <div className="ok">No conflicts detected in current slots.</div>
        ) : (
          <>
            {conflicts.faculty.map((c, i) => {
              const name = data.faculties.find((f) => f.id === c.faculty_id)?.name || c.faculty_id;
              return (
                <div key={`f-${i}`} className="conflict">
                  <strong>Faculty</strong> · {name} · {c.day} P{c.period}: {c.summaries.join(" vs ")}
                </div>
              );
            })}
            {conflicts.room.map((c, i) => (
              <div key={`r-${i}`} className="conflict">
                <strong>Room</strong> · {c.room_id} · {c.day} P{c.period}: {c.summaries.join(" vs ")}
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
      </div>

      <div className="tool-card">
        <h2>Faculty load</h2>
        <p className="tool-lead">Scheduled contact hours this week (from slots).</p>
        <table className="load-table">
          <thead>
            <tr>
              <th>Faculty</th>
              <th>Hours</th>
              <th>L</th>
              <th>T</th>
              <th>P</th>
            </tr>
          </thead>
          <tbody>
            {loads.map((r) => (
              <tr key={r.faculty_id}>
                <td>{r.faculty_name}</td>
                <td>{r.hours}</td>
                <td>{r.L}</td>
                <td>{r.T}</td>
                <td>{r.P}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="tool-card">
        <h2>LTP check</h2>
        <p className="tool-lead">
          Scheduled weekly periods vs subject L-T-P (labs/groups may differ by design).
        </p>
        <table className="offer-table">
          <thead>
            <tr>
              <th>Section</th>
              <th>Subject</th>
              <th>Required</th>
              <th>Scheduled</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {ltpRows.map((r, i) => (
              <tr key={`${r.section_id}-${r.subject_code}-${i}`}>
                <td>{r.section_id}</td>
                <td>{r.subject_short || r.subject_code}</td>
                <td>{r.required}</td>
                <td>{r.scheduled}</td>
                <td style={r.ok ? undefined : { color: "#9b2c2c", fontWeight: 700 }}>
                  {r.ok ? "OK" : "Check"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="tool-card">
        <h2>Offerings</h2>
        <p className="tool-lead">Subjects with L-T-P and assigned faculty.</p>
        <table className="offer-table">
          <thead>
            <tr>
              <th>Section</th>
              <th>Code</th>
              <th>Subject</th>
              <th>L-T-P</th>
              <th>Faculty</th>
            </tr>
          </thead>
          <tbody>
            {data.offerings.map((o, i) => {
              const sub = subjectByCode[o.subject_code] || {};
              const fac = facultyById[o.faculty_id] || {};
              const sec = sectionById[o.section_id] || {};
              const ltp = [sub.L, sub.T, sub.P].every((x) => x !== undefined && x !== "")
                ? `${sub.L}-${sub.T}-${sub.P}`
                : "—";
              return (
                <tr key={`${o.section_id}-${o.subject_code}-${i}`}>
                  <td>{sec.label || o.section_id}</td>
                  <td>{o.subject_code}</td>
                  <td>{sub.name || ""}</td>
                  <td>{ltp}</td>
                  <td>{fac.name || o.faculty_id}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
