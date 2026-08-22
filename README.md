# MCE Motihari

College site on GitHub Pages. Timetable data still comes from CSVs; the UI is a Vite + React app.

Live: [mcemmotihari.github.io](https://mcemmotihari.github.io)

---

## Analytics (GoatCounter)

The site uses [GoatCounter](https://www.goatcounter.com/) for the dashboard (devices, browsers, referrers): [mcemotihari.goatcounter.com](https://mcemotihari.goatcounter.com).

The tiny footer number is a live hit total. GoatCounter’s own public counter is cached for up to four hours, so it is not used on the page.

---

## Local run

```bash
npm install
npm run dev
```

That rebuilds `data/timetable.json` from the CSVs and copies it into `public/data/` for the app.

```bash
npm run build
npm run preview
```

---

## Adding another tool (Wi-Fi, notices, …)

1. Make a folder under `src/modules/<name>/`.
2. Export a module object from `index.js` (`id`, `title`, `path`, `enabled`, `load`).
3. Register it in `src/modules/registry.js`.

The timetable module is the working example. Leave `enabled: false` until the page is ready.

---

## How to edit an existing timetable

Each **branch + semester** has its own files and its own **w.e.f.** (the `wef` column on that row in `data/sections.csv`).

1. Branch from `main` (or edit on GitHub → “Create a new branch”).
2. Change rows in **`data/schedules/<section-id>/slots.csv`**  
   Example: `data/schedules/CSE-3/slots.csv`
3. If the faculty / room / subject is new, also update:
   - `data/faculties.csv`
   - `data/rooms.csv`
   - `data/subjects.csv`
   - `data/schedules/<section-id>/offerings.csv`
4. Open a **Pull Request → `main`**.
5. Wait for CI, then merge. Pages updates after merge.

### New w.e.f. (keep the old timetable)

Do not overwrite the live CSVs until the previous edition is frozen:

```bash
python3 scripts/new_edition.py CSE-3 --wef 01/09/2026
```

That copies the current slots/offerings into `data/schedules/CSE-3/history/2026-08-13/` and sets the new date on the section. Then edit the current `slots.csv`. On the class timetable, an **Edition** dropdown lists the current grid and earlier w.e.f. dates so you can open the 13/08/2026 version after 26/08/2026 is published.

### Hide a semester that is not running

In `data/sections.csv`, set `status` to `archived` (for example when 6th sem ends). The folder is kept. Set it back to `active` to show it again.

When 7th sem starts, add a new row (`CSE-7`, `status=active`) and a new folder `data/schedules/CSE-7/`.

### `slots.csv` columns

| Column | Meaning | Example |
|--------|---------|---------|
| `id` | Unique slot id | `S0190` |
| `section_id` | Class batch | `CSE-3` |
| `day` | `MON` … `SAT` | `MON` |
| `period` | Start period `1` … `6` | `2` |
| `hours` | How many periods this class lasts (`1`, `2`, `3`, …). Does not cross lunch. | `2` |
| `subject_code` | Paper code | `105303` |
| `subject_short` | Short name | `OOP` |
| `type` | `L` / `T` / `P` | `P` |
| `group` | Lab batch (optional) | `G1` |
| `room_id` | Room number | `134` |
| `faculty_id` | From `faculties.csv` | `md-sharique-eliyas` |
| `notes` | Optional note | |

**Parallel labs** = two rows, same `day` + `period` + `hours`, different `group` / `room_id`.

**Multi-hour class** (2-hour lab, 3-hour workshop) = one row with `hours` set to `2` or `3`. `period` is the first hour. Do not list the later hours as extra rows.

---

## How to add a new branch / semester

1. Add a row in **`data/sections.csv`** with its own `wef` and `status=active`  
   Example: `EEE-3,EEE,Electrical and Electronics Engineering,3,EEE,2025-29,2026-27,13/08/2026,active,EEE Sem 3`
2. Add new subjects in **`data/subjects.csv`** (skip if they already exist).
3. Add faculty / rooms in **`data/faculties.csv`** and **`data/rooms.csv`** if needed.
4. Create **`data/schedules/EEE-3/offerings.csv`**: `section_id,subject_code,faculty_id`
5. Create **`data/schedules/EEE-3/slots.csv`** with that class’s periods
6. Open a **Pull Request → `main`** and merge.

Same process for every department.

---

## Pull request checklist

- [ ] Data-only PRs: only CSVs changed
- [ ] New `faculty_id` / `room_id` / `subject_code` exist in their master CSV
- [ ] CI is green

You do not need to run the frontend locally for a data change. Actions rebuilds JSON and the site on merge.

**Maintainers (once):** Settings → Pages → Source → **GitHub Actions**.
