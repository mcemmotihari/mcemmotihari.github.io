import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./shell/Layout.jsx";
import Home from "./shell/Home.jsx";
import Analytics from "./shell/Analytics.jsx";
import { StatusMessage } from "./ui/StatusMessage.jsx";
import { enabledModules } from "./modules/registry.js";

const modules = enabledModules();
const pages = Object.fromEntries(modules.map((mod) => [mod.id, lazy(mod.load)]));

function modulePath(path) {
  return `${String(path).replace(/^\/+|\/+$/g, "")}/*`;
}

export default function App() {
  return (
    <>
      <Analytics />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          {modules.map((mod) => {
            const Page = pages[mod.id];
            return (
              <Route
                key={mod.id}
                path={modulePath(mod.path)}
                element={
                  <Suspense fallback={<StatusMessage>Loading…</StatusMessage>}>
                    <Page />
                  </Suspense>
                }
              />
            );
          })}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}
