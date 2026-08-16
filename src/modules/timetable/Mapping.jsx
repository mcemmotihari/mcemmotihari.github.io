import { DataTable } from "../../ui/DataTable.jsx";

const SHARED = [
  { key: "sno", label: "S.No.", thClass: "col-sno", render: (_row, i) => i + 1 },
  { key: "code", label: "Paper Code", thClass: "col-code", render: (row) => row.code },
  { key: "ltp", label: "L-T-P", thClass: "col-ltp", render: (row) => row.ltp },
  { key: "subject", label: "Subjects", render: (row) => row.subject },
  {
    key: "short",
    label: "Course Short Form",
    thClass: "col-short",
    render: (row) => row.short,
  },
];

const COLUMNS = {
  section: [...SHARED, { key: "faculty", label: "Faculty", render: (row) => row.faculty }],
  faculty: [
    ...SHARED,
    { key: "branch", label: "Branch", render: (row) => row.branch },
    { key: "semester", label: "Semester", render: (row) => row.semester },
  ],
  room: [
    ...SHARED,
    { key: "faculty", label: "Faculty", render: (row) => row.faculty },
    { key: "branch", label: "Branch", render: (row) => row.branch },
    { key: "semester", label: "Semester", render: (row) => row.semester },
  ],
};

export default function Mapping({ view, rows }) {
  const columns = COLUMNS[view] || COLUMNS.room;
  const useBranchKey = view !== "section";
  return (
    <DataTable
      className="excel-map"
      columns={columns}
      rows={rows}
      rowKey={(row, i) =>
        useBranchKey ? `${row.code}-${row.branch}-${i}` : `${row.code}-${i}`
      }
    />
  );
}
