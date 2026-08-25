import { NextRequest } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ok, fail, pagination } from '@/lib/api/http'

export async function GET(request: NextRequest) {
  const { page, limit, offset } = pagination(request.nextUrl.searchParams)
  try {
    const rows = await db.execute(sql`SELECT id, slug, name, description, created_at FROM forum_categories ORDER BY name ASC LIMIT ${limit} OFFSET ${offset}`)
    return ok({ items: rows, page, limit })
  } catch (error) {
    console.error('[v0] forum categories failed', error)
    return fail('Não foi possível carregar as categorias.', 503)
  }
}
