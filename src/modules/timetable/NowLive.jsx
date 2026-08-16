import { cx } from "../../ui/cx.js";

export default function NowLive({ label = "Running now" }) {
  return (
    <span className="now-live">
      <span className="now-live-dot" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export function NowProgress({ value, tone = "live" }) {
  const pct = Math.min(1, Math.max(0, Number(value) || 0));
  return (
    <span className={cx("now-progress", `is-${tone}`)} aria-hidden="true">
      <span style={{ transform: `scaleX(${pct})` }} />
    </span>
  );
}
