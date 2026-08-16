import { useEffect, useState } from "react";
import { GOATCOUNTER_CODE } from "../constants/site.js";
import { VISIT_EVENT } from "./Analytics.jsx";

const COUNTER_URL = `https://${GOATCOUNTER_CODE}.goatcounter.com/counter/TOTAL.json`;

function readCount(data) {
  const value = data?.count ?? data?.count_unique;
  if (value == null || value === "") return "";
  return String(value);
}

function loadTotal(signal) {
  return fetch(`${COUNTER_URL}?t=${Date.now()}`, { signal, cache: "no-store" })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => readCount(data))
    .catch(() => "");
}

export default function VisitorCount() {
  const [count, setCount] = useState("0");

  useEffect(() => {
    if (!GOATCOUNTER_CODE) return undefined;
    const ctrl = new AbortController();

    const timers = [];
    const refresh = () => {
      loadTotal(ctrl.signal).then((value) => {
        if (value) setCount(value);
      });
    };
    const refreshSoon = () => {
      refresh();
      timers.push(window.setTimeout(refresh, 1500), window.setTimeout(refresh, 5000));
    };

    refresh();
    const poll = window.setInterval(refresh, 15_000);
    window.addEventListener(VISIT_EVENT, refreshSoon);

    return () => {
      ctrl.abort();
      window.clearInterval(poll);
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener(VISIT_EVENT, refreshSoon);
    };
  }, []);

  return <p className="visitor-count">{count} visitors</p>;
}
