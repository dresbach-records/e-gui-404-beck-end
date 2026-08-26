import { NextRequest } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/api/auth'
import { fail, ok } from '@/lib/api/http'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ slug: string; userId: string }> }) {
  try {
    const session = await requireSession()
    const { slug, userId } = await params
    const body = await request.json()
    const role = body.role === 'MODERATOR' || body.role === 'MEMBER' ? body.role : null
    if (!role) return fail('role inválido.', 422)
    const community = await db.execute(sql`SELECT id FROM communities WHERE slug = ${slug} AND owner_id = ${session.user.id} AND status = 'ACTIVE' LIMIT 1`)
    if (!community.length) return fail('Comunidade não encontrada ou sem permissão.', 403)
    const rows = await db.execute(sql`UPDATE community_members SET role = ${role} WHERE community_id = ${community[0].id} AND user_id = ${userId} AND status = 'ACTIVE' RETURNING community_id, user_id, role, status`)
    if (!rows.length) return fail('Membro não encontrado.', 404)
    return ok({ member: rows[0] })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return fail('Autenticação necessária.', 401)
    return fail('Não foi possível atualizar o membro.', 409)
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ slug: string; userId: string }> }) {
  try {
    const session = await requireSession()
    const { slug, userId } = await params
    const community = await db.execute(sql`SELECT id FROM communities WHERE slug = ${slug} AND owner_id = ${session.user.id} AND status = 'ACTIVE' LIMIT 1`)
    if (!community.length) return fail('Comunidade não encontrada ou sem permissão.', 403)
    const rows = await db.execute(sql`UPDATE community_members SET status = 'REMOVED' WHERE community_id = ${community[0].id} AND user_id = ${userId} AND role <> 'OWNER' AND status = 'ACTIVE' RETURNING user_id`)
    if (!rows.length) return fail('Membro não encontrado.', 404)
    return ok({ removed: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return fail('Autenticação necessária.', 401)
    return fail('Não foi possível remover o membro.', 409)
  }
}
