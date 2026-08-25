import { NextRequest } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requirePermission, requireSession } from '@/lib/api/auth'
import { fail, ok } from '@/lib/api/http'

type Ctx={params:Promise<{id:string}>}
export async function PATCH(request:NextRequest,{params}:Ctx){try{const s=await requireSession();const {id}=await params;const b=await request.json();if(!b.body||b.body.length>10000)return fail('Conteúdo inválido.',422);const p=await db.execute(sql`SELECT author_id FROM forum_posts WHERE id=${id}`);if(!p.length)return fail('Post não encontrado.',404);if(p[0].author_id!==s.user.id){try{await requirePermission('forum.moderate')}catch{return fail('Sem autorização.',403)}}const r=await db.execute(sql`UPDATE forum_posts SET body=${b.body},updated_at=NOW() WHERE id=${id} RETURNING *`);return ok({post:r[0]})}catch(e){if(e instanceof Error&&e.message==='UNAUTHORIZED')return fail('Autenticação necessária.',401);return fail('Não foi possível atualizar.',409)}}
export async function DELETE(_:NextRequest,{params}:Ctx){try{const s=await requireSession();const {id}=await params;const p=await db.execute(sql`SELECT author_id FROM forum_posts WHERE id=${id}`);if(!p.length)return fail('Post não encontrado.',404);if(p[0].author_id!==s.user.id){try{await requirePermission('forum.moderate')}catch{return fail('Sem autorização.',403)}}await db.execute(sql`UPDATE forum_posts SET status='DELETED',updated_at=NOW() WHERE id=${id}`);return ok({deleted:true})}catch(e){if(e instanceof Error&&e.message==='UNAUTHORIZED')return fail('Autenticação necessária.',401);return fail('Não foi possível excluir.',409)}}
