import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./shell/Layout.jsx";
import Home from "./shell/Home.jsx";
import { enabledModules } from "./modules/registry.js";

const pages = Object.fromEntries(enabledModules().map((mod) => [mod.id, lazy(mod.load)]));

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        {enabledModules().map((mod) => {
          const Page = pages[mod.id];
          const routePath = `${String(mod.path).replace(/^\/+|\/+$/g, "")}/*`;
          return (
            <Route
              key={mod.id}
              path={routePath}
              element={
                <Suspense fallback={<p className="brand-sub">Loading…</p>}>
                  <Page />
                </Suspense>
              }
            />
          );
        })}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
