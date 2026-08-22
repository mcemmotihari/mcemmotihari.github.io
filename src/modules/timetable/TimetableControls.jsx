import { DownloadMenu } from "../../ui/DownloadMenu.jsx";
import { SelectField } from "../../ui/SelectField.jsx";

export function TimetableControls({
  view,
  program,
  onProgramChange,
  branches,
  editionId,
  editionOptions,
  onEditionChange,
  primaryId,
  onPrimaryChange,
  primaryOptions,
  busy,
  downloaded,
  onExcel,
  onPdf,
}) {
  const showDownload = view !== "tools";

  return (
    <section className="controls">
      {view === "section" ? (
        <>
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
          {editionOptions?.length ? (
            <SelectField
              label="Edition"
              value={editionId}
              onChange={(event) => onEditionChange(event.target.value)}
            >
              {editionOptions.map((edition) => (
                <option key={edition.id} value={edition.id}>
                  {edition.label}
                </option>
              ))}
            </SelectField>
          ) : null}
        </>
      ) : view === "faculty" || view === "room" ? (
        <SelectField
          label={view === "faculty" ? "Faculty" : "Room"}
          value={primaryId}
          onChange={(event) => onPrimaryChange(event.target.value)}
        >
          {primaryOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </SelectField>
      ) : (
        <p className="hint">Conflict finder, faculty load, L-T-P check, and offerings.</p>
      )}
      {showDownload ? (
        <DownloadMenu busy={busy} downloaded={downloaded} onExcel={onExcel} onPdf={onPdf} />
      ) : null}
    </section>
  );
}
