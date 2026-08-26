import { NextRequest } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/api/auth'
import { ok, fail, pagination } from '@/lib/api/http'

export async function GET(request: NextRequest) {
  const { page, limit, offset } = pagination(request.nextUrl.searchParams)
  try {
    await requirePermission('audit.read')
    const rows = await db.execute(sql`SELECT id, actor_id, action, entity_type, entity_id, metadata, request_id, created_at FROM audit_logs ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`)
    return ok({ items: rows, page, limit })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return fail('Autenticação necessária.', 401)
    if (error instanceof Error && error.message === 'FORBIDDEN') return fail('Sem autorização.', 403)
    console.error('[v0] audit list failed', error)
    return fail('Não foi possível carregar a auditoria.', 503)
  }
}
