import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DownloadIcon } from "./DownloadIcon.jsx";

const MENU_WIDTH = 168;

export function DownloadMenu({ busy, onExcel, onPdf }) {
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
        className="icon-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Download timetable"
        disabled={!!busy}
        onClick={() => setOpen((value) => !value)}
      >
        <DownloadIcon />
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
