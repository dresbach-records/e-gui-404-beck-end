import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

export type FeedCursor = { createdAt: string; id: number }

export function encodeFeedCursor(cursor: FeedCursor) {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url')
}

export function decodeFeedCursor(value: string | null): FeedCursor | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
    if (typeof parsed.createdAt !== 'string' || !Number.isSafeInteger(parsed.id)) return null
    const date = new Date(parsed.createdAt)
    if (Number.isNaN(date.getTime())) return null
    return { createdAt: date.toISOString(), id: parsed.id }
  } catch { return null }
}

export async function getForYouFeed(userId: string, limit: number, cursor: FeedCursor | null) {
  const cursorCreatedAt = cursor?.createdAt ?? null
  const cursorId = cursor?.id ?? null
  const result = await db.execute(sql`
    WITH candidates AS (
      SELECT t.id, 'forum_thread'::text AS type, t.slug, t.title, t.body AS summary,
        t.category_id, t.author_id, t.created_at, t.updated_at,
        (COUNT(DISTINCT l.user_id) * 2 + COUNT(DISTINCT p.id) + CASE WHEN COUNT(DISTINCT b.user_id) > 0 THEN 3 ELSE 0 END) AS score
      FROM forum_threads t
      LEFT JOIN forum_thread_likes l ON l.thread_id = t.id
      LEFT JOIN forum_posts p ON p.thread_id = t.id AND p.status = 'PUBLISHED'
      LEFT JOIN forum_thread_bookmarks b ON b.thread_id = t.id AND b.user_id = ${userId}
      WHERE t.status <> 'ARCHIVED'
        AND (${cursorCreatedAt}::timestamptz IS NULL OR (t.created_at, t.id) < (${cursorCreatedAt}::timestamptz, ${cursorId}::bigint))
      GROUP BY t.id
    )
    SELECT c.*, fc.slug AS category_slug, fc.name AS category_name,
      EXISTS (SELECT 1 FROM forum_thread_likes ul WHERE ul.thread_id = c.id AND ul.user_id = ${userId}) AS liked,
      EXISTS (SELECT 1 FROM forum_thread_bookmarks ub WHERE ub.thread_id = c.id AND ub.user_id = ${userId}) AS bookmarked
    FROM candidates c JOIN forum_categories fc ON fc.id = c.category_id
    ORDER BY c.score DESC, c.created_at DESC, c.id DESC
    LIMIT ${limit}
  `)
  const items = result.rows as Array<{ id: number; created_at: string }>
  const last = items.at(-1)
  return { items: result.rows, nextCursor: last ? encodeFeedCursor({ createdAt: new Date(last.created_at).toISOString(), id: Number(last.id) }) : null }
}
