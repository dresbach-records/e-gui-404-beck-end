import { NextResponse } from 'next/server'
export async function POST() { return NextResponse.json({ error: { code: 'SYNC_DISABLED', message: 'A sincronização RNP/CAIS está desabilitada.' } }, { status: 409 }) }
