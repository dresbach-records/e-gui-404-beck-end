import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { pagination, fail, ok } from '@/lib/api/http'
import { requireSession } from '@/lib/api/auth'

export async function GET(request: Request) {
  try { await requireSession() } catch { return fail('Autenticação necessária.', 401) }
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  if (!q) return fail('q é obrigatório.', 422)
  const { page, limit, offset } = pagination(searchParams)
  const term = `%${q}%`
  const result = await db.execute(sql`
    SELECT 'threat' AS type, id, slug, title, summary, created_at FROM threats WHERE title ILIKE ${term} OR summary ILIKE ${term}
    UNION ALL SELECT 'scam', id, slug, title, summary, created_at FROM scams WHERE title ILIKE ${term} OR summary ILIKE ${term}
    UNION ALL SELECT 'article', id, slug, title, summary, created_at FROM articles WHERE status = 'PUBLISHED' AND (title ILIKE ${term} OR summary ILIKE ${term})
    UNION ALL SELECT 'forum_thread', id, slug, title, body, created_at FROM forum_threads WHERE status <> 'ARCHIVED' AND (title ILIKE ${term} OR body ILIKE ${term})
    UNION ALL SELECT 'forum_post', id, NULL, NULL, body, created_at FROM forum_posts WHERE status = 'PUBLISHED' AND body ILIKE ${term}
    UNION ALL SELECT 'community', id, slug, name, description, created_at FROM communities WHERE status = 'ACTIVE' AND visibility = 'PUBLIC' AND (name ILIKE ${term} OR description ILIKE ${term})
    ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
  `)
  return ok({ items: result.rows, page, limit })
}
