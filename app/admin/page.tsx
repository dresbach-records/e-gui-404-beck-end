import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  return <main className="min-h-screen bg-black p-8 text-white"><div className="mx-auto max-w-4xl"><p className="font-mono text-sm text-red-500">E GUI 404 // ADMIN CORE</p><h1 className="mt-4 text-4xl font-bold">Backend real conectado.</h1><p className="mt-4 text-zinc-400">Sessão autenticada para {session.user.email}. O Neon está protegido por autenticação server-side.</p><a href="/backend-status.html" className="mt-8 inline-block border border-red-700 px-4 py-3 text-red-400">Ver status do sistema</a></div></main>
}
