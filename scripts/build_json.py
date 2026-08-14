#!/usr/bin/env python3
"""Build data/timetable.json from CSV/YAML sources for the static site."""

from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"


def read_csv(name: str) -> list[dict]:
    path = DATA / name
    with path.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


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


def find_conflicts(slots: list[dict]) -> dict:
    faculty_conflicts = []
    room_conflicts = []
    section_conflicts = []

    def collect(key_fn, bucket, label_keys):
        groups: dict[tuple, list] = {}
        for s in slots:
            key = key_fn(s)
            if key is None:
                continue
            groups.setdefault(key, []).append(s)
        for key, items in groups.items():
            if len(items) > 1:
                # parallel lab groups for same section/subject are OK for section? 
                # For section: same section+day+period with different groups is OK
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

    def faculty_key(s):
        if not s.get("faculty_id"):
            return None
        return (s["day"], s["period"], s["faculty_id"])

    def room_key(s):
        if not s.get("room_id"):
            return None
        return (s["day"], s["period"], s["room_id"])

    # Section conflict only when same group (or both empty) overlap
    section_groups: dict[tuple, list] = {}
    for s in slots:
        g = s.get("group") or ""
        key = (s["day"], s["period"], s["section_id"], g)
        section_groups.setdefault(key, []).append(s)
    for key, items in section_groups.items():
        # Also catch two empty-group lectures in same cell (shouldn't happen)
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

    # For section: different groups at same time are intentional (parallel labs)
    # But two different subjects with empty group is a conflict — handled above.
    # Cross-group check: if one slot has no group and another has group, still OK for labs vs free? skip.

    collect(faculty_key, faculty_conflicts, ["day", "period", "faculty_id"])
    collect(room_key, room_conflicts, ["day", "period", "room_id"])

    # Filter faculty conflicts where two entries are the same parallel teaching? keep all for review
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
        rec["hours"] += 1
        t = s.get("type") or "L"
        if t in rec:
            rec[t] += 1
    return sorted(loads.values(), key=lambda r: (-r["hours"], r["faculty_name"]))


def ltp_check(slots: list[dict], offerings: list[dict], subjects: dict) -> list[dict]:
    """Compare scheduled weekly L/T/P counts vs subject L-T-P for each offering."""
    counts: dict[tuple[str, str], dict] = {}
    for s in slots:
        key = (s["section_id"], s["subject_code"])
        rec = counts.setdefault(key, {"L": 0, "T": 0, "P": 0})
        t = s.get("type") or "L"
        if t in rec:
            rec[t] += 1

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
    offerings = read_csv("offerings.csv")
    slots_raw = read_csv("slots.csv")

    sections_i = index_by(sections, "id")
    faculties_i = index_by(faculties, "id")
    rooms_i = index_by(rooms, "id")
    subjects_i = index_by(subjects, "code")

    slots = enrich_slots(slots_raw, subjects_i, faculties_i, rooms_i, sections_i)
    conflicts = find_conflicts(slots)
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
        "derived": {
            "conflicts": conflicts,
            "faculty_load": loads,
            "ltp_check": ltp,
        },
    }

    out = DATA / "timetable.json"
    out.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {out} ({len(slots)} slots)")
    print(
        f"Conflicts — faculty: {len(conflicts['faculty'])}, "
        f"room: {len(conflicts['room'])}, section: {len(conflicts['section'])}"
    )


if __name__ == "__main__":
    main()
