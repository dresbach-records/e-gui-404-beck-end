import { NextResponse } from 'next/server'

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data, meta: { request_id: crypto.randomUUID() } }, init)
}

const ERROR_CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION_ERROR',
  429: 'RATE_LIMITED',
  500: 'INTERNAL_ERROR',
  503: 'SERVICE_UNAVAILABLE',
}

export function fail(message: string, status = 400, details: Record<string, unknown> = {}) {
  return NextResponse.json(
    { error: { code: ERROR_CODES[status] ?? (status >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST'), message, details } },
    { status },
  )
}

export function pagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1)
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '20') || 20))
  return { page, limit, offset: (page - 1) * limit }
}
