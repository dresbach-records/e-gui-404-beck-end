import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/api/auth'
import { z } from 'zod'

const updateSchema = z.object({ title: z.string().trim().min(3).max(200).optional(), body: z.string().trim().min(3).max(20000).optional(), severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(), status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional() }).refine((value) => Object.keys(value).length > 0)

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const result = await db.execute(sql`SELECT id, slug, title, body, severity, status, created_at, updated_at FROM alerts WHERE id = ${id} AND status = 'PUBLISHED' LIMIT 1`)
  if (!result.rows.length) return NextResponse.json({ success: false, error: 'Alerta não encontrado.' }, { status: 404 })
  return NextResponse.json({ success: true, data: result.rows[0] }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } })
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission('alerts.write')
    const { id } = await context.params
    const parsed = updateSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Payload inválido.' }, { status: 422 })
    const value = parsed.data
    const existing = await db.execute(sql`SELECT author_id FROM alerts WHERE id = ${id} LIMIT 1`)
    if (!existing.rows.length) return NextResponse.json({ success: false, error: 'Alerta não encontrado.' }, { status: 404 })
    const owner = existing.rows[0].author_id === session.user.id
    if (!owner) return NextResponse.json({ success: false, error: 'Sem autorização para este alerta.' }, { status: 403 })
    const result = await db.execute(sql`UPDATE alerts SET title = COALESCE(${value.title ?? null}, title), body = COALESCE(${value.body ?? null}, body), severity = COALESCE(${value.severity ?? null}, severity), status = COALESCE(${value.status ?? null}, status), updated_at = NOW() WHERE id = ${id} AND author_id = ${session.user.id} RETURNING id, slug, title, body, severity, status, created_at, updated_at`)
    await db.execute(sql`INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata) VALUES (${session.user.id}, 'ALERT_UPDATED', 'alert', ${id}, ${JSON.stringify({ fields: Object.keys(value) })}::jsonb)`)
    return NextResponse.json({ success: true, data: result.rows[0] })
  } catch (error) {
    if (error instanceof Error && /duplicate key/i.test(error.message)) return NextResponse.json({ success: false, error: 'Conflito de dados.' }, { status: 409 })
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Autenticação necessária.' }, { status: 401 })
    if (error instanceof Error && error.message === 'FORBIDDEN') return NextResponse.json({ success: false, error: 'Permissão insuficiente.' }, { status: 403 })
    return NextResponse.json({ success: false, error: 'Não foi possível atualizar o alerta.' }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission('alerts.write')
    const { id } = await context.params
    const existing = await db.execute(sql`SELECT author_id FROM alerts WHERE id = ${id} LIMIT 1`)
    if (!existing.rows.length) return NextResponse.json({ success: false, error: 'Alerta não encontrado.' }, { status: 404 })
    if (existing.rows[0].author_id !== session.user.id) return NextResponse.json({ success: false, error: 'Sem autorização para este alerta.' }, { status: 403 })
    await db.execute(sql`DELETE FROM alerts WHERE id = ${id} AND author_id = ${session.user.id}`)
    await db.execute(sql`INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata) VALUES (${session.user.id}, 'ALERT_DELETED', 'alert', ${id}, '{}'::jsonb)`)
    return NextResponse.json({ success: true, data: { id } })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Autenticação necessária.' }, { status: 401 })
    if (error instanceof Error && error.message === 'FORBIDDEN') return NextResponse.json({ success: false, error: 'Permissão insuficiente.' }, { status: 403 })
    return NextResponse.json({ success: false, error: 'Não foi possível excluir o alerta.' }, { status: 500 })
  }
}
