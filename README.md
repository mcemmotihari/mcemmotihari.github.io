# MCE Motihari Timetable

Edit the CSV files under `data/`, open a **pull request against `main`**, and merge.  
GitHub Actions then rebuilds the site and updates [GitHub Pages](https://mcemmotihari.github.io).

---

## How to edit an existing timetable

1. Create a branch from `main` (or edit on GitHub → “Create a new branch”).
2. Open **`data/slots.csv`** and change the row you need.
3. If the faculty / room / subject name is new, also update:
   - `data/faculties.csv`
   - `data/rooms.csv`
   - `data/subjects.csv`
   - `data/offerings.csv` (section + subject + faculty link)
4. Open a **Pull Request → `main`**.
5. Wait for the CI check to pass, then merge.
6. Pages updates automatically after merge.

### `slots.csv` columns

| Column | Meaning | Example |
|--------|---------|---------|
| `id` | Unique slot id | `S0190` |
| `section_id` | Class batch | `CSE-3` |
| `day` | `MON` … `SAT` | `MON` |
| `period` | `1` … `6` | `2` |
| `subject_code` | Paper code | `105303` |
| `subject_short` | Short name | `OOP` |
| `type` | `L` / `T` / `P` | `P` |
| `group` | Lab batch (optional) | `G1` |
| `room_id` | Room number | `134` |
| `faculty_id` | From `faculties.csv` | `md-sharique-eliyas` |
| `notes` | Optional note | |

**Parallel labs** = two rows, same `day` + `period`, different `group` / `room_id`.

---

## How to add a new branch / semester

1. Add a row in **`data/sections.csv`**  
   Example: `EEE-3,EEE,Electrical and Electronics Engineering,3,EEE,2025-29,2026-27,13/08/2026,EEE Sem 3`
2. Add new subjects in **`data/subjects.csv`** (skip if they already exist).
3. Add faculty / rooms in **`data/faculties.csv`** and **`data/rooms.csv`** if needed.
4. Link them in **`data/offerings.csv`**: `section_id,subject_code,faculty_id`
5. Add all periods in **`data/slots.csv`**
6. Open a **Pull Request → `main`** and merge.

Same process works for every department in the college.

---

## Pull request checklist

- [ ] Only data CSVs changed (unless fixing the site)
- [ ] New `faculty_id` / `room_id` / `subject_code` exist in their master CSV
- [ ] CI “Validate timetable data” is green

You do **not** need to run any script for Pages — Actions builds `timetable.json` on merge.

Optional local preview:

```bash
python3 scripts/build_json.py
python3 -m http.server 8080
```

---

**Maintainers (once):** Settings → Pages → Source → **GitHub Actions**.
