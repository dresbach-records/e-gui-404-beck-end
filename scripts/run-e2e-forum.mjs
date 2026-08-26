import { spawn } from 'node:child_process'

const databaseUrl = process.env.E2E_DATABASE_URL
if (!databaseUrl) {
  console.error('BLOCKED: E2E_DATABASE_URL não definida; o servidor não será iniciado contra uma base desconhecida.')
  process.exit(2)
}

const port = process.env.E2E_PORT ?? '3000'
const baseUrl = process.env.E2E_BASE_URL ?? `http://localhost:${port}`
const child = spawn('pnpm', ['exec', 'next', 'dev', '-p', port], {
  env: { ...process.env, DATABASE_URL: databaseUrl },
  stdio: ['ignore', 'pipe', 'pipe'],
})
let ready = false
const output = (chunk) => {
  const text = chunk.toString()
  process.stdout.write(text)
  if (/Ready in|✓ Ready|started server/i.test(text)) ready = true
}
child.stdout.on('data', output)
child.stderr.on('data', output)

const stop = (code = 1) => {
  if (!child.killed) child.kill('SIGTERM')
  process.exit(code)
}

const timer = setTimeout(() => {
  if (!ready) {
    console.error('BLOCKED: servidor E2E não ficou disponível.')
    stop(2)
  }
}, 120000)

child.on('exit', (code) => {
  clearTimeout(timer)
  if (code !== null && code !== 0) process.exit(code)
})

const waitForReady = setInterval(() => {
  if (!ready) return
  clearInterval(waitForReady)
  clearTimeout(timer)
  const test = spawn('node', ['scripts/e2e-forum.mjs'], { env: { ...process.env, E2E_BASE_URL: baseUrl }, stdio: 'inherit' })
  test.on('exit', (code) => stop(code ?? 1))
}, 250)

process.on('SIGINT', () => stop(130))
process.on('SIGTERM', () => stop(143))
