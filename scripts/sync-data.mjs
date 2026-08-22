import { cpSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "data");
const dest = join(root, "public", "data");

mkdirSync(dest, { recursive: true });

/** Copy data into public/, skipping frozen history editions (git keeps those). */
function copyFiltered(fromDir, toDir) {
  mkdirSync(toDir, { recursive: true });
  for (const entry of readdirSync(fromDir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    if (entry.name === "history") continue;
    const from = join(fromDir, entry.name);
    const to = join(toDir, entry.name);
    if (entry.isDirectory()) copyFiltered(from, to);
    else cpSync(from, to);
  }
}

copyFiltered(src, dest);
