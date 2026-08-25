import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
export async function GET() { const session = await auth.api.getSession({ headers: await headers() }); if (!session?.user) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Autenticação necessária.' } }, { status: 401 }); const result = await db.execute(sql`SELECT id, title, body, read_at, created_at FROM notifications WHERE user_id = ${session.user.id} ORDER BY created_at DESC LIMIT 100`); return NextResponse.json({ data: result.rows }) }
