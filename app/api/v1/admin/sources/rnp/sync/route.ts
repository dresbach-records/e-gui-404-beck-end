import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/api/auth'
export async function POST() {
  await requirePermission('rnp.sync')
 return NextResponse.json({ success: false, error: { code: 'SYNC_DISABLED', message: 'A sincronização RNP/CAIS está desabilitada.' } }, { status: 409 }) }
