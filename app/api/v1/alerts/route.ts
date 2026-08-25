import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { pagination } from '@/lib/api/http'
import { requirePermission } from '@/lib/api/auth'
import { z } from 'zod'

const alertSchema = z.object({ slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/), title: z.string().trim().min(3).max(200), body: z.string().trim().min(3).max(20000), severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']), status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT') })

function errorResponse(error: unknown) {
  if (error instanceof Error && error.message === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Autenticação necessária.' }, { status: 401 })
  if (error instanceof Error && error.message === 'FORBIDDEN') return NextResponse.json({ success: false, error: 'Permissão insuficiente.' }, { status: 403 })
  return NextResponse.json({ success: false, error: 'Não foi possível processar o alerta.' }, { status: 500 })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const { page, limit, offset } = pagination(searchParams)
  const q = searchParams.get('q')?.trim() || null
  const severity = searchParams.get('severity')?.trim() || null
  const result = await db.execute(sql`SELECT id, slug, title, body, severity, status, created_at, updated_at FROM alerts WHERE status = 'PUBLISHED' AND (${q}::text IS NULL OR title ILIKE '%' || ${q} || '%' OR body ILIKE '%' || ${q} || '%') AND (${severity}::text IS NULL OR severity = ${severity}) ORDER BY created_at DESC, id DESC LIMIT ${limit} OFFSET ${offset}`)
  const totalResult = await db.execute(sql`SELECT COUNT(*)::int AS total FROM alerts WHERE status = 'PUBLISHED' AND (${q}::text IS NULL OR title ILIKE '%' || ${q} || '%' OR body ILIKE '%' || ${q} || '%') AND (${severity}::text IS NULL OR severity = ${severity})`)
  const total = Number(totalResult.rows[0]?.total ?? 0)
  return NextResponse.json({ success: true, data: result.rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: offset + result.rows.length < total, hasPrevious: page > 1 } }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } })
}

export async function POST(request: Request) {
  try {
    const session = await requirePermission('alerts.write')
    const parsed = alertSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Payload inválido.', details: parsed.error.flatten() }, { status: 422 })
    const { slug, title, body, severity, status } = parsed.data
    const result = await db.execute(sql`INSERT INTO alerts (slug, title, body, severity, status, author_id) VALUES (${slug}, ${title}, ${body}, ${severity}, ${status}, ${session.user.id}) RETURNING id, slug, title, body, severity, status, created_at, updated_at`)
    await db.execute(sql`INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata) VALUES (${session.user.id}, 'ALERT_CREATED', 'alert', ${String(result.rows[0]?.id)}, ${JSON.stringify({ severity, status })}::jsonb)`)
    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && /duplicate key/i.test(error.message)) return NextResponse.json({ success: false, error: 'Slug já utilizado.' }, { status: 409 })
    return errorResponse(error)
  }
}
