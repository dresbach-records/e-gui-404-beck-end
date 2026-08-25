import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/api/auth'
export async function GET() {
  await requirePermission('rnp.read')
 return NextResponse.json({ data: { syncEnabled: false, status: 'DISABLED', message: 'Sincronização RNP/CAIS desabilitada; nenhuma sincronização foi executada.' } }) }
