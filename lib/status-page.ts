import type { NextRequest } from 'next/server'

function normalizeIp(value: string) {
  return value.trim().replace(/^::ffff:/, '')
}

export function getClientIp(request: NextRequest) {
  const requestHeaders = request.headers
  const vercelForwardedFor = requestHeaders.get('x-vercel-forwarded-for')
  const forwardedFor = requestHeaders.get('x-forwarded-for')
  const candidate = vercelForwardedFor?.split(',')[0] ?? forwardedFor?.split(',')[0] ?? requestHeaders.get('x-real-ip')
  return candidate ? normalizeIp(candidate) : null
}

export function isStatusPageIpAllowed(request: NextRequest) {
  if (process.env.NODE_ENV !== 'production') return process.env.STATUS_PAGE_DEV_BYPASS === 'true'
  const allowed = (process.env.STATUS_PAGE_ALLOWED_IPS ?? '').split(',').map(normalizeIp).filter(Boolean)
  if (!allowed.length) return false
  const clientIp = getClientIp(request)
  return Boolean(clientIp && allowed.includes(clientIp))
}
