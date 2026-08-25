import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

export async function listTable(table: string, offset: number, limit: number) {
  if (!/^[a-z_]+$/.test(table)) throw new Error('INVALID_TABLE')
  const result = await db.execute(sql.raw(`SELECT * FROM ${table} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`))
  return result.rows
}
