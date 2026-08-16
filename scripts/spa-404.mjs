import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { modules } from "../src/modules/registry.js";

const dist = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const index = join(dist, "index.html");

copyFileSync(index, join(dist, "404.html"));
writeFileSync(join(dist, ".nojekyll"), "");

for (const mod of modules) {
  const slug = String(mod.path || "").replace(/^\/+|\/+$/g, "");
  if (!slug) continue;
  const dir = join(dist, ...slug.split("/"));
  mkdirSync(dir, { recursive: true });
  copyFileSync(index, join(dir, "index.html"));
}
