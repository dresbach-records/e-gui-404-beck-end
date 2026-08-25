import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

export async function GET() {
  const started = Date.now()
  try {
    await db.execute(sql`select 1`)
    return NextResponse.json({ success: true, data: { status: 'online', database: 'connected', latency_ms: Date.now() - started, version: '1.0.0' } })
  } catch {
    return NextResponse.json({ status: 'degraded', database: 'unavailable', latency_ms: Date.now() - started, version: '1.0.0' }, { status: 503 })
  }
}
