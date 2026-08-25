const base = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000'
const checks = [['health', '/api/v1/health', 200], ['openapi', '/api/v1/openapi', 200], ['search-validation', '/api/v1/search', 422]]
for (const [name, path, expected] of checks) { const response = await fetch(`${base}${path}`); if (response.status !== expected) throw new Error(`${name}: esperado ${expected}, recebido ${response.status}`); console.log(`${name}: ${response.status}`) }
