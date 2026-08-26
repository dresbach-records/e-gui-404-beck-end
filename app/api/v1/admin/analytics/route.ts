import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/api/auth'
export async function GET() {
  await requirePermission('analytics.read')
 const result = await db.execute(sql`SELECT status, COUNT(*)::int AS total FROM reports GROUP BY status ORDER BY status`); return NextResponse.json({ success: true, data: { reportsByStatus: result.rows } }) }
