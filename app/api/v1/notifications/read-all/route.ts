import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { sql } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
export async function POST() { const session = await auth.api.getSession({ headers: await headers() }); if (!session?.user) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Autenticação necessária.' } }, { status: 401 }); await db.execute(sql`UPDATE notifications SET read_at = COALESCE(read_at, NOW()) WHERE user_id = ${session.user.id}`); return NextResponse.json({ data: { updated: true } }) }
