import { execFileSync, spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const VITE_CLI = resolve(REPO_ROOT, 'node_modules', 'vite', 'bin', 'vite.js')

function freePort() {
  return new Promise((resolvePromise, reject) => {
    const server = createServer()
    server.unref()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      server.close(() => resolvePromise(port))
    })
  })
}

function killTree(child) {
  if (child.exitCode !== null || !child.pid) return
  try {
    if (process.platform === 'win32') execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
    else child.kill('SIGKILL')
  } catch {}
}

/**
 * Starts the showcase the way `pnpm dev` does, on a free port. Vite compiles a page on its first
 * request and discovers dependencies as it goes, so every page is fetched once before the first
 * measured visit: a measured page never waits on a cold compile or a reload.
 */
export async function startShowcase(files) {
  const port = await freePort()
  const child = spawn(process.execPath, [VITE_CLI, 'showcase', '--port', String(port), '--strictPort', '--host', '127.0.0.1', '--clearScreen', 'false'], {
    cwd: REPO_ROOT,
    stdio: 'ignore',
    windowsHide: true,
  })
  const stop = () => killTree(child)
  const url = `http://127.0.0.1:${port}/`
  const started = Date.now()
  for (;;) {
    if (child.exitCode !== null) throw new Error(`showcase server exited with ${child.exitCode}`)
    if (Date.now() - started > 90000) {
      stop()
      throw new Error('showcase server did not become ready in 90s')
    }
    if (await fetch(url).then(r => r.ok).catch(() => false)) break
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  for (const file of files) await fetch(url + file).then(r => r.text()).catch(() => {})
  return { url, stop }
}

export function installCleanup(stop) {
  const once = () => { try { stop() } catch {} }
  process.on('SIGINT', () => { once(); process.exit(130) })
  process.on('SIGTERM', () => { once(); process.exit(143) })
  process.on('exit', once)
}
