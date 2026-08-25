import { NextResponse } from 'next/server'

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data, meta: { request_id: crypto.randomUUID() } }, init)
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: { code: status >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST', message } }, { status })
}

export function pagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1)
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '20') || 20))
  return { page, limit, offset: (page - 1) * limit }
}
