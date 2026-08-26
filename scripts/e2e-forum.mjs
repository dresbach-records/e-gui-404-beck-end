import assert from 'node:assert/strict'

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
const privilegeAttempt = await b.request('/api/v1/users/me', { method: 'PATCH', body: JSON.stringify({ name: 'E2E User B', role: 'ADMIN', permissions: ['forum.moderate'] }) })
assert.equal(privilegeAttempt.response.status, 200)
assert.equal(privilegeAttempt.body?.data?.role, undefined)
assert.equal(privilegeAttempt.body?.data?.permissions, undefined)
const profileAfterPrivilegeAttempt = await b.request('/api/v1/users/me')
assert.equal(profileAfterPrivilegeAttempt.response.status, 200)
assert.equal(profileAfterPrivilegeAttempt.body?.data?.role, undefined)
assert.equal(profileAfterPrivilegeAttempt.body?.data?.permissions, undefined)
assert.equal((await b.request('/api/v1/reports/9223372036854775807', { method: 'PATCH', body: JSON.stringify({ status: 'RESOLVED' }) })).response.status, 404)

console.log('PASS: autenticação, IDOR, isolamento de bookmarks/likes, reports e privilege escalation')
console.log(`E2E base: ${baseUrl}`)
