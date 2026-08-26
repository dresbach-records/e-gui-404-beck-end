import { NextRequest } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/api/auth'
import { fail, ok } from '@/lib/api/http'

async function getCommunity(slug: string, userId: string) {
  const rows = await db.execute(sql`SELECT id, owner_id FROM communities WHERE slug = ${slug} AND status = 'ACTIVE' LIMIT 1`)
  const community = rows[0]
  if (!community) return { error: fail('Comunidade não encontrada.', 404) }
  if (community.owner_id !== userId) return { error: fail('Permissão insuficiente.', 403) }
  return { community }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await requireSession()
    const access = await getCommunity((await params).slug, session.user.id)
    if (access.error) return access.error
    const body = await request.json()
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const description = typeof body.description === 'string' ? body.description.trim() : ''
    const position = Number.isInteger(body.position) ? body.position : 0
    if (!title || !description || position < 1 || position > 100) return fail('title, description e position são obrigatórios.', 422)
    const rows = await db.execute(sql`INSERT INTO community_rules (community_id, position, title, description) VALUES (${access.community.id}, ${position}, ${title.slice(0, 120)}, ${description.slice(0, 1000)}) RETURNING id, position, title, description`)
    return ok({ rule: rows[0] }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return fail('Autenticação necessária.', 401)
    return fail('Não foi possível criar a regra.', 409)
  }
}
