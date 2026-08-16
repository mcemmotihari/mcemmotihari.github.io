import { cx } from "./cx.js";

/**
 * Shared action control used on timetable, tools, and future module pages.
 */
export function Button({
  variant = "primary",
  className = "",
  type = "button",
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={cx(
        "btn",
        variant === "ghost" ? "btn-ghost" : "btn-primary",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
