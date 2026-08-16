import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cx } from "./cx.js";
import { DownloadIcon } from "./DownloadIcon.jsx";

const MENU_WIDTH = 168;

function CheckIcon() {
  return (
    <svg
      className="download-ico"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13.5 10 18l9-11"
      />
    </svg>
  );
}

export function DownloadMenu({ busy, downloaded, onExcel, onPdf }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const menuId = useId();

  useLayoutEffect(() => {
    if (!open || !rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    const left = Math.min(
      Math.max(12, rect.right - MENU_WIDTH),
      window.innerWidth - MENU_WIDTH - 12
    );
    setCoords({ top: rect.bottom + 8, left });
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    function onPointerDown(event) {
      const target = event.target;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }

    function onKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }

    const timer = window.setTimeout(() => {
      document.addEventListener("pointerdown", onPointerDown);
    }, 0);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function choose(action) {
    setOpen(false);
    action();
  }

  return (
    <div className="download-menu" ref={rootRef}>
      <button
        type="button"
        className={cx("icon-btn", busy && "is-busy", downloaded && !busy && "is-done")}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={
          busy ? "Preparing download" : downloaded ? "Downloaded" : "Download timetable"
        }
        disabled={!!busy}
        onClick={() => setOpen((value) => !value)}
      >
        {busy ? <span className="btn-spinner" aria-hidden="true" /> : null}
        {!busy && downloaded ? <CheckIcon /> : null}
        {!busy && !downloaded ? <DownloadIcon /> : null}
      </button>
      {open
        ? createPortal(
            <div
              ref={panelRef}
              id={menuId}
              className="download-menu-panel"
              role="menu"
              style={{ top: coords.top, left: coords.left }}
            >
              <button type="button" role="menuitem" onClick={() => choose(onExcel)}>
                Excel
              </button>
              <button type="button" role="menuitem" onClick={() => choose(onPdf)}>
                PDF
              </button>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
