import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export async function GET(_request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const result = await db.execute(sql`SELECT id, name, image, created_at AS "createdAt" FROM "user" WHERE lower(name) = lower(${username}) LIMIT 1`)
  const user = result.rows[0]
  if (!user) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Usuário não encontrado.', requestId: crypto.randomUUID() } }, { status: 404 })
  return NextResponse.json({ data: user, requestId: crypto.randomUUID() })
}
