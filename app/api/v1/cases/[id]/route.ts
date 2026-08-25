import { NextRequest } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { fail, ok } from '@/lib/api/http'
import { requirePermission } from '@/lib/api/auth'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const result = await db.execute(sql`SELECT id, title, summary, content, status, author_id, created_at, updated_at FROM cases WHERE id::text = ${id} AND status = 'PUBLISHED' LIMIT 1`)
    if (!result.rows.length) return fail('Caso não encontrado.', 404)
    return ok(result.rows[0])
  } catch (error) {
    console.error('[v0] case detail failed', error)
    return fail('Não foi possível carregar o caso.', 503)
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const session = await requirePermission('cases:update')
    const body = await request.json()
    if (!body || typeof body !== 'object') return fail('Corpo inválido.', 422)
    const result = await db.execute(sql`UPDATE cases SET title = COALESCE(${body.title ?? null}, title), summary = COALESCE(${body.summary ?? null}, summary), content = COALESCE(${body.content ? JSON.stringify(body.content) : null}::jsonb, content), status = COALESCE(${body.status ?? null}, status), updated_at = NOW() WHERE id::text = ${id} AND author_id = ${session.user.id} RETURNING id, title, summary, content, status, updated_at`)
    if (!result.rows.length) return fail('Caso não encontrado ou sem permissão.', 404)
    await db.execute(sql`INSERT INTO audit_logs (actor_id, action, entity_type, entity_id) VALUES (${session.user.id}, 'UPDATE', 'case', ${id})`)
    return ok(result.rows[0])
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return fail('Autenticação necessária.', 401)
    if (error instanceof Error && error.message === 'FORBIDDEN') return fail('Permissão insuficiente.', 403)
    console.error('[v0] case update failed', error)
    return fail('Não foi possível atualizar o caso.', 500)
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const session = await requirePermission('cases:delete')
    const result = await db.execute(sql`DELETE FROM cases WHERE id::text = ${id} AND author_id = ${session.user.id} RETURNING id`)
    if (!result.rows.length) return fail('Caso não encontrado ou sem permissão.', 404)
    await db.execute(sql`INSERT INTO audit_logs (actor_id, action, entity_type, entity_id) VALUES (${session.user.id}, 'DELETE', 'case', ${id})`)
    return ok({ deleted: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return fail('Autenticação necessária.', 401)
    if (error instanceof Error && error.message === 'FORBIDDEN') return fail('Permissão insuficiente.', 403)
    console.error('[v0] case delete failed', error)
    return fail('Não foi possível excluir o caso.', 500)
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
