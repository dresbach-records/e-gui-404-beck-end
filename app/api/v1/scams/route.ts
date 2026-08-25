import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { pagination } from '@/lib/api/http'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const { page, limit, offset } = pagination(searchParams)
  const q = searchParams.get('q')?.trim() ?? ''
  const result = await db.execute(sql`SELECT id, slug, title, summary, status, created_at FROM scams WHERE status = 'PUBLISHED' AND (title ILIKE ${`%${q}%`} OR summary ILIKE ${`%${q}%`}) ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`)
  return NextResponse.json({ data: result.rows, meta: { page, limit, request_id: crypto.randomUUID() } })
}
