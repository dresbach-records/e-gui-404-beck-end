import { NextRequest } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/api/auth'
import { fail, ok } from '@/lib/api/http'

async function communityId(slug: string) {
  const rows = await db.execute(sql`SELECT id FROM communities WHERE slug = ${slug} AND status = 'ACTIVE' LIMIT 1`)
  return rows[0]?.id as number | undefined
}

export async function POST(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await requireSession()
    const id = await communityId((await params).slug)
    if (!id) return fail('Comunidade não encontrada.', 404)
    await db.execute(sql`INSERT INTO community_members (community_id, user_id, role, status) VALUES (${id}, ${session.user.id}, 'MEMBER', 'ACTIVE') ON CONFLICT (community_id, user_id) DO UPDATE SET status = 'ACTIVE'`)
    return ok({ joined: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return fail('Autenticação necessária.', 401)
    return fail('Não foi possível entrar na comunidade.', 409)
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await requireSession()
    const id = await communityId((await params).slug)
    if (!id) return fail('Comunidade não encontrada.', 404)
    await db.execute(sql`UPDATE community_members SET status = 'LEFT' WHERE community_id = ${id} AND user_id = ${session.user.id} AND role <> 'OWNER'`)
    return ok({ joined: false })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return fail('Autenticação necessária.', 401)
    return fail('Não foi possível sair da comunidade.', 409)
  }
}
