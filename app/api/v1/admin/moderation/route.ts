import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { sql } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
export async function GET() { const session = await auth.api.getSession({ headers: await headers() }); if (!session?.user) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Autenticação necessária.' } }, { status: 401 }); const rows = await db.execute(sql`SELECT id, entity_type, entity_id, reason, status, created_at FROM reports WHERE status IN ('PENDING','UNDER_REVIEW','ESCALATED') ORDER BY created_at ASC LIMIT 100`); return NextResponse.json({ data: rows.rows }) }
