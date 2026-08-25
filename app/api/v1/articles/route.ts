import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { pagination } from '@/lib/api/http'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const { page, limit, offset } = pagination(searchParams)
  const result = await db.execute(sql`SELECT id, slug, title, summary, content, status, created_at, updated_at FROM articles WHERE status = 'PUBLISHED' ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`)
  return NextResponse.json({ data: result.rows, meta: { page, limit, request_id: crypto.randomUUID() } })
}
