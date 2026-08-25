import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/api/auth'
import { articleInput } from '@/lib/api/validation'
import { fail, pagination } from '@/lib/api/http'

const transitions: Record<string, string[]> = { DRAFT: ['REVIEW'], REVIEW: ['PUBLISHED'], PUBLISHED: ['ARCHIVED'], ARCHIVED: [] }

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const { page, limit, offset } = pagination(searchParams)
    const q = searchParams.get('q')?.trim() ?? ''
    const term = `%${q}%`
    const count = await db.execute(sql`SELECT COUNT(*)::int AS total FROM articles WHERE status = 'PUBLISHED' AND (${q} = '' OR title ILIKE ${term} OR summary ILIKE ${term} OR content ILIKE ${term})`)
    const total = Number(count.rows[0]?.total ?? 0)
    const result = await db.execute(sql`SELECT id, slug, title, summary, content, status, author_id, created_at, updated_at FROM articles WHERE status = 'PUBLISHED' AND (${q} = '' OR title ILIKE ${term} OR summary ILIKE ${term} OR content ILIKE ${term}) ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`)
    return NextResponse.json({ success: true, data: result.rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: offset + limit < total, hasPrevious: page > 1 }, requestId: crypto.randomUUID() })
  } catch { return fail('Não foi possível carregar os artigos.', 503) }
}

export async function POST(request: Request) {
  try {
    const session = await requirePermission('articles.write')
    const parsed = articleInput.safeParse(await request.json())
    if (!parsed.success) return fail('Payload inválido.', 422)
    const input = parsed.data
    if (input.status !== 'DRAFT') return fail('Novos artigos devem iniciar como DRAFT.', 422)
    const result = await db.execute(sql`INSERT INTO articles (slug, title, summary, content, status, author_id) VALUES (${input.slug}, ${input.title}, ${input.summary}, ${input.content}, ${input.status}, ${session.user.id}) RETURNING id, slug, title, summary, content, status, author_id, created_at, updated_at`)
    await db.execute(sql`INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata) VALUES (${session.user.id}, 'ARTICLE_CREATED', 'article', ${String(result.rows[0].id)}, '{}'::jsonb)`)
    return NextResponse.json({ success: true, data: result.rows[0], requestId: crypto.randomUUID() }, { status: 201 })
  } catch (error) { if (error instanceof Error && error.message === 'UNAUTHORIZED') return fail('Autenticação necessária.', 401); if (error instanceof Error && error.message === 'FORBIDDEN') return fail('Permissão insuficiente.', 403); if (error instanceof Error && error.message.includes('unique')) return fail('Slug já existe.', 409); return fail('Não foi possível criar o artigo.', 500) }
}

export { transitions }
