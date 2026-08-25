import { NextRequest } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/api/auth'
import { fail, ok, pagination } from '@/lib/api/http'

export async function GET(request: NextRequest) {
  const { page, limit, offset } = pagination(request.nextUrl.searchParams)
  try { const rows = await db.execute(sql`SELECT c.id, c.slug, c.name, c.description, c.created_at, COUNT(t.id)::int AS thread_count FROM forum_categories c LEFT JOIN forum_threads t ON t.category_id = c.id GROUP BY c.id ORDER BY c.name LIMIT ${limit} OFFSET ${offset}`); return ok({ items: rows, page, limit }) } catch { return fail('Não foi possível carregar as categorias.', 503) }
}

export async function POST(request: NextRequest) {
  try { await requirePermission('forum.categories.write'); const body = await request.json(); if (!body.slug || !body.name) return fail('slug e name são obrigatórios.', 422); const rows = await db.execute(sql`INSERT INTO forum_categories (slug, name, description) VALUES (${body.slug}, ${body.name}, ${body.description ?? null}) RETURNING *`); return ok({ category: rows[0] }, 201) } catch (error) { if (error instanceof Error && error.message === 'FORBIDDEN') return fail('Permissão insuficiente.', 403); return fail('Não foi possível criar a categoria.', 409) }
}
