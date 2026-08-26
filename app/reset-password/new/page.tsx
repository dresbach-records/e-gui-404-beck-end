'use client'

import { FormEvent, Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'

function NewPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const password = String(new FormData(event.currentTarget).get('password') ?? '')
    const result = await authClient.resetPassword({ newPassword: password, token })
    if (result.error) {
      setError('O link é inválido ou expirou. Solicite um novo link.')
      return
    }
    router.replace('/sign-in?reset=success')
  }

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <form onSubmit={submit} className="mx-auto mt-24 flex max-w-sm flex-col gap-4 border border-red-900 p-8">
        <h1 className="text-2xl font-bold text-red-500">NOVA SENHA</h1>
        <p className="leading-6 text-zinc-400">Escolha uma nova senha com pelo menos 8 caracteres.</p>
        <label className="flex flex-col gap-2">Nova senha<input name="password" type="password" required minLength={8} autoComplete="new-password" className="bg-zinc-900 p-3" /></label>
        {error && <p className="text-red-400">{error}</p>}
        <button className="bg-red-700 p-3 font-bold">REDEFINIR SENHA</button>
        <Link href="/sign-in" className="text-sm text-red-400 underline">Voltar para entrar</Link>
      </form>
    </main>
  )
}

export default function NewPasswordPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-black p-6 text-white" />}>
      <NewPasswordForm />
    </Suspense>
  )
}
