import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { GOATCOUNTER_CODE } from "../constants/site.js";

const counted = new Set();

function pagePath(location) {
  return location.pathname + location.search + location.hash || "/";
}

function sendHit(path) {
  if (!GOATCOUNTER_CODE || counted.has(path)) return;
  counted.add(path);

  const url =
    `https://${GOATCOUNTER_CODE}.goatcounter.com/count?` +
    new URLSearchParams({
      p: path,
      t: document.title || "MCE Motihari",
      s: String(window.screen?.width || 0),
      rnd: Math.random().toString(36).slice(2, 8),
    });

  const img = new Image(1, 1);
  img.alt = "";
  img.referrerPolicy = "no-referrer-when-downgrade";
  img.src = url;
}

export default function Analytics() {
  const location = useLocation();
  const path = pagePath(location);
  const last = useRef("");

  useEffect(() => {
    if (last.current === path) return;
    last.current = path;
    sendHit(path);
  }, [path]);

  return null;
}
