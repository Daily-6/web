import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "backend", "data");
mkdirSync(outDir, { recursive: true });

const endpoints = ["teams", "games", "stadiums", "groups"];
for (const ep of endpoints) {
  try {
    const res = await fetch(`https://worldcup26.ir/get/${ep}`);
    const data = await res.json();
    const filePath = join(outDir, `${ep}.json`);
    writeFileSync(filePath, JSON.stringify(data));
    const key = Object.keys(data)[0];
    console.log(`${ep}.json saved (${data[key].length} items)`);
  } catch (err) {
    console.error(`Failed to fetch ${ep}:`, err.message);
  }
}
