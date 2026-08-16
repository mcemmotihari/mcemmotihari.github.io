import { Link, Outlet, useLocation } from "react-router-dom";
import { COLLEGE_NAME, SITE_NAME } from "../constants/site.js";
import { enabledModules } from "../modules/registry.js";
import ThemeToggle from "./ThemeToggle.jsx";

export default function Layout() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const current = enabledModules().find((mod) => pathname.startsWith(mod.path));

  if (isHome) {
    return <Outlet />;
  }

  return (
    <>
      <div className="bg-grid" aria-hidden="true" />
      <header className="site-header">
        <div className="brand">
          <p className="brand-mark">
            <Link to="/" className="brand-home">
              {SITE_NAME}
            </Link>
          </p>
          <h1 className="brand-title">{current ? current.title : "Campus tools"}</h1>
        </div>
        <ThemeToggle />
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="site-footer">
        <p>{COLLEGE_NAME} · Unofficial campus timetable</p>
      </footer>
    </>
  );
}
