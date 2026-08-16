import { NavLink, Outlet, useLocation } from "react-router-dom";
import ThemeToggle from "./ThemeToggle.jsx";
import { enabledModules } from "../modules/registry.js";

export default function Layout() {
  const { pathname } = useLocation();
  const current = enabledModules().find((m) => pathname.startsWith(m.path));

  return (
    <>
      <div className="bg-grid" aria-hidden="true" />
      <header className="site-header">
        <div className="brand">
          <p className="brand-mark">MCE Motihari</p>
          <h1 className="brand-title">{current ? current.title : "Campus tools"}</h1>
        </div>
        <div className="header-bar">
          <nav className="app-nav" aria-label="Site">
            <NavLink to="/" end className={({ isActive }) => (isActive ? "is-active" : "")}>
              Home
            </NavLink>
            {enabledModules().map((mod) => (
              <NavLink
                key={mod.id}
                to={mod.path}
                className={({ isActive }) => (isActive ? "is-active" : "")}
              >
                {mod.navLabel}
              </NavLink>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="site-footer">
        <p>
          Timetable data lives in <code>data/*.csv</code>. Open a PR to <code>main</code> and
          merge — GitHub Actions rebuilds Pages.
        </p>
      </footer>
    </>
  );
}
