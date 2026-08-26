import { NextRequest } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/api/auth'
import { fail, ok, pagination } from '@/lib/api/http'

export async function GET(request: NextRequest) {
  try {
    await requireSession()
    const { limit, offset, page } = pagination(request.nextUrl.searchParams)
    const query = request.nextUrl.searchParams.get('q')?.trim() ?? ''
    const rows = await db.execute(sql`
      SELECT c.id, c.name, c.slug, c.description, c.avatar, c.banner, c.category,
             c.visibility, c.language, c.status, c.created_at,
             COUNT(cm.user_id)::int AS member_count
      FROM communities c
      LEFT JOIN community_members cm ON cm.community_id = c.id AND cm.status = 'ACTIVE'
      WHERE c.status = 'ACTIVE' AND c.visibility = 'PUBLIC'
        AND (${query} = '' OR c.name ILIKE ${`%${query}%`} OR c.description ILIKE ${`%${query}%`})
      GROUP BY c.id ORDER BY c.created_at DESC LIMIT ${limit} OFFSET ${offset}
    `)
    return ok({ items: rows, page, limit })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return fail('Autenticação necessária.', 401)
    return fail('Não foi possível carregar as comunidades.', 503)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession()
    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : ''
    if (name.length < 3 || name.length > 120 || !/^[a-z0-9-]{3,80}$/.test(slug)) return fail('name e slug inválidos.', 422)
    const rows = await db.execute(sql`
      INSERT INTO communities (name, slug, description, category, language, owner_id)
      VALUES (${name}, ${slug}, ${typeof body.description === 'string' ? body.description.trim().slice(0, 1000) : null}, ${typeof body.category === 'string' ? body.category.trim().slice(0, 80) : null}, ${typeof body.language === 'string' ? body.language : 'pt-BR'}, ${session.user.id})
      RETURNING id, name, slug, description, category, language, visibility, status, created_at
    `)
    await db.execute(sql`INSERT INTO community_members (community_id, user_id, role) VALUES (${rows[0].id}, ${session.user.id}, 'OWNER')`)
    return ok({ community: rows[0] }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return fail('Autenticação necessária.', 401)
    return fail('Não foi possível criar a comunidade.', 409)
  }
}
