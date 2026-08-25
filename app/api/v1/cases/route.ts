import { NextRequest } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { fail, ok, pagination } from '@/lib/api/http'
import { requirePermission } from '@/lib/api/auth'

export async function GET(request: NextRequest) {
  const { page, limit, offset } = pagination(request.nextUrl.searchParams)
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  try {
    const result = await db.execute(sql`SELECT id, title, summary, status, created_at, updated_at FROM cases WHERE status = 'PUBLISHED' AND (title ILIKE ${`%${q}%`} OR summary ILIKE ${`%${q}%`}) ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`)
    return ok(result.rows, { meta: { page, limit, offset } })
  } catch (error) {
    console.error('[v0] cases list failed', error)
    return fail('Não foi possível carregar os casos.', 503)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission('cases:create')
    const body = await request.json()
    if (!body?.title || !body?.summary) return fail('title e summary são obrigatórios.', 422)
    const result = await db.execute(sql`INSERT INTO cases (title, summary, content, status, author_id) VALUES (${body.title}, ${body.summary}, ${JSON.stringify(body.content ?? {})}::jsonb, 'DRAFT', ${session.user.id}) RETURNING id, title, summary, content, status, created_at`)
    await db.execute(sql`INSERT INTO audit_logs (actor_id, action, entity_type, entity_id) VALUES (${session.user.id}, 'CREATE', 'case', ${String(result.rows[0].id)})`)
    return ok(result.rows[0], { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return fail('Autenticação necessária.', 401)
    if (error instanceof Error && error.message === 'FORBIDDEN') return fail('Permissão insuficiente.', 403)
    console.error('[v0] case create failed', error)
    return fail('Não foi possível criar o caso.', 500)
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
