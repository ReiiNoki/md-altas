import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BASE_PATH, WORKERS_ASSETS_DIRECTORY } from "../site.config.js";
import { prepareWorkersAssets } from "../scripts/prepare-workers-assets.mjs";
import viteConfig from "../vite.config.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const config = JSON.parse(await readFile(join(root, "wrangler.jsonc"), "utf8"));

test("Vite and assets configuration agree on the public path without a runtime Worker", () => {
  assert.equal(BASE_PATH, "/md-altas/");
  assert.equal(viteConfig.base, BASE_PATH);
  assert.equal(resolve(root, config.assets.directory), resolve(root, WORKERS_ASSETS_DIRECTORY));
  assert.equal(config.assets.not_found_handling, "single-page-application");
  assert.equal(config.workers_dev, true);
  assert.equal(config.main, undefined);
  assert.equal(config.assets.binding, undefined);
});

test("domain routes cannot capture the homepage or similarly named applications", () => {
  const host = "reiinoki.dpdns.org";
  assert.deepEqual(config.routes, [
    { pattern: `${host}/md-altas`, zone_name: host },
    { pattern: `${host}/md-altas/*`, zone_name: host },
  ]);
  // Cloudflare matches the full URL, including query strings. Do not broaden
  // this to /md-altas*: normalize the bare path with a separate zone redirect.
  function matches(path) {
    const url = host + path;
    return config.routes.some(({ pattern }) => pattern.endsWith("*")
      ? url.startsWith(pattern.slice(0, -1)) : url === pattern);
  }
  for (const path of ["/md-altas", "/md-altas/", "/md-altas/?lang=en", "/md-altas/assets/app.js", "/md-altas/data/archive.json"]) {
    assert.equal(matches(path), true, path);
  }
  for (const path of ["/", "/?lang=en", "/about", "/assets/app.js", "/data/archive.json", "/md-altas-other/", "/md-altas2", "/MD-ALTAS/", "/md-altas?lang=en"]) {
    assert.equal(matches(path), false, path);
  }
});

test("cache rules use the same subpath as generated asset URLs", async () => {
  const headers = await readFile(join(root, "public/_headers"), "utf8");
  const paths = headers.split(/\r?\n/).filter((line) => line.startsWith("/"));
  assert.deepEqual(paths, [
    `${BASE_PATH}assets/*`, `${BASE_PATH}data/archive.json`,
    `${BASE_PATH}data/analytics.json`, `${BASE_PATH}data/events/*`, "/*",
  ]);
});

test("packaging nests files, keeps metadata at the asset root and removes stale generated files", async (t) => {
  const temp = await mkdtemp(join(tmpdir(), "md-atlas-assets-test-"));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const source = join(temp, "dist"), destination = join(temp, "generated");
  await mkdir(join(source, "data"), { recursive: true });
  const index = '<script src="/md-altas/assets/app.js"></script>';
  await writeFile(join(source, "index.html"), index);
  await writeFile(join(source, "data/archive.json"), '{"synthetic":true}');
  await writeFile(join(source, "_headers"), "/md-altas/data/*\n  Cache-Control: public\n");
  await mkdir(destination);
  await writeFile(join(destination, "stale.txt"), "old generated file");
  assert.equal(await prepareWorkersAssets(source, destination), 4);
  assert.deepEqual((await readdir(destination)).sort(), ["_headers", "index.html", "md-altas"]);
  for (const path of ["index.html", "md-altas/index.html"]) {
    assert.equal(await readFile(join(destination, path), "utf8"), index);
  }
  assert.deepEqual(await readFile(join(destination, "md-altas/data/archive.json")), await readFile(join(source, "data/archive.json")));
  assert.deepEqual(await readFile(join(destination, "_headers")), await readFile(join(source, "_headers")));
  assert.equal(await readFile(join(source, "index.html"), "utf8"), index);
});

test("invalid paths, missing index, overlaps and symlinks fail before replacing previous output", async (t) => {
  const temp = await mkdtemp(join(tmpdir(), "md-atlas-assets-invalid-"));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const source = join(temp, "dist"), destination = join(temp, "generated");
  await mkdir(source); await mkdir(destination);
  await writeFile(join(destination, "keep.txt"), "previous build");
  await assert.rejects(prepareWorkersAssets(source, destination), /missing index/);
  await assert.rejects(prepareWorkersAssets(source, join(source, "nested")), /overlap/);
  await assert.rejects(prepareWorkersAssets(source, temp), /overlap/);
  await writeFile(join(source, "index.html"), "synthetic");
  for (const path of ["/../", "/md-altas/../../", "/md-altas", "//", "/md-altas//", "/%2e%2e/", "https://example.com/"]) {
    await assert.rejects(prepareWorkersAssets(source, destination, path), /normalized directory segments/);
  }
  // Windows directory junctions do not require symlink/developer-mode privileges.
  await symlink(destination, join(source, "linked"), process.platform === "win32" ? "junction" : "dir");
  await assert.rejects(prepareWorkersAssets(source, destination), /Unsupported build entry/);
  assert.equal(await readFile(join(destination, "keep.txt"), "utf8"), "previous build");
});
