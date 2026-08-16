import { cx } from "./cx.js";

/** Card surface shared by tools, wifi stub, and similar content. */
export function Panel({ as: Tag = "div", className = "", children, ...props }) {
  return (
    <Tag className={cx("panel", className)} {...props}>
      {children}
    </Tag>
  );
}
