import { cx } from "./cx.js";

export function SelectField({
  label,
  value,
  onChange,
  children,
  className = "",
}) {
  return (
    <label className={cx("field", className)}>
      <span>{label}</span>
      <select value={value} onChange={onChange}>
        {children}
      </select>
    </label>
  );
}
