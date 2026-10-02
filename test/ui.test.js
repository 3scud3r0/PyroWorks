import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

test("the experience opens in cinematic mode instead of the editor", () => {
  assert.match(html, /<body class="cinematic-home">/);
  assert.match(html, /id="cinematicPlay"/);
  assert.match(html, /id="openStudioButton"/);
  assert.match(css, /\.cinematic-home \.topbar[^}]+display:none/);
});

test("cinematic mode keeps essential controls accessible", () => {
  for (const id of ["cinematicPlay", "openStudioButton", "cinematicCamera", "cinematicSound", "cinematicFullscreen"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});
