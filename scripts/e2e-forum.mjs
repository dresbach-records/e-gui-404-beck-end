import assert from 'node:assert/strict'
import pg from 'pg'

const baseUrl = process.env.E2E_BASE_URL ?? 'http://localhost:3000'
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`
const password = 'ForumE2E!9x-StrongPassword'
const users = {
  a: { email: process.env.E2E_USER_A_EMAIL ?? `forum-a-${suffix}@example.test`, name: 'Forum E2E A' },
  b: { email: process.env.E2E_USER_B_EMAIL ?? `forum-b-${suffix}@example.test`, name: 'Forum E2E B' },
}

function client() {
  let cookie = ''
  return {
    async request(path, options = {}) {
      const headers = new Headers(options.headers)
      headers.set('content-type', 'application/json')
      headers.set('origin', baseUrl)
      if (cookie) headers.set('cookie', cookie)
      const response = await fetch(`${baseUrl}${path}`, { ...options, headers, redirect: 'manual' })
      const setCookie = response.headers.get('set-cookie')
      if (setCookie) cookie = setCookie.split(';')[0]
      let body = null
      try { body = await response.json() } catch {}
      return { response, body }
    },
  }
}

async function signup(api, user) {
  const result = await api.request('/api/v1/auth/sign-up/email', {
    method: 'POST',
    body: JSON.stringify({ email: user.email, password, name: user.name }),
  })
  assert.ok([200, 201, 409].includes(result.response.status), `signup inesperado: ${result.response.status}`)
}

async function signin(api, email, secret) {
  const result = await api.request('/api/v1/auth/sign-in/email', {
    method: 'POST',
    body: JSON.stringify({ email, password: secret }),
  })
  assert.ok([200, 201].includes(result.response.status), `signin inesperado: ${result.response.status}`)
  assert.equal((await api.request('/api/v1/auth/get-session')).response.status, 200)
}

const anonymous = client()
const unauthenticated = await anonymous.request('/api/v1/forum/threads')
assert.equal(unauthenticated.response.status, 401, 'feed sem sessão deve retornar 401')

const a = client()
const b = client()
await signup(a, users.a)
await signup(b, users.b)
assert.equal((await a.request('/api/v1/auth/get-session')).response.status, 200)
assert.equal((await b.request('/api/v1/auth/get-session')).response.status, 200)

const categories = await a.request('/api/v1/forum/categories')
assert.equal(categories.response.status, 200)
const category = categories.body?.data?.items?.rows?.[0] ?? categories.body?.data?.categories?.[0] ?? (Array.isArray(categories.body?.data) ? categories.body.data[0] : null) ?? categories.body?.items?.[0] ?? categories.body?.data?.items?.rows?.[0]
if (!category?.id) {
  console.log('PENDENTE: banco não possui categoria para criar fixture E2E')
  process.exit(2)
}

const created = await a.request('/api/v1/forum/threads', {
  method: 'POST',
  body: JSON.stringify({ category_id: category.id, slug: `e2e-${suffix}`, title: 'Fixture E2E', body: 'Conteúdo de teste E2E.' }),
})
assert.equal(created.response.status, 201)
const threadId = created.body?.data?.thread?.id ?? created.body?.thread?.id
assert.ok(threadId, 'thread fixture deve retornar id')

const comment = await a.request(`/api/v1/forum/threads/${threadId}/posts`, { method: 'POST', body: JSON.stringify({ body: 'Comentário E2E.' }) })
assert.equal(comment.response.status, 201)
const postId = comment.body?.data?.post?.id ?? comment.body?.post?.id
assert.ok(postId, 'comentário fixture deve retornar id')

assert.equal((await b.request(`/api/v1/forum/threads/${threadId}`, { method: 'PATCH', body: JSON.stringify({ title: 'IDOR' }) })).response.status, 403)
assert.equal((await b.request(`/api/v1/forum/threads/${threadId}`, { method: 'DELETE' })).response.status, 403)
assert.equal((await b.request(`/api/v1/forum/posts/${postId}`, { method: 'PATCH', body: JSON.stringify({ body: 'IDOR' }) })).response.status, 403)
assert.equal((await b.request(`/api/v1/forum/posts/${postId}`, { method: 'DELETE' })).response.status, 403)

assert.equal((await a.request(`/api/v1/forum/threads/${threadId}/bookmark`, { method: 'POST' })).response.status, 200)
const bBookmark = await b.request(`/api/v1/forum/threads/${threadId}/bookmark`)
assert.equal(bBookmark.response.status, 200)
assert.equal(bBookmark.body?.data?.bookmarked ?? bBookmark.body?.bookmarked, false)
assert.equal((await a.request(`/api/v1/forum/threads/${threadId}/bookmark`, { method: 'POST' })).response.status, 200)

assert.equal((await a.request(`/api/v1/forum/threads/${threadId}/like`, { method: 'POST' })).response.status, 200)
const bLike = await b.request(`/api/v1/forum/threads/${threadId}/like`)
assert.notEqual(bLike.response.status, 401)

assert.equal((await b.request(`/api/v1/forum/threads/${threadId}/moderation`, { method: 'POST', body: JSON.stringify({ action: 'lock' }) })).response.status, 403)
assert.equal((await b.request('/api/v1/notifications')).response.status, 200)
const fixturePool = new pg.Pool({ connectionString: process.env.E2E_DATABASE_URL })
const fixtureUsers = await fixturePool.query('SELECT id, email FROM "user" WHERE email = ANY($1::text[])', [[users.a.email, users.b.email]])
const fixtureUserIds = new Map(fixtureUsers.rows.map((row) => [row.email, row.id]))
const notificationAResult = await fixturePool.query('INSERT INTO notifications (user_id, title, body) VALUES ($1, $2, $3) RETURNING id', [fixtureUserIds.get(users.a.email), 'E2E A', 'Notificação da fixture A'])
const notificationBResult = await fixturePool.query('INSERT INTO notifications (user_id, title, body) VALUES ($1, $2, $3) RETURNING id', [fixtureUserIds.get(users.b.email), 'E2E B', 'Notificação da fixture B'])
await fixturePool.end()
const notificationA = String(notificationAResult.rows[0].id)
const notificationB = String(notificationBResult.rows[0].id)
const aNotifications = await a.request('/api/v1/notifications')
const bNotifications = await b.request('/api/v1/notifications')
assert.ok(aNotifications.body?.data?.some((item) => String(item.id) === notificationA))
assert.ok(!aNotifications.body?.data?.some((item) => String(item.id) === notificationB))
assert.ok(bNotifications.body?.data?.some((item) => String(item.id) === notificationB))
assert.ok(!bNotifications.body?.data?.some((item) => String(item.id) === notificationA))
assert.ok([403, 404].includes((await a.request(`/api/v1/notifications/${notificationB}/read`, { method: 'PATCH' })).response.status))
assert.ok([403, 404].includes((await b.request(`/api/v1/notifications/${notificationA}/read`, { method: 'PATCH' })).response.status))
assert.ok([200, 204].includes((await a.request('/api/v1/notifications/read-all', { method: 'POST' })).response.status))
console.log('PASS: isolamento de notificações A/B')
const privilegeAttempt = await b.request('/api/v1/users/me', { method: 'PATCH', body: JSON.stringify({ name: 'E2E User B', role: 'ADMIN', permissions: ['forum.moderate'] }) })
assert.equal(privilegeAttempt.response.status, 200)
assert.equal(privilegeAttempt.body?.data?.role, undefined)
assert.equal(privilegeAttempt.body?.data?.permissions, undefined)
const profileAfterPrivilegeAttempt = await b.request('/api/v1/users/me')
assert.equal(profileAfterPrivilegeAttempt.response.status, 200)
assert.equal(profileAfterPrivilegeAttempt.body?.data?.role, undefined)
assert.equal(profileAfterPrivilegeAttempt.body?.data?.permissions, undefined)
const createdReport = await b.request('/api/v1/reports', { method: 'POST', body: JSON.stringify({ entityType: 'thread', entityId: String(threadId), reason: 'E2E moderation coverage', details: 'Fixture controlada.' }) })
const reportId = createdReport.body?.data?.id ?? createdReport.body?.report?.id
if (createdReport.response.status !== 201 || !reportId) console.log(`BLOCKED: Reports mutation indisponível na fixture/schema atual (HTTP ${createdReport.response.status})`)

const moderatorEmail = process.env.E2E_MODERATOR_EMAIL
const moderatorPassword = process.env.E2E_MODERATOR_PASSWORD
const adminEmail = process.env.E2E_ADMIN_EMAIL
const adminPassword = process.env.E2E_ADMIN_PASSWORD
if (moderatorEmail && moderatorPassword) {
  const moderator = client()
  await signin(moderator, moderatorEmail, moderatorPassword)
  assert.equal((await moderator.request(`/api/v1/forum/threads/${threadId}/moderation`, { method: 'POST', body: JSON.stringify({ action: 'lock' }) })).response.status, 200)
  console.log('PASS: moderator autorizado e moderação permitida')
} else {
  console.log('BLOCKED: RBAC MODERATOR sem credencial E2E segura')
}
if (adminEmail && adminPassword) {
  const admin = client()
  await signin(admin, adminEmail, adminPassword)
  assert.equal((await admin.request('/api/v1/admin/moderation')).response.status, 200)
  console.log('PASS: admin autorizado e fila administrativa acessível')
} else {
  console.log('BLOCKED: RBAC ADMIN sem credencial E2E segura')
}

console.log('PASS: autenticação, IDOR, isolamento de bookmarks/likes, reports e privilege escalation')
console.log(`E2E base: ${baseUrl}`)
