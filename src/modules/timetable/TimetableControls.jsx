import { Button } from "../../ui/Button.jsx";
import { SelectField } from "../../ui/SelectField.jsx";

export const TIMETABLE_VIEWS = [
  { id: "section", label: "Class" },
  { id: "faculty", label: "Faculty" },
  { id: "room", label: "Room" },
  { id: "tools", label: "Tools" },
];

export function selectorLabel(view) {
  if (view === "section") return "Your class";
  if (view === "faculty") return "Faculty";
  return "Room / Lab";
}

export function TimetableControls({
  view,
  primaryId,
  onPrimaryChange,
  options,
  showMore,
  dept,
  onDeptChange,
  depts,
  busy,
  onExcel,
  onPdf,
  onToggleMore,
}) {
  return (
    <section className="controls">
      <SelectField
        label={selectorLabel(view)}
        value={primaryId}
        onChange={(event) => onPrimaryChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </SelectField>
      {showMore ? (
        <SelectField
          className="field-narrow"
          label="Department"
          value={dept}
          onChange={(event) => onDeptChange(event.target.value)}
        >
          <option value="">All</option>
          {depts.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </SelectField>
      ) : null}
      <div className="download-actions">
        <Button onClick={onExcel} disabled={!!busy}>
          Excel
        </Button>
        <Button variant="ghost" onClick={onPdf} disabled={!!busy}>
          PDF
        </Button>
        <Button
          variant="ghost"
          className="more-toggle"
          aria-expanded={showMore}
          onClick={onToggleMore}
        >
          {showMore ? "Less" : "More"}
        </Button>
      </div>
    </section>
  );
}
