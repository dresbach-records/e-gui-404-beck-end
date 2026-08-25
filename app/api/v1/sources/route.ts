import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
export async function GET() { const result = await db.execute(sql`SELECT id, name, url, source_type, status, created_at FROM sources WHERE status = 'ACTIVE' ORDER BY name ASC`); return NextResponse.json({ data: result.rows, meta: { request_id: crypto.randomUUID() } }) }
