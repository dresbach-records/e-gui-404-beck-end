import { NextRequest } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/api/auth'
import { fail, ok } from '@/lib/api/http'

type Ctx={params:Promise<{id:string}>}
export async function POST(request:NextRequest,{params}:Ctx){try{await requirePermission('forum.moderate');const {id}=await params;const {action}=await request.json();const states:Record<string,string>={lock:'LOCKED',unlock:'OPEN',solve:'SOLVED',archive:'ARCHIVED'};if(!states[action])return fail('Ação inválida.',422);const rows=await db.execute(sql`UPDATE forum_threads SET status=${states[action]},updated_at=NOW() WHERE id=${id} RETURNING *`);if(!rows.length)return fail('Thread não encontrada.',404);return ok({thread:rows[0],action})}catch(e){if(e instanceof Error&&e.message==='FORBIDDEN')return fail('Sem autorização.',403);return fail('Não foi possível moderar.',409)}}
