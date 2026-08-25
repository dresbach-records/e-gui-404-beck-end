import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
export async function GET() { const result = await db.execute(sql`SELECT DATE(created_at) AS date, COUNT(*)::int AS total FROM error_404_visits GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 90`); return NextResponse.json({ data: result.rows }) }
