import { NextRequest } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ok, fail, pagination } from '@/lib/api/http'

export async function GET(request: NextRequest) {
  const { page, limit, offset } = pagination(request.nextUrl.searchParams)
  try {
    const rows = await db.execute(sql`SELECT id, actor_id, action, entity_type, entity_id, metadata, request_id, created_at FROM audit_logs ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`)
    return ok({ items: rows, page, limit })
  } catch (error) {
    console.error('[v0] audit list failed', error)
    return fail('Não foi possível carregar a auditoria.', 503)
  }
}
