import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { GOATCOUNTER_CODE } from "../constants/site.js";

const SCRIPT_ID = "goatcounter-script";
export const VISIT_EVENT = "mce-visit";

function pagePath(location) {
  return location.pathname + location.search + location.hash || "/";
}

function ensureScript() {
  if (!GOATCOUNTER_CODE || document.getElementById(SCRIPT_ID)) return;

  window.goatcounter = {
    ...(window.goatcounter || {}),
    no_onload: true,
    allow_local: true,
  };

  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.async = true;
  script.src = "https://gc.zgo.at/count.js";
  script.dataset.goatcounter = `https://${GOATCOUNTER_CODE}.goatcounter.com/count`;
  document.body.appendChild(script);
}

function notifyVisit() {
  window.dispatchEvent(new Event(VISIT_EVENT));
}

function countPageview(path) {
  if (typeof window.goatcounter?.count !== "function") return false;
  window.goatcounter.count({ path });
  notifyVisit();
  return true;
}

export default function Analytics() {
  const location = useLocation();
  const path = pagePath(location);
  const pending = useRef(path);

  useEffect(() => {
    if (!GOATCOUNTER_CODE) return undefined;
    ensureScript();
    pending.current = path;

    if (countPageview(path)) return undefined;

    const timer = window.setInterval(() => {
      if (countPageview(pending.current)) window.clearInterval(timer);
    }, 200);

    return () => window.clearInterval(timer);
  }, [path]);

  return null;
}
