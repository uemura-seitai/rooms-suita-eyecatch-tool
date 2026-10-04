import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const projectDirectory = process.cwd();

async function listenerPids(port) {
  try {
    const { stdout } = await execFileAsync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-Fp']);
    return stdout.split('\n').filter((line) => line.startsWith('p')).map((line) => Number(line.slice(1))).filter(Number.isFinite);
  } catch {
    return [];
  }
}
async function listenerWorkingDirectory(pid) {
  try {
    const { stdout } = await execFileAsync('lsof', ['-a', '-p', String(pid), '-d', 'cwd', '-Fn']);
    return stdout.split('\n').find((line) => line.startsWith('n'))?.slice(1) || '';
  } catch {
    return '';
  }
}
async function ensurePortsAreAvailable() {
  for (const port of [8787]) {
    const pids = await listenerPids(port);
    if (!pids.length) continue;
    const directories = await Promise.all(pids.map(listenerWorkingDirectory));
    if (directories.some((directory) => directory === projectDirectory)) {
      console.log(`ROOMs local-share is already running (port ${port}).`);
      // A manual invocation should end quietly, while the LaunchAgent must
      // retry later so it takes over automatically after a manual run ends.
      process.exit(process.env.ROOMS_LAUNCHD === '1' ? 1 : 0);
    }
    console.error(`Port ${port} is already in use by another application. It was not stopped for safety.`);
    process.exitCode = 1;
    return false;
  }
  return true;
}

if (!await ensurePortsAreAvailable()) process.exit();
// The everyday entry point is GitHub Pages, so local-share only needs the
// LAN HTTPS API. `npm run dev` remains available for development.
const certificateSetup = spawn('/bin/bash', ['scripts/ensure-local-https.sh'], { stdio: 'inherit' });
await new Promise((resolve) => certificateSetup.on('exit', resolve));
if (certificateSetup.exitCode !== 0) process.exit(certificateSetup.exitCode || 1);
const api = spawn(process.execPath, ['shared-library-server/server.mjs'], { stdio: 'inherit' });
const stop = () => { api.kill(); };
process.on('SIGINT', stop); process.on('SIGTERM', stop);
