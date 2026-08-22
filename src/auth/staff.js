import { STAFF_SESSION_KEY } from "../constants/site.js";

/**
 * SHA-256 hex of the staff PIN. Override at build time with VITE_STAFF_PIN_HASH
 * (GitHub Actions secret STAFF_PIN_HASH). This only hides extra UI on a public
 * Pages site; timetable.json remains downloadable.
 */
export const STAFF_PIN_HASH = String(
  import.meta.env.VITE_STAFF_PIN_HASH ||
    "bfdcab7acaa8967856c62eaf0df1e9c872cb0b081cfa16f964182d8d54704471"
)
  .trim()
  .toLowerCase();

export async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function hashesEqual(left, right) {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) {
    diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return diff === 0;
}

function sessionToken() {
  return STAFF_PIN_HASH.slice(0, 20);
}

export function readStaffSession() {
  try {
    return localStorage.getItem(STAFF_SESSION_KEY) === sessionToken();
  } catch {
    return false;
  }
}

export function writeStaffSession(on) {
  try {
    if (on) localStorage.setItem(STAFF_SESSION_KEY, sessionToken());
    else localStorage.removeItem(STAFF_SESSION_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}

export function timetableViewFromPath(pathname) {
  const rest = String(pathname || "").replace(/^\/timetable\/?/, "");
  if (rest === "faculty" || rest.startsWith("faculty/")) return "faculty";
  if (rest === "room" || rest.startsWith("room/")) return "room";
  if (rest === "tools" || rest.startsWith("tools/")) return "tools";
  return "section";
}

export function pathForTimetableView(view) {
  if (view === "faculty") return "/timetable/faculty";
  if (view === "room") return "/timetable/room";
  if (view === "tools") return "/timetable/tools";
  return "/timetable";
}
