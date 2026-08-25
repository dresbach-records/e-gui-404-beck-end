import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Autenticação necessária.' } }, { status: 401 })
  const rows = await db.select({ id: user.id, name: user.name, email: user.email, image: user.image, createdAt: user.createdAt }).from(user).where(eq(user.id, session.user.id)).limit(1)
  return NextResponse.json({ data: rows[0] ?? null })
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Autenticação necessária.' } }, { status: 401 })
  const body = await request.json().catch(() => null)
  if (!body || typeof body.name !== 'string' || body.name.trim().length < 2) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Nome inválido.' } }, { status: 422 })
  const rows = await db.update(user).set({ name: body.name.trim(), updatedAt: new Date() }).where(eq(user.id, session.user.id)).returning({ id: user.id, name: user.name, email: user.email })
  return NextResponse.json({ data: rows[0] })
}
