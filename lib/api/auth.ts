import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export async function getCurrentSession() {
  return auth.api.getSession({ headers: await headers() })
}

export async function requireSession() {
  const session = await getCurrentSession()
  if (!session?.user) throw new Error('UNAUTHORIZED')
  return session
}

export async function requireRole(roles: string[]) {
  const session = await requireSession()
  const result = await db.execute(sql`SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ${session.user.id} AND r.name = ANY(${roles}) LIMIT 1`)
  if (!result.rows.length) throw new Error('FORBIDDEN')
  return session
}

export async function requirePermission(permission: string) {
  const session = await requireSession()
  const result = await db.execute(sql`SELECT 1 FROM user_roles ur JOIN role_permissions rp ON rp.role_id = ur.role_id JOIN permissions p ON p.id = rp.permission_id WHERE ur.user_id = ${session.user.id} AND p.name = ${permission} LIMIT 1`)
  if (!result.rows.length) throw new Error('FORBIDDEN')
  return session
}
