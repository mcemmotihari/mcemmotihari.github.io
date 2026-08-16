export const timetableModule = {
  id: "timetable",
  title: "Department Timetable",
  navLabel: "Timetable",
  blurb: "Class, faculty and room grids. Excel / PDF download.",
  path: "/timetable",
  enabled: true,
  load: () => import("./TimetablePage.jsx"),
};
