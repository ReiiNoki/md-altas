// Isolated local-only Wrangler lifecycle shared by HTTP and browser checks.
import { execFile, spawn } from "node:child_process";
import { open } from "node:fs/promises";
import { createServer } from "node:net";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { BASE_PATH } from "../site.config.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const execFileAsync = promisify(execFile);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function freePort() {
  return new Promise((resolve, reject) => {
    const socket = createServer();
    socket.on("error", reject);
    socket.listen(0, "127.0.0.1", () => {
      const port = socket.address().port;
      socket.close(() => resolve(port));
    });
  });
}

export async function startWorkersPreview(artifacts) {
  const port = await freePort();
  let inspectorPort = await freePort();
  while (inspectorPort === port) inspectorPort = await freePort();
  const origin = `http://127.0.0.1:${port}`;
  const logPath = join(artifacts, "wrangler.log");
  const log = await open(logPath, "w");
  const env = { ...process.env };
  for (const key of ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_API_KEY", "CLOUDFLARE_EMAIL", "CLOUDFLARE_ACCOUNT_ID", "CF_API_TOKEN", "CF_API_KEY", "CF_EMAIL", "CF_ACCOUNT_ID"]) {
    delete env[key];
  }
  Object.assign(env, {
    WRANGLER_SEND_METRICS: "false", CI: "true",
    XDG_CONFIG_HOME: join(artifacts, "config"), XDG_CACHE_HOME: join(artifacts, "cache"),
    CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: "false",
  });
  const server = spawn(process.execPath, [
    resolve(root, "node_modules/wrangler/bin/wrangler.js"), "dev", "--local",
    "--ip", "127.0.0.1", "--port", String(port), "--inspector-port", String(inspectorPort),
    "--show-interactive-dev-session=false",
  ], { cwd: root, env, stdio: ["ignore", log.fd, log.fd], detached: process.platform !== "win32", windowsHide: true });
  let startupError;
  server.on("error", (error) => { startupError = error; });
  await log.close();
  let stopped = false;
  async function stop() {
    if (stopped) return;
    stopped = true;
    if (!server.pid || server.exitCode !== null || server.signalCode !== null) return;
    // Close only this test's process tree/group, never arbitrary browser/server PIDs.
    if (process.platform === "win32") {
      await execFileAsync("taskkill.exe", ["/PID", String(server.pid), "/T", "/F"], { windowsHide: true });
    } else {
      process.kill(-server.pid, "SIGTERM");
    }
    const deadline = Date.now() + 5000;
    while (server.exitCode === null && server.signalCode === null && Date.now() < deadline) await sleep(50);
    if (process.platform !== "win32" && server.exitCode === null && server.signalCode === null) process.kill(-server.pid, "SIGKILL");
  }
  try {
    const deadline = Date.now() + 45000;
    while (Date.now() < deadline) {
      if (startupError) throw startupError;
      if (server.exitCode !== null || server.signalCode !== null) throw new Error("Local Wrangler exited");
      try {
        const response = await fetch(origin + BASE_PATH, { signal: AbortSignal.timeout(1000) });
        await response.body?.cancel();
        if (response.ok) return { origin, stop };
      } catch { /* Local socket may not be listening yet. */ }
      await sleep(100);
    }
    throw new Error("Local Wrangler startup timed out");
  } catch (error) {
    await stop();
    throw new Error(`${error.message}. See ${logPath}`, { cause: error });
  }
}
