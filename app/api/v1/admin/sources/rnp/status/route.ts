import { NextResponse } from 'next/server'
export async function GET() { return NextResponse.json({ data: { syncEnabled: false, status: 'DISABLED', message: 'Sincronização RNP/CAIS desabilitada; nenhuma sincronização foi executada.' } }) }
