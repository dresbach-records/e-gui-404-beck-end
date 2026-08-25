import { Pool } from 'pg'
import bcrypt from 'bcrypt'
import crypto from 'node:crypto'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adminEmail = process.env.SEED_ADMIN_EMAIL ?? process.env.SEED_ADMIN_EMAIL_2
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? process.env.SEED_ADMIN_PASSWORD_2

if (!adminEmail || !adminPassword) {
  throw new Error('Configure SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD para executar o seed.')
}

const roles = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'EDITOR', 'RESEARCHER', 'VERIFIED_CONTRIBUTOR', 'MEMBER']
const permissions = ['users.read', 'users.write', 'users.delete', 'threats.read', 'threats.write', 'threats.delete', 'cases.read', 'cases.write', 'articles.read', 'articles.write', 'alerts.read', 'alerts.write', 'forum.moderate', 'reports.review', 'sources.manage', 'rnp.sync', 'analytics.read', 'audit.read', 'settings.manage']
const badges = ['FIRST_POST', 'HELPFUL_MEMBER', 'SCAM_SPOTTER', 'SECURITY_EDUCATOR', 'TOP_CONTRIBUTOR', 'VERIFIED_SOURCE', 'COMMUNITY_GUARDIAN']
const categories = [
  ['seguranca-digital', 'Segurança Digital', 'Discussões sobre segurança, privacidade e proteção digital.'],
  ['golpes-e-fraudes', 'Golpes e Fraudes', 'Relatos e discussões educativas sobre golpes digitais.'],
  ['phishing', 'Phishing', 'Identificação e prevenção de campanhas de phishing.'],
  ['whatsapp', 'WhatsApp', 'Golpes, sequestro de contas e engenharia social no WhatsApp.'],
  ['redes-sociais', 'Redes Sociais', 'Fraudes e abusos encontrados em redes sociais.'],
  ['bancos-e-pix', 'Bancos e Pix', 'Golpes envolvendo bancos, Pix e pagamentos.'],
  ['marketplace', 'Marketplace', 'Fraudes em plataformas de compra e venda.'],
  ['compras-online', 'Compras Online', 'Golpes relacionados a lojas e compras pela internet.'],
  ['suporte-tecnico', 'Suporte Técnico Falso', 'Falsos atendentes e falsos serviços de suporte.'],
  ['geral', 'Discussão Geral', 'Discussões gerais sobre segurança digital.'],
]
const threats = [
  ['falsa-central-atendimento-bancario', 'Falsa Central de Atendimento Bancário', 'Golpistas podem se passar por instituições financeiras para induzir vítimas a fornecer informações ou realizar operações.'],
  ['phishing-por-email', 'Phishing por E-mail', 'Mensagens fraudulentas tentam induzir o acesso a links ou o compartilhamento de credenciais.'],
  ['golpe-falso-comprovante', 'Golpe do Falso Comprovante', 'Comprovantes falsos são usados para pressionar vendedores a liberar produtos ou serviços.'],
  ['golpe-falsa-entrega', 'Golpe da Falsa Entrega', 'Mensagens sobre entregas podem tentar obter dados ou pagamentos indevidos.'],
  ['falso-suporte-tecnico', 'Falso Suporte Técnico', 'Falsos atendentes usam urgência e autoridade para induzir ações inseguras.'],
  ['golpe-de-marketplace', 'Golpe de Marketplace', 'Anúncios e negociações fraudulentas exploram pressa e falta de verificação.'],
  ['falso-investimento', 'Falso Investimento', 'Promessas de retorno garantido são sinais de alerta para avaliar com cautela.'],
  ['roubo-conta-engenharia-social', 'Roubo de Conta por Engenharia Social', 'Manipulação psicológica pode levar ao compartilhamento de códigos de acesso.'],
  ['falsa-atualizacao-cadastro', 'Falsa Atualização de Cadastro', 'Solicitações inesperadas de atualização podem ser tentativas de phishing.'],
  ['falso-boleto', 'Falso Boleto', 'Boletos adulterados podem direcionar pagamentos para beneficiários indevidos.'],
]
const articles = ['Como identificar um phishing', 'Como reconhecer uma falsa central bancária', 'Como verificar um comprovante de pagamento', 'Como proteger sua conta do WhatsApp', 'Como identificar um falso suporte técnico', 'Como evitar golpes em marketplaces', 'Como reconhecer falsas oportunidades de investimento', 'O que fazer depois de cair em um golpe', 'Como denunciar uma tentativa de fraude', 'Como proteger suas contas digitais']
const threadTitles = ['Como identificar uma falsa central bancária?', 'Recebi uma mensagem suspeita no WhatsApp', 'Como reconhecer phishing por e-mail?', 'Golpe do falso comprovante', 'Como denunciar uma tentativa de golpe?', 'Como verificar um site de compras?', 'Tentativa de acesso à minha conta', 'Golpes envolvendo falsas entregas', 'Como funciona engenharia social?', 'Como proteger minha conta do WhatsApp?', 'Como reconhecer um falso investimento?', 'Recebi um boleto suspeito', 'Como identificar uma loja falsa?', 'Golpe de suporte técnico', 'Como verificar um domínio?', 'O que fazer depois de clicar em phishing?', 'Como identificar mensagens falsas?', 'Como denunciar golpe online?', 'Quais são os sinais de uma conta falsa?', 'Como verificar um contato oficial?']

async function upsert(client: any, entityType: string, entityKey: string, payload: Record<string, unknown>, isDemo = true) {
  await client.query(`INSERT INTO egui_seed_records (entity_type, entity_key, payload, is_demo) VALUES ($1, $2, $3::jsonb, $4) ON CONFLICT (entity_type, entity_key) DO UPDATE SET payload = EXCLUDED.payload, is_demo = EXCLUDED.is_demo, updated_at = NOW()`, [entityType, entityKey, JSON.stringify(payload), isDemo])
}

async function createOnce(client: any, entityType: string, entityKey: string, payload: Record<string, unknown>, isDemo = true) {
  await client.query(`INSERT INTO egui_seed_records (entity_type, entity_key, payload, is_demo) VALUES ($1, $2, $3::jsonb, $4) ON CONFLICT (entity_type, entity_key) DO NOTHING`, [entityType, entityKey, JSON.stringify(payload), isDemo])
}

async function main() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    for (const role of roles) await upsert(client, 'role', role, { code: role, name: role, is_active: true })
    for (const permission of permissions) await upsert(client, 'permission', permission, { code: permission, name: permission, is_active: true })
    for (const code of badges) await upsert(client, 'badge', code, { code, name: code.replaceAll('_', ' '), description: `Badge demonstrativa ${code}`, icon: 'shield', is_active: true })
    const adminHash = await bcrypt.hash(adminPassword, 12)
    await upsert(client, 'user', 'egui404_admin', { username: 'egui404_admin', displayName: 'E GUI 404 Admin', email: adminEmail, role: 'SUPER_ADMIN', status: 'ACTIVE', reputation: 9999, is_adm: true, password_hash: adminHash }, false)
    for (const [username, displayName, role, reputation] of [['egui_moderator', 'EGUI Moderator', 'MODERATOR', 2500], ['egui_editor', 'EGUI Editor', 'EDITOR', 1800], ['egui_researcher', 'EGUI Researcher', 'RESEARCHER', 3200], ['cyber_member', 'Cyber Member', 'MEMBER', 120]]) await createOnce(client, 'user', username, { username, displayName, email: `${username}@demo.egui404.local`, role, status: 'ACTIVE', reputation, is_demo: true, password_hash: await bcrypt.hash(crypto.randomUUID(), 12) })
    for (const [slug, name, description] of categories) await upsert(client, 'forum_category', slug, { slug, name, description })
    for (const [slug, title, summary] of threats) await upsert(client, 'threat', slug, { slug, title, summary, category: 'EDUCATIONAL', risk: 'HIGH', status: 'DOCUMENTED', verification: 'DOCUMENTED', warningSigns: ['urgência inesperada', 'pedido de código ou senha', 'link não verificado'], howToProtect: ['encerre o contato', 'use o canal oficial', 'não compartilhe credenciais'], affectedPlatforms: ['web', 'mobile'], tags: ['phishing', 'seguranca'] })
    for (const title of articles) await upsert(client, 'article', title.toLowerCase().replaceAll(' ', '-'), { title, status: 'PUBLISHED', author: 'EGUI404 Editor', content: `${title}: conteúdo educativo demonstrativo para desenvolvimento.` })
    for (let i = 0; i < threadTitles.length; i++) await upsert(client, 'forum_thread', `thread-${String(i + 1).padStart(4, '0')}`, { title: threadTitles[i], category: categories[i % categories.length][0], author: 'cyber_member', posts: 3, accepted_solution: i % 3 === 0 })
    for (let i = 1; i <= 10; i++) await upsert(client, 'case', `CASE-${String(i).padStart(4, '0')}`, { title: threats[i - 1][1], status: ['OPEN', 'UNDER_REVIEW', 'DOCUMENTED', 'RESOLVED', 'ARCHIVED'][i % 5], label: 'EDUCATIONAL CASE' })
    for (let i = 1; i <= 10; i++) await upsert(client, 'community_report', `report-${String(i).padStart(4, '0')}`, { status: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ESCALATED', 'RESOLVED'][i % 6], subject: threats[i - 1][0] })
    for (let i = 1; i <= 8; i++) await upsert(client, 'moderation', `moderation-${String(i).padStart(4, '0')}`, { type: ['SPAM', 'SUSPICIOUS_LINK', 'OFF_TOPIC', 'HARASSMENT', 'DUPLICATE', 'MISINFORMATION', 'NEEDS_REVIEW'][i % 7], status: 'PENDING', priority: i % 3 === 0 ? 'HIGH' : 'NORMAL', assignedTo: 'egui_moderator' })
    for (const source of [['rnp-cais', 'RNP / CAIS', 'https://catalogodefraudes.rnp.br/', 'RNP_CAIS'], ['cert-br', 'CERT.br', 'https://www.cert.br/', 'CERT_BR'], ['banco-central', 'Banco Central do Brasil', 'https://www.bcb.gov.br/', 'GOVERNMENT'], ['policia-federal', 'Polícia Federal', 'https://www.gov.br/pf/', 'LAW_ENFORCEMENT'], ['egui404', 'E GUI 404', 'https://egui404-cyber-awareness.vercel.app/', 'COMMUNITY']]) await upsert(client, 'source', source[0], { organization: source[1], url: source[2], type: source[3], status: 'ACTIVE' }, false)
    await upsert(client, 'rnp_settings', 'default', { enabled: true, syncEnabled: false, sourceUrl: 'https://catalogodefraudes.rnp.br/' }, false)
    await upsert(client, 'system_settings', 'default', { name: 'E GUI 404', tagline: 'Cyber Crime Awareness', environment: 'development', demoMode: true, maintenanceMode: false, themeColor: '#050505', disclaimer: 'Esta página tem função informativa e educativa. O conteúdo apresentado é exemplificativo e não exaustivo.', independentNotice: 'O E GUI 404 é uma plataforma independente e não representa institucionalmente a RNP/CAIS.' }, false)
    const analyticsEvents = ['PAGE_VIEW', 'THREAT_VIEW', 'SCAM_VIEW', 'ARTICLE_VIEW', 'SEARCH', 'THREAD_CREATED', 'POST_CREATED', 'REPORT_SUBMITTED', 'QUIZ_STARTED', 'QUIZ_COMPLETED']
    for (let day = 0; day < 30; day++) for (let index = 0; index < analyticsEvents.length; index++) await upsert(client, 'analytics', `day-${day}-${analyticsEvents[index]}`, { event: analyticsEvents[index], date: new Date(Date.now() - day * 86400000).toISOString().slice(0, 10), count: 8 + ((day + index) % 17) })
    await client.query('COMMIT')
    console.log('Seed demo concluído com dados determinísticos e idempotentes.')
  } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release(); await pool.end() }
}

main().catch((error) => { console.error('Seed falhou:', error instanceof Error ? error.message : error); process.exit(1) })
