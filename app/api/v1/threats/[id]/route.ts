import { NextRequest } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { fail, ok } from '@/lib/api/http'
import { requirePermission } from '@/lib/api/auth'

type Context = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Context) {
  const { id } = await params
  try {
    const result = await db.execute(sql`SELECT id, slug, title, summary, category, risk, status, content, author_id, created_at, updated_at FROM threats WHERE id = ${id} OR slug = ${id} LIMIT 1`)
    if (!result.rows.length) return fail('Ameaça não encontrada.', 404)
    return ok(result.rows[0])
  } catch (error) {
    console.error('[v0] threat detail failed', error)
    return fail('Não foi possível carregar a ameaça.', 503)
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { id } = await params
  try {
    const session = await requirePermission('threats:update')
    const body = await request.json()
    if (!body || typeof body !== 'object') return fail('Corpo inválido.', 422)
    const content = body.content === undefined ? null : JSON.stringify(body.content)
    const result = await db.execute(sql`UPDATE threats SET title = COALESCE(${body.title ?? null}, title), summary = COALESCE(${body.summary ?? null}, summary), category = COALESCE(${body.category ?? null}, category), risk = COALESCE(${body.risk ?? null}, risk), status = COALESCE(${body.status ?? null}, status), content = COALESCE(${content}::jsonb, content), updated_at = NOW() WHERE id = ${id} AND author_id = ${session.user.id} RETURNING id, slug, title, summary, category, risk, status, content, updated_at`)
    if (!result.rows.length) return fail('Ameaça não encontrada ou sem permissão.', 404)
    await db.execute(sql`INSERT INTO audit_logs (actor_id, action, entity_type, entity_id) VALUES (${session.user.id}, 'UPDATE', 'threat', ${id})`)
    return ok(result.rows[0])
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return fail('Autenticação necessária.', 401)
    if (error instanceof Error && error.message === 'FORBIDDEN') return fail('Permissão insuficiente.', 403)
    console.error('[v0] threat update failed', error)
    return fail('Não foi possível atualizar a ameaça.', 500)
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  const { id } = await params
  try {
    const session = await requirePermission('threats:delete')
    const result = await db.execute(sql`DELETE FROM threats WHERE id = ${id} AND author_id = ${session.user.id} RETURNING id`)
    if (!result.rows.length) return fail('Ameaça não encontrada ou sem permissão.', 404)
    await db.execute(sql`INSERT INTO audit_logs (actor_id, action, entity_type, entity_id) VALUES (${session.user.id}, 'DELETE', 'threat', ${id})`)
    return ok({ deleted: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return fail('Autenticação necessária.', 401)
    if (error instanceof Error && error.message === 'FORBIDDEN') return fail('Permissão insuficiente.', 403)
    console.error('[v0] threat delete failed', error)
    return fail('Não foi possível remover a ameaça.', 500)
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
