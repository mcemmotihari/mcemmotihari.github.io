---
name: Site change
about: Data or frontend
title: ""
labels: ""
---

## What changed?

- [ ] Timetable CSVs
- [ ] Frontend / a module under `src/modules/`

## Files touched

-

## Checklist

- [ ] New ids exist in the master CSVs (`faculties`, `rooms`, `subjects`, `sections`)
- [ ] Each class is edited in `data/schedules/<section-id>/` (not a single global slots file)
- [ ] Finished semesters are `archived` in `sections.csv` rather than deleted
- [ ] Parallel labs use two rows (same day+period, different group/room)
- [ ] Multi-hour labs/lectures use one row with `hours` > 1 (starting `period` only)
- [ ] PR targets **main**
