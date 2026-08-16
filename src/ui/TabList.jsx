import { cx } from "./cx.js";

export function TabList({
  label,
  items,
  value,
  onChange,
  variant = "pills",
}) {
  const isPages = variant === "pages";
  return (
    <nav
      className={isPages ? "page-tabs" : "view-tabs"}
      role="tablist"
      aria-label={label}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={cx(
            isPages ? "page-tab" : "tab",
            value === item.id && "is-active"
          )}
          role="tab"
          aria-selected={value === item.id}
          onClick={() => onChange(item.id)}
        >
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
