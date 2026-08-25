# E GUI 404 — Backend API

<p align="center">
  <strong>Cyber Awareness · Scam Intelligence · Digital Safety</strong>
</p>

<p align="center">
  Backend oficial da plataforma E GUI 404.
</p>

<p align="center">
  <a href="https://egui404.fun">Frontend</a> ·
  <a href="https://api.egui404.fun">API</a> ·
  <a href="https://api.egui404.fun/api/v1/openapi">OpenAPI</a>
</p>

---

## Sobre o projeto

O E GUI 404 é uma plataforma independente de conscientização, educação e inteligência defensiva relacionada a:

- golpes digitais;
- fraudes;
- phishing;
- engenharia social;
- ameaças cibernéticas;
- segurança digital;
- casos investigativos;
- educação em segurança;
- inteligência de ameaças;
- participação comunitária defensiva.

Este repositório contém exclusivamente o backend da plataforma.

O backend é responsável por:

- API REST versionada;
- autenticação;
- sessões;
- usuários;
- RBAC;
- permissões;
- conteúdo editorial;
- ameaças;
- golpes;
- casos;
- artigos;
- alertas;
- fórum;
- denúncias;
- notificações;
- moderação;
- auditoria;
- analytics;
- fontes;
- integração preparada com RNP/CAIS;
- busca;
- health checks;
- documentação OpenAPI.

---

# Arquitetura

```text
                         ┌─────────────────────┐
                         │     E GUI 404       │
                         │   egui404.fun       │
                         └──────────┬──────────┘
                                    │
                                    │ HTTPS
                                    ▼
                         ┌─────────────────────┐
                         │     Cloudflare      │
                         │ WAF / DDoS / TLS    │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │       Vercel        │
                         │     Next.js 16      │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │      API v1         │
                         │ /api/v1/*           │
                         └──────────┬──────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
                 ▼                  ▼                  ▼
        ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
        │ Better Auth    │ │ Business APIs  │ │ Audit / RBAC   │
        │ Sessions       │ │ Domain Modules  │ │ Permissions    │
        └────────────────┘ └────────────────┘ └────────────────┘
                 │                  │                  │
                 └──────────────────┼──────────────────┘
                                    ▼
                         ┌─────────────────────┐
                         │   Neon PostgreSQL   │
                         │      Database       │
                         └─────────────────────┘