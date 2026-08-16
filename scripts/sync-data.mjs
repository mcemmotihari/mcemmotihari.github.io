import { cpSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "data");
const dest = join(root, "public", "data");

mkdirSync(dest, { recursive: true });

for (const name of readdirSync(src)) {
  if (name.startsWith(".")) continue;
  cpSync(join(src, name), join(dest, name));
}
