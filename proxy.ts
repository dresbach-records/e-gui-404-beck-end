import { NextResponse, type NextRequest } from 'next/server'
import { isStatusPageIpAllowed } from './lib/status-page'

const officialOrigins = new Set(['https://egui404.fun', 'https://www.egui404.fun'])
const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter((origin) => officialOrigins.has(origin)),
)
for (const origin of officialOrigins) allowedOrigins.add(origin)

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === '/backend-status.html') {
    if (!isStatusPageIpAllowed(request)) return new NextResponse(null, { status: 404 })
    return NextResponse.next()
  }

  if (!request.nextUrl.pathname.startsWith('/api/v1')) return NextResponse.next()
  const origin = request.headers.get('origin')
  const response = request.method === 'OPTIONS' ? new NextResponse(null, { status: 204 }) : NextResponse.next()
  if (origin && allowedOrigins.has(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Vary', 'Origin')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS')
  }
  return response
}

export const config = { matcher: ['/backend-status.html', '/api/v1/:path*'] }
