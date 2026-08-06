import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("navigation links render a provider SVG icon beside each service name", async () => {
  const source = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");

  assert.match(source, /function NavigationServiceIcon/);
  assert.match(source, /<NavigationServiceIcon provider=\{link\.provider\}/);
  assert.match(source, /provider: "naver"/);
  assert.match(source, /provider: "tmap"/);
  assert.match(source, /provider: "kakao"/);
});

test("the optional GitHub button opens the Wedding Letter Codex repository from the top left", async () => {
  const source = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

  assert.match(source, /function GitHubIcon/);
  assert.match(source, /content\.sharing\.githubButton\.enabled[\s\S]*?className="github-button"/);
  assert.match(source, /href="https:\/\/github\.com\/GirinMan\/wedding-letter-codex"/);
  assert.match(source, /target="_blank"/);
  assert.match(source, /rel="noreferrer"/);
  assert.match(styles, /\.floating-menu-button,\s*\.github-button\s*\{[^}]*position:\s*fixed;/s);
  assert.match(styles, /\.github-button\s*\{[^}]*top:\s*20px;[^}]*left:/s);
});
