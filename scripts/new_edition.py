#!/usr/bin/env python3
"""Freeze the current timetable for a section, then set a new w.e.f.

Copies data/schedules/<section>/slots.csv and offerings.csv into
history/<old-wef-ISO>/, then updates the w.e.f. in sections.csv.
Current files are left in place as the starting point for the new grid.

  python3 scripts/new_edition.py CSE-3 --wef 01/09/2026
"""

from __future__ import annotations

import argparse
import csv
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_json import DATA, SCHEDULES, iso_to_wef, wef_to_iso

SECTIONS = DATA / "sections.csv"


def read_sections() -> tuple[list[str], list[dict]]:
    with SECTIONS.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames or [])
        return fieldnames, list(reader)


def write_sections(fieldnames: list[str], rows: list[dict]) -> None:
    with SECTIONS.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("section_id", help="Section id, e.g. CSE-3")
    parser.add_argument("--wef", required=True, help="New w.e.f. as DD/MM/YYYY")
    parser.add_argument("--force", action="store_true", help="Overwrite an existing history folder")
    args = parser.parse_args()

    fieldnames, rows = read_sections()
    section = next((row for row in rows if row.get("id") == args.section_id), None)
    if not section:
        sys.exit(f"Unknown section {args.section_id}. Add it in data/sections.csv first.")

    try:
        new_iso = wef_to_iso(args.wef)
        old_iso = wef_to_iso(section.get("wef") or "")
    except ValueError as err:
        sys.exit(str(err))

    if new_iso == old_iso:
        sys.exit("New w.e.f. is the same as the current one.")

    src = SCHEDULES / args.section_id
    if not (src / "slots.csv").exists():
        sys.exit(f"Missing {src / 'slots.csv'}")

    dest = src / "history" / old_iso
    if dest.exists() and not args.force:
        sys.exit(f"{dest} already exists. Use --force to overwrite.")

    dest.mkdir(parents=True, exist_ok=True)
    for name in ("slots.csv", "offerings.csv"):
        file = src / name
        if file.exists():
            shutil.copy2(file, dest / name)

    section["wef"] = iso_to_wef(new_iso)
    write_sections(fieldnames, rows)

    print(f"Archived {args.section_id} w.e.f. {iso_to_wef(old_iso)} → {dest}")
    print(f"Updated sections.csv w.e.f. to {section['wef']}")
    print(f"Edit {src / 'slots.csv'} (and offerings.csv) for the new edition, then open a PR.")


if __name__ == "__main__":
    main()
