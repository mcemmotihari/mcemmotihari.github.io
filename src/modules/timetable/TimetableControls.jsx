import { DownloadMenu } from "../../ui/DownloadMenu.jsx";
import { SelectField } from "../../ui/SelectField.jsx";

export function TimetableControls({
  program,
  onProgramChange,
  branches,
  busy,
  downloaded,
  onExcel,
  onPdf,
}) {
  return (
    <section className="controls">
      <SelectField
        label="Branch"
        value={program}
        onChange={(event) => onProgramChange(event.target.value)}
      >
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.label}
          </option>
        ))}
      </SelectField>
      <DownloadMenu busy={busy} downloaded={downloaded} onExcel={onExcel} onPdf={onPdf} />
    </section>
  );
}
