'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/auth-client'

export default function SignInPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const result = await signIn.email({ email: String(form.get('email')), password: String(form.get('password')) })
    if (result.error) return setError('Não foi possível entrar. Verifique suas credenciais.')
    router.push('/admin')
    router.refresh()
  }
  return <main className="min-h-screen bg-black p-6 text-white"><form onSubmit={submit} className="mx-auto mt-24 flex max-w-sm flex-col gap-4 border border-red-900 p-8"><h1 className="text-2xl font-bold text-red-500">E GUI 404 // LOGIN</h1><label>Email<input name="email" type="email" required className="mt-2 w-full bg-zinc-900 p-3" /></label><label>Senha<input name="password" type="password" required className="mt-2 w-full bg-zinc-900 p-3" /></label>{error && <p className="text-red-400">{error}</p>}<button className="bg-red-700 p-3 font-bold">ENTRAR</button></form></main>
}
