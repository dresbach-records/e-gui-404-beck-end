import { NextRequest } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ok, fail, pagination } from '@/lib/api/http'
import { requireSession } from '@/lib/api/auth'

export async function GET(request: NextRequest) {
  const { page, limit, offset } = pagination(request.nextUrl.searchParams)
  try {
    const rows = await db.execute(sql`SELECT id, slug, title, summary, category, risk, status, content, created_at FROM threats WHERE status = 'PUBLISHED' ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`)
    return ok({ items: rows, page, limit })
  } catch (error) {
    console.error('[v0] threats list failed', error)
    return fail('Não foi possível carregar as ameaças.', 503)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession()
    const body = await request.json()
    if (typeof body?.slug !== 'string' || typeof body?.title !== 'string' || typeof body?.summary !== 'string' || typeof body?.category !== 'string' || typeof body?.risk !== 'string') return fail('slug, title, summary, category e risk são obrigatórios.')
    const rows = await db.execute(sql`INSERT INTO threats (slug, title, summary, category, risk, content, author_id) VALUES (${body.slug}, ${body.title}, ${body.summary}, ${body.category}, ${body.risk}, ${JSON.stringify(body.content ?? {})}::jsonb, ${session.user.id}) RETURNING id, slug, title, summary, category, risk, status, created_at`)
    return ok(rows[0], { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return fail('Autenticação necessária.', 401)
    console.error('[v0] threat create failed', error)
    return fail('Não foi possível criar a ameaça.', 500)
  }
}
