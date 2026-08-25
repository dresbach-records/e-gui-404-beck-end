import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

export async function GET() {
  const started = Date.now()
  try {
    await db.execute(sql`select 1`)
    return NextResponse.json({ status: 'ready', checks: { database: 'connected' }, latency_ms: Date.now() - started, version: 'v1' })
  } catch {
    return NextResponse.json({ status: 'not_ready', checks: { database: 'unavailable' }, latency_ms: Date.now() - started, version: 'v1' }, { status: 503 })
  }
}
