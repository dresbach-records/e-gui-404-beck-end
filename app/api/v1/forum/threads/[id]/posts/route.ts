import { NextRequest } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/api/auth'
import { fail, ok, pagination } from '@/lib/api/http'

type Ctx={params:Promise<{id:string}>}
export async function GET(request:NextRequest,{params}:Ctx){const {id}=await params;const {page,limit,offset}=pagination(request.nextUrl.searchParams);try{const thread=await db.execute(sql`SELECT id FROM forum_threads WHERE id=${id}`);if(!thread.length)return fail('Thread não encontrada.',404);const rows=await db.execute(sql`SELECT p.*,u.name AS author_name FROM forum_posts p JOIN "user" u ON u.id=p.author_id WHERE p.thread_id=${id} AND p.status='PUBLISHED' ORDER BY p.created_at LIMIT ${limit} OFFSET ${offset}`);return ok({items:rows,page,limit})}catch{return fail('Não foi possível carregar os posts.',503)}}
export async function POST(request:NextRequest,{params}:Ctx){try{const s=await requireSession();const {id}=await params;const b=await request.json();if(!b.body||String(b.body).length>10000)return fail('Conteúdo inválido.',422);const thread=await db.execute(sql`SELECT id FROM forum_threads WHERE id=${id} AND status NOT IN ('LOCKED','ARCHIVED')`);if(!thread.length)return fail('Thread não encontrada ou bloqueada.',404);const rows=await db.execute(sql`INSERT INTO forum_posts(thread_id,author_id,body) VALUES(${id},${s.user.id},${String(b.body).trim()}) RETURNING *`);return ok({post:rows[0]},201)}catch(e){if(e instanceof Error&&e.message==='UNAUTHORIZED')return fail('Autenticação necessária.',401);return fail('Não foi possível criar o post.',409)}}
