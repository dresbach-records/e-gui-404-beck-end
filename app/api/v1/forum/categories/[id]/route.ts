import { NextRequest } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/api/auth'
import { fail, ok } from '@/lib/api/http'

type Ctx = { params: Promise<{ id: string }> }
export async function PATCH(request: NextRequest, { params }: Ctx) { try { await requirePermission('forum.categories.write'); const { id } = await params; const body = await request.json(); if (!body.name && !body.description && !body.slug) return fail('Nenhum campo válido.', 422); const rows = await db.execute(sql`UPDATE forum_categories SET slug = COALESCE(${body.slug ?? null}, slug), name = COALESCE(${body.name ?? null}, name), description = COALESCE(${body.description ?? null}, description), updated_at = NOW() WHERE id = ${id} RETURNING *`); if (!rows.length) return fail('Categoria não encontrada.', 404); return ok({ category: rows[0] }) } catch (error) { if (error instanceof Error && error.message === 'FORBIDDEN') return fail('Permissão insuficiente.', 403); return fail('Não foi possível atualizar a categoria.', 409) } }
export async function DELETE(_: NextRequest, { params }: Ctx) { try { await requirePermission('forum.categories.write'); const { id } = await params; const used = await db.execute(sql`SELECT 1 FROM forum_threads WHERE category_id = ${id} LIMIT 1`); if (used.length) return fail('Categoria possui threads dependentes.', 409); const rows = await db.execute(sql`DELETE FROM forum_categories WHERE id = ${id} RETURNING id`); if (!rows.length) return fail('Categoria não encontrada.', 404); return ok({ deleted: true }) } catch (error) { if (error instanceof Error && error.message === 'FORBIDDEN') return fail('Permissão insuficiente.', 403); return fail('Não foi possível excluir a categoria.', 409) } }
