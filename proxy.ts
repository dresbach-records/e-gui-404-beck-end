import { NextResponse, type NextRequest } from 'next/server'
import { isStatusPageIpAllowed } from './lib/status-page'

const allowedOrigins = new Set((process.env.CORS_ORIGINS ?? 'https://www.egui404.fun,https://egui404.fun').split(',').map((origin) => origin.trim()).filter(Boolean))

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
