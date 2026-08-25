import { NextResponse, type NextRequest } from 'next/server'
import { isStatusPageIpAllowed } from './lib/status-page'

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname !== '/backend-status.html') return NextResponse.next()

  const allowed = isStatusPageIpAllowed(request)
  if (!allowed) return new NextResponse(null, { status: 404 })
  return NextResponse.next()
}

export const config = {
  matcher: ['/backend-status.html'],
}
