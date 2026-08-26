import { NextRequest } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/api/auth'
import { fail, ok } from '@/lib/api/http'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await requireSession()
    const { slug } = await params
    const rows = await db.execute(sql`
      SELECT c.id, c.name, c.slug, c.description, c.avatar, c.banner, c.category,
             c.visibility, c.language, c.status, c.owner_id, c.created_at,
             COUNT(cm.user_id)::int AS member_count
      FROM communities c LEFT JOIN community_members cm ON cm.community_id = c.id AND cm.status = 'ACTIVE'
      WHERE c.slug = ${slug} AND c.status = 'ACTIVE'
      GROUP BY c.id LIMIT 1
    `)
    if (!rows.length) return fail('Comunidade não encontrada.', 404)
    const rules = await db.execute(sql`SELECT id, position, title, description FROM community_rules WHERE community_id = ${rows[0].id} ORDER BY position`)
    return ok({ community: rows[0], rules })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return fail('Autenticação necessária.', 401)
    return fail('Não foi possível carregar a comunidade.', 503)
  }
}
