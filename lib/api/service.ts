import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

const LISTABLE_TABLES = new Set([
  'alerts',
  'articles',
  'cases',
  'forum_categories',
  'forum_threads',
  'scams',
  'sources',
  'threats',
])

export async function listTable(table: string, offset: number, limit: number) {
  if (!LISTABLE_TABLES.has(table)) throw new Error('INVALID_TABLE')
  const safeOffset = Math.max(0, Math.floor(offset))
  const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)))
  const result = await db.execute(
    sql`SELECT * FROM ${sql.identifier(table)} ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`,
  )
  return result.rows
}
