'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'

export default function ResetPasswordRequestPage() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const email = String(new FormData(event.currentTarget).get('email') ?? '')
    const result = await authClient.requestPasswordReset({ email, redirectTo: '/reset-password/new' })
    if (result.error) {
      setError('Não foi possível processar a solicitação. Tente novamente.')
      return
    }
    setSent(true)
  }

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <form onSubmit={submit} className="mx-auto mt-24 flex max-w-sm flex-col gap-4 border border-red-900 p-8">
        <h1 className="text-2xl font-bold text-red-500">RECUPERAR SENHA</h1>
        {sent ? (
          <p className="leading-6 text-zinc-300">Se o endereço estiver cadastrado, enviaremos instruções para redefinir sua senha.</p>
        ) : (
          <>
            <p className="leading-6 text-zinc-400">Informe seu email para receber um link seguro.</p>
            <label className="flex flex-col gap-2">Email<input name="email" type="email" required autoComplete="email" className="bg-zinc-900 p-3" /></label>
            {error && <p className="text-red-400">{error}</p>}
            <button className="bg-red-700 p-3 font-bold">ENVIAR INSTRUÇÕES</button>
          </>
        )}
        <Link href="/sign-in" className="text-sm text-red-400 underline">Voltar para entrar</Link>
      </form>
    </main>
  )
}
