import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { sql } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { rateLimit } from '@/lib/api/rate-limit'

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Autenticação necessária.' } }, { status: 401 })
  const bucket = rateLimit(`report:${session.user.id}`, 10)
  if (!bucket.allowed) return NextResponse.json({ error: { code: 'RATE_LIMITED', message: 'Muitas denúncias. Tente novamente mais tarde.' } }, { status: 429, headers: { 'Retry-After': String(bucket.retryAfter ?? 60) } })
  const body = await request.json().catch(() => null)
  if (!body?.entityType || !body?.entityId || !body?.reason) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'entityType, entityId e reason são obrigatórios.' } }, { status: 422 })
  const entityType = String(body.entityType).toLowerCase()
  if (!['post', 'comment', 'thread'].includes(entityType)) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'entityType deve ser post, comment ou thread.' } }, { status: 422 })
  const rows = await db.execute(sql`INSERT INTO reports (reporter_id, entity_type, entity_id, reason, details) VALUES (${session.user.id}, ${entityType}, ${String(body.entityId)}, ${String(body.reason).slice(0, 200)}, ${body.details ? String(body.details).slice(0, 4000) : null}) RETURNING id, entity_type, entity_id, reason, status, created_at`)
  await db.execute(sql`INSERT INTO audit_logs (actor_id, action, entity_type, entity_id) VALUES (${session.user.id}, 'REPORT_CREATED', 'report', ${String(rows.rows[0].id)})`)
  return NextResponse.json({ success: true, data: rows.rows[0] }, { status: 201 })
}
