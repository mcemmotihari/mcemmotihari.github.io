import { cx } from "./cx.js";

export function TabList({ label, items, value, onChange }) {
  return (
    <nav className="view-tabs" role="tablist" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={cx("tab", value === item.id && "is-active")}
          role="tab"
          aria-selected={value === item.id}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
