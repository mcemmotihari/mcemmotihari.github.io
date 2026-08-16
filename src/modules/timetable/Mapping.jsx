export default function Mapping({ view, rows }) {
  if (view === "section") {
    return (
      <table className="excel-map">
        <thead>
          <tr>
            <th className="col-sno">S.No.</th>
            <th className="col-code">Paper Code</th>
            <th className="col-ltp">L-T-P</th>
            <th>Subjects</th>
            <th className="col-short">Course Short Form</th>
            <th>Faculty</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.code}-${i}`}>
              <td>{i + 1}</td>
              <td>{r.code}</td>
              <td>{r.ltp}</td>
              <td>{r.subject}</td>
              <td>{r.short}</td>
              <td>{r.faculty}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (view === "faculty") {
    return (
      <table className="excel-map">
        <thead>
          <tr>
            <th className="col-sno">S.No.</th>
            <th className="col-code">Paper Code</th>
            <th className="col-ltp">L-T-P</th>
            <th>Subjects</th>
            <th className="col-short">Course Short Form</th>
            <th>Branch</th>
            <th>Semester</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.code}-${r.branch}-${i}`}>
              <td>{i + 1}</td>
              <td>{r.code}</td>
              <td>{r.ltp}</td>
              <td>{r.subject}</td>
              <td>{r.short}</td>
              <td>{r.branch}</td>
              <td>{r.semester}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <table className="excel-map">
      <thead>
        <tr>
          <th className="col-sno">S.No.</th>
          <th className="col-code">Paper Code</th>
          <th className="col-ltp">L-T-P</th>
          <th>Subjects</th>
          <th className="col-short">Course Short Form</th>
          <th>Faculty</th>
          <th>Branch</th>
          <th>Semester</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={`${r.code}-${r.branch}-${i}`}>
            <td>{i + 1}</td>
            <td>{r.code}</td>
            <td>{r.ltp}</td>
            <td>{r.subject}</td>
            <td>{r.short}</td>
            <td>{r.faculty}</td>
            <td>{r.branch}</td>
            <td>{r.semester}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
