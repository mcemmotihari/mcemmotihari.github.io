import { useEffect, useState } from "react";

const HITS_URL = "https://hitscounter.dev/api/hit?url=https://mcemmotihari.github.io";

let cachedTotal = "";
let pending;

function parseTotal(svg) {
  const label = String(svg).match(/aria-label="([^"]+)"/)?.[1] || "";
  const parts = label.split("/");
  return (parts[1] || parts[0] || "").trim();
}

function loadTotal() {
  if (cachedTotal) return Promise.resolve(cachedTotal);
  if (pending) return pending;

  pending = fetch(HITS_URL, { cache: "no-store" })
    .then((res) => (res.ok ? res.text() : ""))
    .then((svg) => {
      const total = parseTotal(svg);
      if (total) cachedTotal = total;
      return total;
    })
    .catch(() => "")
    .finally(() => {
      pending = null;
    });

  return pending;
}

export default function VisitorCount() {
  const [count, setCount] = useState(cachedTotal || "0");

  useEffect(() => {
    let alive = true;
    loadTotal().then((value) => {
      if (alive && value) setCount(value);
    });
    return () => {
      alive = false;
    };
  }, []);

  return <p className="visitor-count">{count} visitors</p>;
}
