import { NextRequest } from 'next/server'
import { requireSession } from '@/lib/api/auth'
import { fail, ok } from '@/lib/api/http'
import { decodeFeedCursor, getForYouFeed } from '@/lib/api/for-you'

export async function GET(request: NextRequest) {
  let session
  try { session = await requireSession() } catch { return fail('Autenticação necessária.', 401) }
  const rawLimit = Number(request.nextUrl.searchParams.get('limit') ?? 20)
  if (!Number.isInteger(rawLimit) || rawLimit < 1 || rawLimit > 50) return fail('limit deve ser um inteiro entre 1 e 50.', 422)
  const rawCursor = request.nextUrl.searchParams.get('cursor')
  const cursor = decodeFeedCursor(rawCursor)
  if (rawCursor && !cursor) return fail('cursor inválido.', 422)
  try {
    const feed = await getForYouFeed(session.user.id, rawLimit, cursor)
    return ok(feed)
  } catch {
    return fail('Não foi possível carregar seu feed.', 503)
  }
}
