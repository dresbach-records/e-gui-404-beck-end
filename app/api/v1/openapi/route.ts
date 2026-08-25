import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ openapi: '3.1.0', info: { title: 'E GUI 404 API', version: '1.0.0', description: 'API de inteligência, comunidade e segurança digital.' }, servers: [{ url: '/api/v1' }], paths: { '/health': { get: { summary: 'Verifica a saúde do backend' } }, '/threats': { get: { summary: 'Lista ameaças publicadas' }, post: { summary: 'Cria uma ameaça autenticada' } }, '/forum/threads': { get: { summary: 'Lista discussões do fórum' } } } })
}
