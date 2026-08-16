import { cx } from "./cx.js";

export function StatusMessage({ tone = "muted", className = "", children }) {
  return (
    <p className={cx(tone === "error" ? "load-err" : "brand-sub", className)}>
      {children}
    </p>
  );
}
