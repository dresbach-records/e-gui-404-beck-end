import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { sql } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) { const session = await auth.api.getSession({ headers: await headers() }); if (!session?.user) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Autenticação necessária.' } }, { status: 401 }); const { id } = await params; const result = await db.execute(sql`UPDATE notifications SET read_at = COALESCE(read_at, NOW()) WHERE id = ${Number(id)} AND user_id = ${session.user.id} RETURNING id, read_at`); if (!result.rows[0]) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Notificação não encontrada.' } }, { status: 404 }); return NextResponse.json({ data: result.rows[0] }) }
