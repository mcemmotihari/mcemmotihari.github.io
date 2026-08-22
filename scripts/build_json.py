#!/usr/bin/env python3
"""Build data/timetable.json from CSV/YAML sources for the static site."""

from __future__ import annotations

import csv
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
SCHEDULES = DATA / "schedules"

ISO_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
DMY_DATE = re.compile(r"^(\d{1,2})/(\d{1,2})/(\d{4})$")


def read_csv(name: str) -> list[dict]:
    return read_csv_path(DATA / name)


def read_csv_path(path: Path) -> list[dict]:
    with path.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def is_active(section: dict) -> bool:
    return str(section.get("status") or "active").strip().lower() == "active"


def wef_to_iso(wef: str) -> str:
    value = str(wef or "").strip()
    if ISO_DATE.match(value):
        return value
    match = DMY_DATE.match(value)
    if not match:
        raise ValueError(f"Unrecognised w.e.f date: {wef!r} (use DD/MM/YYYY)")
    day, month, year = match.groups()
    return f"{year}-{int(month):02d}-{int(day):02d}"


def iso_to_wef(iso: str) -> str:
    year, month, day = iso.split("-")
    return f"{day}/{month}/{year}"


def history_editions(section_id: str) -> list[dict]:
    hist = SCHEDULES / section_id / "history"
    if not hist.is_dir():
        return []
    editions = []
    for child in sorted(hist.iterdir()):
        if not child.is_dir():
            continue
        if not (child / "slots.csv").exists() and not (child / "offerings.csv").exists():
            continue
        wef = iso_to_wef(child.name) if ISO_DATE.match(child.name) else child.name
        editions.append({"wef": wef, "folder": child.name})
    return editions


def attach_editions(sections: list[dict]) -> None:
    for section in sections:
        section["editions"] = {
            "current_wef": section.get("wef", ""),
            "history": history_editions(section["id"]),
        }


def load_schedules(sections: list[dict]) -> tuple[list[dict], list[dict]]:
    slots: list[dict] = []
    offerings: list[dict] = []
    seen_slot_ids: set[str] = set()

    for section in sections:
        sid = section["id"]
        folder = SCHEDULES / sid
        slot_path = folder / "slots.csv"
        off_path = folder / "offerings.csv"
        active = is_active(section)

        if active and not slot_path.exists():
            sys.exit(f"Active section {sid} is missing {slot_path}")

        if not is_active(section):
            continue

        if slot_path.exists():
            for row in read_csv_path(slot_path):
                row_sid = (row.get("section_id") or sid).strip()
                if row_sid != sid:
                    sys.exit(f"{slot_path}: slot {row.get('id')} has section_id {row_sid}, expected {sid}")
                row["section_id"] = sid
                slot_id = row.get("id") or ""
                if slot_id in seen_slot_ids:
                    sys.exit(f"Duplicate slot id {slot_id} (last seen in {slot_path})")
                seen_slot_ids.add(slot_id)
                slots.append(row)

        if off_path.exists():
            for row in read_csv_path(off_path):
                row_sid = (row.get("section_id") or sid).strip()
                if row_sid != sid:
                    sys.exit(f"{off_path}: offering has section_id {row_sid}, expected {sid}")
                row["section_id"] = sid
                offerings.append(row)

    return slots, offerings


def load_history(sections, subjects_i, faculties_i, rooms_i, sections_i) -> dict[str, list]:
    """Earlier editions from schedules/<id>/history/<ISO-date>/, keyed by section id."""
    history: dict[str, list] = {}
    for section in sections:
        sid = section["id"]
        editions = []
        for item in history_editions(sid):
            folder = SCHEDULES / sid / "history" / item["folder"]
            slot_path = folder / "slots.csv"
            off_path = folder / "offerings.csv"
            slots_raw = read_csv_path(slot_path) if slot_path.exists() else []
            offerings = read_csv_path(off_path) if off_path.exists() else []
            for row in slots_raw:
                row["section_id"] = sid
            for row in offerings:
                row["section_id"] = sid
            editions.append(
                {
                    "wef": item["wef"],
                    "folder": item["folder"],
                    "slots": enrich_slots(slots_raw, subjects_i, faculties_i, rooms_i, sections_i),
                    "offerings": offerings,
                }
            )
        if editions:
            history[sid] = editions
    return history


def read_meta() -> dict:
    # Minimal YAML subset reader (no PyYAML dependency)
    meta: dict = {"days": [], "periods": [], "breaks": []}
    section = None
    current_period: dict | None = None
    current_break: dict | None = None
    notes_lines: list[str] = []
    in_notes = False

    for raw in (DATA / "meta.yaml").read_text(encoding="utf-8").splitlines():
        line = raw.rstrip()
        if not line or line.lstrip().startswith("#"):
            continue
        if in_notes:
            if line.startswith("  "):
                notes_lines.append(line[2:])
                continue
            in_notes = False
            meta["notes"] = "\n".join(notes_lines).strip()
        if line.startswith("college:"):
            meta["college"] = line.split(":", 1)[1].strip()
        elif line.startswith("college_short:"):
            meta["college_short"] = line.split(":", 1)[1].strip()
        elif line.startswith("timezone:"):
            meta["timezone"] = line.split(":", 1)[1].strip()
        elif line.startswith("notes:"):
            in_notes = True
            notes_lines = []
        elif line == "days:":
            section = "days"
        elif line == "periods:":
            section = "periods"
        elif line == "breaks:":
            section = "breaks"
        elif line.startswith("  - ") and section == "days":
            meta["days"].append(line[4:].strip())
        elif line.startswith("  - id:") and section == "periods":
            current_period = {"id": int(line.split(":", 1)[1].strip())}
            meta["periods"].append(current_period)
        elif line.startswith("    label:") and current_period is not None and section == "periods":
            current_period["label"] = line.split(":", 1)[1].strip().strip('"')
        elif line.startswith("    start:") and current_period is not None and section == "periods":
            current_period["start"] = line.split(":", 1)[1].strip().strip('"')
        elif line.startswith("    end:") and current_period is not None and section == "periods":
            current_period["end"] = line.split(":", 1)[1].strip().strip('"')
        elif line.startswith("  - after_period:") and section == "breaks":
            current_break = {"after_period": int(line.split(":", 1)[1].strip())}
            meta["breaks"].append(current_break)
        elif line.startswith("    label:") and current_break is not None and section == "breaks":
            current_break["label"] = line.split(":", 1)[1].strip()
        elif line.startswith("    start:") and current_break is not None and section == "breaks":
            current_break["start"] = line.split(":", 1)[1].strip().strip('"')
        elif line.startswith("    end:") and current_break is not None and section == "breaks":
            current_break["end"] = line.split(":", 1)[1].strip().strip('"')

    if in_notes:
        meta["notes"] = "\n".join(notes_lines).strip()
    return meta


def parse_hours(value) -> int:
    try:
        hours = int(value)
    except (TypeError, ValueError):
        hours = 1
    return hours if hours > 0 else 1


def lunch_after(meta: dict) -> int:
    breaks = meta.get("breaks") or []
    if breaks and breaks[0].get("after_period") is not None:
        return int(breaks[0]["after_period"])
    return 3


def max_period_id(meta: dict) -> int:
    periods = meta.get("periods") or []
    return max((int(p["id"]) for p in periods), default=6)


def occupied_periods(slot: dict, meta: dict) -> list[int]:
    start = int(slot["period"])
    hours = parse_hours(slot.get("hours"))
    after = lunch_after(meta)
    last = max_period_id(meta)
    ids = []
    for i in range(hours):
        pid = start + i
        if pid > last:
            break
        if start <= after and pid > after:
            break
        ids.append(pid)
    return ids or [start]


def index_by(rows: list[dict], key: str) -> dict:
    return {r[key]: r for r in rows}


def enrich_slots(slots, subjects, faculties, rooms, sections) -> list[dict]:
    out = []
    for s in slots:
        subj = subjects.get(s["subject_code"], {})
        fac = faculties.get(s["faculty_id"], {})
        room = rooms.get(s["room_id"], {})
        sec = sections.get(s["section_id"], {})
        out.append(
            {
                **s,
                "period": int(s["period"]) if s.get("period") else None,
                "hours": parse_hours(s.get("hours")),
                "subject_name": subj.get("name", ""),
                "faculty_name": fac.get("name", ""),
                "room_name": room.get("name", s.get("room_id", "")),
                "section_label": sec.get("label", s["section_id"]),
                "program": sec.get("program", ""),
                "semester": int(sec["semester"]) if sec.get("semester") else None,
                "department": sec.get("department", ""),
            }
        )
    return out


def find_conflicts(slots: list[dict], meta: dict) -> dict:
    faculty_conflicts = []
    room_conflicts = []
    section_conflicts = []

    def collect(key_fn, bucket, label_keys):
        groups: dict[tuple, list] = {}
        for s in slots:
            for pid in occupied_periods(s, meta):
                key = key_fn(s, pid)
                if key is None:
                    continue
                groups.setdefault(key, []).append(s)
        for key, items in groups.items():
            if len(items) > 1:
                bucket.append(
                    {
                        **{k: v for k, v in zip(label_keys, key)},
                        "count": len(items),
                        "slot_ids": [i["id"] for i in items],
                        "summaries": [
                            f"{i['subject_short']} ({i['section_id']})" + (f" {i['group']}" if i.get("group") else "")
                            for i in items
                        ],
                    }
                )

    def faculty_key(s, pid):
        if not s.get("faculty_id"):
            return None
        return (s["day"], pid, s["faculty_id"])

    def room_key(s, pid):
        if not s.get("room_id"):
            return None
        return (s["day"], pid, s["room_id"])

    section_groups: dict[tuple, list] = {}
    for s in slots:
        g = s.get("group") or ""
        for pid in occupied_periods(s, meta):
            key = (s["day"], pid, s["section_id"], g)
            section_groups.setdefault(key, []).append(s)
    for key, items in section_groups.items():
        if len(items) > 1:
            section_conflicts.append(
                {
                    "day": key[0],
                    "period": key[1],
                    "section_id": key[2],
                    "group": key[3],
                    "count": len(items),
                    "slot_ids": [i["id"] for i in items],
                    "summaries": [i["subject_short"] for i in items],
                }
            )

    collect(faculty_key, faculty_conflicts, ["day", "period", "faculty_id"])
    collect(room_key, room_conflicts, ["day", "period", "room_id"])

    return {
        "faculty": faculty_conflicts,
        "room": room_conflicts,
        "section": section_conflicts,
    }


def faculty_load(slots: list[dict], faculties: dict) -> list[dict]:
    loads: dict[str, dict] = {}
    for s in slots:
        fid = s.get("faculty_id")
        if not fid:
            continue
        rec = loads.setdefault(
            fid,
            {
                "faculty_id": fid,
                "faculty_name": faculties.get(fid, {}).get("name", fid),
                "hours": 0,
                "L": 0,
                "T": 0,
                "P": 0,
            },
        )
        rec["hours"] += parse_hours(s.get("hours"))
        t = s.get("type") or "L"
        if t in rec:
            rec[t] += parse_hours(s.get("hours"))
    return sorted(loads.values(), key=lambda r: (-r["hours"], r["faculty_name"]))


def ltp_check(slots: list[dict], offerings: list[dict], subjects: dict) -> list[dict]:
    """Compare scheduled weekly L/T/P counts vs subject L-T-P for each offering."""
    counts: dict[tuple[str, str], dict] = {}
    for s in slots:
        key = (s["section_id"], s["subject_code"])
        rec = counts.setdefault(key, {"L": 0, "T": 0, "P": 0})
        t = s.get("type") or "L"
        if t in rec:
            rec[t] += parse_hours(s.get("hours"))

    rows = []
    for off in offerings:
        key = (off["section_id"], off["subject_code"])
        sub = subjects.get(off["subject_code"], {})
        scheduled = counts.get(key, {"L": 0, "T": 0, "P": 0})
        required = {
            "L": int(sub["L"]) if sub.get("L") not in (None, "") else 0,
            "T": int(sub["T"]) if sub.get("T") not in (None, "") else 0,
            "P": int(sub["P"]) if sub.get("P") not in (None, "") else 0,
        }
        ok = (
            scheduled["L"] == required["L"]
            and scheduled["T"] == required["T"]
            and scheduled["P"] == required["P"]
        )
        rows.append(
            {
                "section_id": off["section_id"],
                "subject_code": off["subject_code"],
                "subject_short": sub.get("short", ""),
                "required": f"{required['L']}-{required['T']}-{required['P']}",
                "scheduled": f"{scheduled['L']}-{scheduled['T']}-{scheduled['P']}",
                "ok": ok,
            }
        )
    return rows


def main() -> None:
    meta = read_meta()
    sections = read_csv("sections.csv")
    faculties = read_csv("faculties.csv")
    rooms = read_csv("rooms.csv")
    subjects = read_csv("subjects.csv")
    attach_editions(sections)
    slots_raw, offerings = load_schedules(sections)

    sections_i = index_by(sections, "id")
    faculties_i = index_by(faculties, "id")
    rooms_i = index_by(rooms, "id")
    subjects_i = index_by(subjects, "code")

    slots = enrich_slots(slots_raw, subjects_i, faculties_i, rooms_i, sections_i)
    history = load_history(sections, subjects_i, faculties_i, rooms_i, sections_i)
    conflicts = find_conflicts(slots, meta)
    loads = faculty_load(slots, faculties_i)
    ltp = ltp_check(slots, offerings, subjects_i)

    payload = {
        "meta": meta,
        "sections": sections,
        "faculties": faculties,
        "rooms": rooms,
        "subjects": subjects,
        "offerings": offerings,
        "slots": slots,
        "history": history,
        "derived": {
            "conflicts": conflicts,
            "faculty_load": loads,
            "ltp_check": ltp,
        },
    }

    out = DATA / "timetable.json"
    out.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    hist_n = sum(len(editions) for editions in history.values())
    print(
        f"Wrote {out} ({len(slots)} slots from {sum(1 for s in sections if is_active(s))} active sections"
        f", {hist_n} earlier editions)"
    )
    print(
        f"Conflicts — faculty: {len(conflicts['faculty'])}, "
        f"room: {len(conflicts['room'])}, section: {len(conflicts['section'])}"
    )


if __name__ == "__main__":
    main()
