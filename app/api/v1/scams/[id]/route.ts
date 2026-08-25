import { NextRequest } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { fail, ok } from '@/lib/api/http'
import { requirePermission } from '@/lib/api/auth'

function errorResponse(error: unknown) {
  if (error instanceof Error && error.message === 'UNAUTHORIZED') return fail('Autenticação necessária.', 401)
  if (error instanceof Error && error.message === 'FORBIDDEN') return fail('Permissão insuficiente.', 403)
  console.error('[v0] scam operation failed', error)
  return fail('Não foi possível concluir a operação.', 500)
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const result = await db.execute(sql`SELECT id, slug, title, summary, content, status, created_at, updated_at FROM scams WHERE (id::text = ${id} OR slug = ${id}) AND status = 'PUBLISHED' LIMIT 1`)
    if (!result.rows.length) return fail('Golpe não encontrado.', 404)
    return ok(result.rows[0], { headers: { 'Cache-Control': 'public, max-age=60' } })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const session = await requirePermission('scams:update')
    const body = await request.json()
    if (!body || typeof body !== 'object') return fail('Corpo inválido.', 422)
    const result = await db.execute(sql`UPDATE scams SET slug = COALESCE(${body.slug ?? null}, slug), title = COALESCE(${body.title ?? null}, title), summary = COALESCE(${body.summary ?? null}, summary), content = COALESCE(${body.content ? JSON.stringify(body.content) : null}::jsonb, content), status = COALESCE(${body.status ?? null}, status), updated_at = NOW() WHERE id::text = ${id} AND author_id = ${session.user.id} RETURNING id, slug, title, summary, content, status, updated_at`)
    if (!result.rows.length) return fail('Golpe não encontrado ou sem permissão.', 404)
    await db.execute(sql`INSERT INTO audit_logs (actor_id, action, entity_type, entity_id) VALUES (${session.user.id}, 'UPDATE', 'scam', ${id})`)
    return ok(result.rows[0])
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const session = await requirePermission('scams:delete')
    const result = await db.execute(sql`DELETE FROM scams WHERE id::text = ${id} AND author_id = ${session.user.id} RETURNING id`)
    if (!result.rows.length) return fail('Golpe não encontrado ou sem permissão.', 404)
    await db.execute(sql`INSERT INTO audit_logs (actor_id, action, entity_type, entity_id) VALUES (${session.user.id}, 'DELETE', 'scam', ${id})`)
    return ok({ deleted: true })
  } catch (error) {
    return errorResponse(error)
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
