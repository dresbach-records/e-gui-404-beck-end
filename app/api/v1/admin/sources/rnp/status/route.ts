import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/api/auth'
export async function GET() {
  await requirePermission('sources.manage')
 return NextResponse.json({ success: true, data: { syncEnabled: false, status: 'NOT_MONITORED', message: 'Sincronização RNP/CAIS desabilitada; nenhum status operacional é monitorado.' } }) }
