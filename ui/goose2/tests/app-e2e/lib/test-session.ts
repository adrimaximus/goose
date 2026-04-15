import fs from "node:fs";
import path from "node:path";
import { startAppForTestFile } from "./app-runtime";

const SESSION_DIR = "/tmp/app-e2e-sessions";
const sessionFilePath = (id: string) => path.join(SESSION_DIR, `${id}.json`);

export const startSession = async (id: string) => {
  const runtime = await startAppForTestFile(id);
  const file = sessionFilePath(id);
  fs.mkdirSync(SESSION_DIR, { recursive: true });
  fs.writeFileSync(
    file,
    JSON.stringify({ port: runtime.port, pid: process.pid }),
  );

  console.log(`Session:  ${id}`);
  console.log(`Port:     ${runtime.port}`);
  console.log(`Data dir: ${runtime.goosePathRoot}`);
  console.log(`\nConnect with:\n  pnpm test-driver --session ${id} snapshot`);

  const cleanup = () => {
    runtime.close();
    try { fs.unlinkSync(file); } catch {}
    process.exit(0);
  };
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
  await new Promise(() => {});
};

export const stopSession = (id: string) => {
  const file = sessionFilePath(id);
  const { pid } = JSON.parse(fs.readFileSync(file, "utf-8"));
  process.kill(pid, "SIGTERM");
  fs.unlinkSync(file);
  console.log(`Session ${id} stopped (pid ${pid})`);
};

export const stopAllSessions = () => {
  if (!fs.existsSync(SESSION_DIR)) return;
  const files = fs.readdirSync(SESSION_DIR).filter((f) => f.endsWith(".json"));
  if (files.length === 0) {
    console.log("No active sessions");
    return;
  }
  for (const file of files) {
    const id = path.basename(file, ".json");
    try {
      stopSession(id);
    } catch {}
  }
};

export const resolvePort = (id: string): number => {
  const file = sessionFilePath(id);
  const { port } = JSON.parse(fs.readFileSync(file, "utf-8"));
  return port;
};

export const listSessions = () => {
  if (!fs.existsSync(SESSION_DIR)) return;
  const files = fs.readdirSync(SESSION_DIR).filter((f) => f.endsWith(".json"));
  if (files.length === 0) {
    console.log("No active sessions");
    return;
  }
  for (const file of files) {
    const id = path.basename(file, ".json");
    const { port, pid } = JSON.parse(
      fs.readFileSync(path.join(SESSION_DIR, file), "utf-8"),
    );
    let alive = false;
    try { process.kill(pid, 0); alive = true; } catch {}
    if (alive) {
      console.log(`${id}  port=${port}  pid=${pid}`);
    } else {
      fs.unlinkSync(path.join(SESSION_DIR, file));
    }
  }
};
