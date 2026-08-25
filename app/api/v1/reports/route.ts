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
  const rows = await db.execute(sql`INSERT INTO reports (reporter_id, entity_type, entity_id, reason, details) VALUES (${session.user.id}, ${String(body.entityType)}, ${String(body.entityId)}, ${String(body.reason)}, ${body.details ? String(body.details).slice(0, 4000) : null}) RETURNING id, status, created_at`)
  return NextResponse.json({ data: rows.rows[0] }, { status: 201 })
}
