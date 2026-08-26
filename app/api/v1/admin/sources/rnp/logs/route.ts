import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/api/auth'
export async function GET() {
  await requirePermission('sources.manage')
 const [runs, errors] = await Promise.all([db.execute(sql`SELECT id, status, started_at, finished_at, records_count FROM rnp_sync_runs ORDER BY started_at DESC LIMIT 50`), db.execute(sql`SELECT id, run_id, message, created_at FROM rnp_sync_errors ORDER BY created_at DESC LIMIT 50`)]); return NextResponse.json({ success: true, data: { runs: runs.rows, errors: errors.rows } }) }
