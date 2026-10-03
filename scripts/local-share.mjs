import { spawn } from 'node:child_process';

const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const api = spawn(process.execPath, ['shared-library-server/server.mjs'], { stdio: 'inherit' });
const vite = spawn(command, ['run', 'dev', '--', '--host', '0.0.0.0'], { stdio: 'inherit' });
const stop = () => { api.kill(); vite.kill(); };
process.on('SIGINT', stop); process.on('SIGTERM', stop);
