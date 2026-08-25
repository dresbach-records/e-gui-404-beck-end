import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/api/auth'
import { articleInput } from '@/lib/api/validation'
import { fail } from '@/lib/api/http'
import { transitions } from '../route'

type Context = { params: Promise<{ id: string }> }

async function find(id: string, publishedOnly = false) {
  const result = await db.execute(sql`SELECT id, slug, title, summary, content, status, author_id, created_at, updated_at FROM articles WHERE (${id} ~ '^[0-9]+$' AND id = ${id}) OR slug = ${id} ${publishedOnly ? sql`AND status = 'PUBLISHED'` : sql``} LIMIT 1`)
  return result.rows[0]
}

export async function GET(request: Request, context: Context) {
  try { const { id } = await context.params; const row = await find(id, true); if (!row) return fail('Artigo não encontrado.', 404); return NextResponse.json({ success: true, data: row, requestId: crypto.randomUUID() }) } catch { return fail('Não foi possível carregar o artigo.', 503) }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const session = await requirePermission('articles.write'); const { id } = await context.params; const current = await find(id); if (!current) return fail('Artigo não encontrado.', 404)
    if (current.author_id !== session.user.id) return fail('Você não pode alterar este artigo.', 403)
    const parsed = articleInput.partial().safeParse(await request.json()); if (!parsed.success) return fail('Payload inválido.', 422)
    const input = parsed.data; const nextStatus = input.status ?? String(current.status); if (!transitions[String(current.status)]?.includes(nextStatus)) return fail('Transição de estado inválida.', 422)
    if (nextStatus === 'PUBLISHED' && String(current.status) !== 'REVIEW') return fail('O artigo precisa estar em revisão antes da publicação.', 422)
    const result = await db.execute(sql`UPDATE articles SET slug = COALESCE(${input.slug ?? null}, slug), title = COALESCE(${input.title ?? null}, title), summary = COALESCE(${input.summary ?? null}, summary), content = COALESCE(${input.content ?? null}, content), status = ${nextStatus}, updated_at = NOW() WHERE id = ${String(current.id)} RETURNING id, slug, title, summary, content, status, author_id, created_at, updated_at`)
    const action = nextStatus === 'PUBLISHED' ? 'ARTICLE_PUBLISHED' : nextStatus === 'ARCHIVED' ? 'ARTICLE_ARCHIVED' : 'ARTICLE_UPDATED'
    await db.execute(sql`INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata) VALUES (${session.user.id}, ${action}, 'article', ${String(current.id)}, '{}'::jsonb)`)
    return NextResponse.json({ success: true, data: result.rows[0], requestId: crypto.randomUUID() })
  } catch (error) { if (error instanceof Error && error.message === 'UNAUTHORIZED') return fail('Autenticação necessária.', 401); if (error instanceof Error && error.message === 'FORBIDDEN') return fail('Permissão insuficiente.', 403); if (error instanceof Error && error.message.includes('unique')) return fail('Slug já existe.', 409); return fail('Não foi possível atualizar o artigo.', 500) }
}

export async function DELETE(request: Request, context: Context) {
  try { const session = await requirePermission('articles.write'); const { id } = await context.params; const current = await find(id); if (!current) return fail('Artigo não encontrado.', 404); if (current.author_id !== session.user.id) return fail('Você não pode excluir este artigo.', 403); await db.execute(sql`DELETE FROM articles WHERE id = ${String(current.id)}`); await db.execute(sql`INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata) VALUES (${session.user.id}, 'ARTICLE_DELETED', 'article', ${String(current.id)}, '{}'::jsonb)`); return NextResponse.json({ success: true, data: { id: current.id }, requestId: crypto.randomUUID() }) } catch (error) { if (error instanceof Error && error.message === 'UNAUTHORIZED') return fail('Autenticação necessária.', 401); if (error instanceof Error && error.message === 'FORBIDDEN') return fail('Permissão insuficiente.', 403); return fail('Não foi possível excluir o artigo.', 500) }
}
