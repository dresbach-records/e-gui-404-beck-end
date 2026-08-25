import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
export async function GET() { const [visits, threats, reports] = await Promise.all([db.execute(sql`SELECT COUNT(*)::int AS total FROM error_404_visits`), db.execute(sql`SELECT COUNT(*)::int AS total FROM threats`), db.execute(sql`SELECT COUNT(*)::int AS total FROM reports`)]); return NextResponse.json({ data: { error404Visits: visits.rows[0]?.total ?? 0, threats: threats.rows[0]?.total ?? 0, reports: reports.rows[0]?.total ?? 0 } }) }
