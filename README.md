# MCE Motihari

College site on GitHub Pages. Timetable data still comes from CSVs; the UI is a Vite + React app.

Live: [mcemmotihari.github.io](https://mcemmotihari.github.io)

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

1. Branch from `main` (or edit on GitHub → “Create a new branch”).
2. Change the row in **`data/slots.csv`**.
3. If the faculty / room / subject is new, also update:
   - `data/faculties.csv`
   - `data/rooms.csv`
   - `data/subjects.csv`
   - `data/offerings.csv` (section + subject + faculty link)
4. Open a **Pull Request → `main`**.
5. Wait for CI, then merge. Pages updates after merge.

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

Same process for every department.

---

## Pull request checklist

- [ ] Data-only PRs: only CSVs changed
- [ ] New `faculty_id` / `room_id` / `subject_code` exist in their master CSV
- [ ] CI is green

You do not need to run the frontend locally for a data change. Actions rebuilds JSON and the site on merge.

**Maintainers (once):** Settings → Pages → Source → **GitHub Actions**.
