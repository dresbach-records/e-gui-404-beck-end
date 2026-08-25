import { NextResponse } from 'next/server'

const methods = (summary: string, extra: Record<string, unknown> = {}) => ({ get: { summary, responses: { '200': { description: 'Sucesso' }, '401': { description: 'Não autenticado' }, '403': { description: 'Sem permissão' } } }, ...extra })

export async function GET() {
  return NextResponse.json({ openapi: '3.1.0', info: { title: 'E GUI 404 API', version: '1.0.0' }, servers: [{ url: '/api/v1' }], paths: {
    '/health': methods('Saúde do backend'), '/users/me': methods('Perfil autenticado'), '/threats': methods('Ameaças'), '/scams': methods('Arquivo de golpes'), '/cases': methods('Casos'), '/articles': methods('Artigos'), '/alerts': methods('Alertas'), '/reports': methods('Denúncias'), '/notifications': methods('Notificações'), '/sources': methods('Fontes'), '/search': methods('Busca global'), '/forum/categories': methods('Categorias do fórum'), '/admin/reports': methods('Administração de denúncias'), '/admin/moderation': methods('Fila de moderação'), '/admin/dashboard': methods('Dashboard administrativo'), '/admin/analytics': methods('Analytics'), '/admin/sources/rnp/status': methods('Status RNP/CAIS'), '/admin/sources/rnp/sync': methods('Sincronização RNP/CAIS'), '/audit': methods('Auditoria'),
  } })
}
