import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const output = join(root, "dist");
const files = ["index.html", "styles.css", "manifest.webmanifest", "icon.svg", "sw.js"];

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
for (const file of files) cpSync(join(root, file), join(output, file));
cpSync(join(root, "src"), join(output, "src"), { recursive: true });
writeFileSync(join(output, ".nojekyll"), "");

const html = readFileSync(join(output, "index.html"), "utf8");
if (/\b(?:src|href)=["']\//.test(html)) throw new Error("Absolute asset URL found; GitHub Pages requires relative URLs.");
if (!html.includes("manifest.webmanifest")) throw new Error("Web app manifest is not linked.");

const version = process.env.GITHUB_SHA?.slice(0, 7) || "development";
writeFileSync(join(output, "version.json"), JSON.stringify({ version, builtAt: new Date().toISOString() }, null, 2));
console.log(`Built PyroWorks ${version} into dist/ (${files.length + 3} deployable assets)`);
