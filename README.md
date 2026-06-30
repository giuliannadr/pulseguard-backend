# PulseGuard — Backend

> API REST para monitoreo de disponibilidad, análisis de seguridad con IA y notificaciones en tiempo real.

**Demo en vivo:** https://pulseguard-frontend.vercel.app  
**Repositorio frontend:** https://github.com/giuliannadr/pulseguard-frontend

---

## ¿De qué trata el proyecto?

PulseGuard es una plataforma DevSecOps que monitorea APIs y sitios web. Este repositorio contiene la API REST construida con NestJS que se encarga de:

- **Checks de uptime** automáticos cada N minutos con evaluación de SSL, headers de seguridad y tiempo de respuesta
- **Análisis de commits con IA** — detecta vulnerabilidades en diffs de GitHub usando Gemini 2.5 Flash
- **Notificaciones** por email (Resend) y webhooks (Discord/Slack) cuando un monitor cambia de estado
- **Playground de seguridad** — endpoints para auditoría de APIs, SAST de código, inspección DNS/SSL y simulación de ataques
- **Página de estado pública** sin autenticación para compartir con clientes

---

## Arquitectura

```
┌──────────────────────────────────────────────────────────────┐
│  Frontend (Next.js / Vercel)                                 │
│  Supabase Realtime ──────────────────────────── Browser      │
└────────────────────────┬─────────────────────────────────────┘
                         │ REST API
┌────────────────────────▼─────────────────────────────────────┐
│  NestJS Backend (Railway)                                     │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ Monitors    │  │ Scheduler    │  │ Playground         │  │
│  │ Controller  │  │ (Cron/min)   │  │ (AI endpoints)     │  │
│  └──────┬──────┘  └──────┬───────┘  └─────────┬──────────┘  │
│         │                │                     │              │
│  ┌──────▼────────────────▼─────────────────────▼──────────┐  │
│  │  Services: MonitorsService, CheckerService,             │  │
│  │  GithubService, NotificationService, AiService          │  │
│  └──────────────────────────┬──────────────────────────────┘  │
│                             │                                  │
│  ┌──────────────────────────▼──────────────────────────────┐  │
│  │  Prisma ORM → PostgreSQL (Supabase)                     │  │
│  └─────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
         │                           │
  Gemini 2.5 Flash API         Resend Email API
  (Security scanning)          (Alertas)
```

### Módulos principales

| Módulo | Responsabilidad |
|---|---|
| `MonitorsModule` | CRUD de monitores, métricas, checks on-demand |
| `SchedulerModule` | Cron cada minuto — ejecuta checks y dispara notificaciones |
| `CheckerModule` | HTTP health check con evaluación de SSL y security headers |
| `GithubModule` | Conexión con GitHub API, análisis de commits con Gemini, webhook receiver |
| `NotificationModule` | Email (Resend) y webhooks (Discord/Slack/genérico) con protección SSRF |
| `PlaygroundModule` | Endpoints de auditoría: API, código, DNS, simulador de ataques |
| `PublicStatusModule` | Endpoint sin auth para la página de estado pública |

---

## Endpoints de la API

Todos los endpoints requieren `Authorization: Bearer <supabase_access_token>` salvo los marcados como públicos.

### Monitores

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/monitors` | Listar todos los monitores del usuario |
| `POST` | `/api/monitors` | Crear monitor |
| `GET` | `/api/monitors/:id` | Detalle de un monitor |
| `PATCH` | `/api/monitors/:id` | Actualizar monitor |
| `DELETE` | `/api/monitors/:id` | Eliminar monitor |
| `GET` | `/api/monitors/:id/checks` | Historial de checks (`?limit=N`, máx 1000) |
| `GET` | `/api/monitors/:id/metrics` | Uptime, latencia promedio, total de checks |
| `POST` | `/api/monitors/:id/check-now` | Disparar check manual inmediato |
| `GET` | `/api/monitors/:id/security-incidents` | Incidentes de seguridad del monitor |
| `GET` | `/api/monitors/:id/downtime` | Historial de ventanas de downtime |
| `POST` | `/api/monitors/:id/test-email` | Enviar email de prueba |
| `POST` | `/api/monitors/:id/scan-repo` | Escanear commits del repo con Gemini (`?force=true` para re-escanear) |

### Incidentes de seguridad

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/security-incidents` | Todos los incidentes del usuario |
| `PATCH` | `/api/security-incidents/:id/resolve` | Marcar incidente como resuelto |

### GitHub

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/github/repos` | Listar repos del usuario (requiere `x-github-token` header) |
| `POST` | `/api/github/connect/:monitorId` | Conectar repo y crear webhook (requiere `x-github-token` header) |
| `POST` | `/api/github/webhook` | Receptor de eventos push de GitHub (público, verificado con HMAC-SHA256) |

### Playground

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/playground/test-endpoint` | Auditar un endpoint HTTP con Gemini |
| `POST` | `/api/playground/audit-code` | SAST de un fragmento de código |
| `POST` | `/api/playground/inspect-domain` | Inspección DNS/SSL de un dominio |
| `POST` | `/api/playground/simulate-attack` | Simulación de SQLi, XSS, path traversal, rate limit |
| `POST` | `/api/playground/generate-patch` | Generar parche de seguridad con Gemini |
| `POST` | `/api/playground/network-diagnostic` | Diagnóstico de tiempos de conexión |

### Otros

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Health check (público) |
| `GET` | `/api/public/status/:userId` | Estado público de monitores de un usuario (público) |

---

## Tecnologías elegidas y por qué

| Tecnología | Motivo |
|---|---|
| **NestJS** | Framework modular con DI nativa — facilita testing unitario y separación de responsabilidades |
| **Prisma 7** | ORM con tipado estricto generado desde el schema, migraciones reproducibles |
| **Supabase (PostgreSQL)** | Base de datos con realtime integrado — el frontend se suscribe a cambios sin polling |
| **Gemini 2.5 Flash** | Análisis de seguridad de código con respuesta estructurada en JSON (schema validation) |
| **Resend** | Email via HTTPS API — sin restricciones de puertos SMTP en Railway |
| **Nodemailer** (removido) | Se reemplazó por Resend porque Railway bloquea el puerto 587 (SMTP saliente) |

---

## Seguridad implementada

- **Auth:** Supabase JWT validado en cada request via `SupabaseAuthGuard`
- **Autorización:** Todos los accesos a datos filtran por `userId` — un usuario no puede leer datos de otro
- **SSRF:** `assertSafeUrl()` bloquea requests a IPs privadas, loopback y metadata endpoints (AWS/GCP/Azure) en el Playground y en webhooks de notificación
- **Webhook GitHub:** Verificación de firma `X-Hub-Signature-256` con HMAC-SHA256 y comparación en tiempo constante (`timingSafeEqual`)
- **Validación de input:** `ValidationPipe` global con `whitelist: true` — rechaza propiedades no declaradas en DTOs
- **Rate limiting:** Throttler global (20 req/min) + throttler específico en Playground (10 req/min)
- **CORS:** Whitelist de orígenes via `ALLOWED_ORIGINS`
- **HTML injection:** Todos los campos de usuario se escapan antes de insertarlos en templates de email

---

## Uso de herramientas de IA

Desarrollado con **Claude Code (Anthropic)** durante la semana del challenge.

**Cómo se aplicó:**
- **Generación de servicios:** Los servicios de NestJS (checker, github, scheduler) se generaron con IA y se auditaron para corregir casos edge (falta de manejo de timeouts, promesas no resueltas)
- **Paralelización con IA:** Se identificó que el scan de commits era secuencial y lento — con ayuda de Claude se refactorizó a `Promise.allSettled` para analizar todos los commits simultáneamente
- **Debugging de Railway:** Se diagnosticó por qué el `dist/` commiteado hacía que Railway ignorara cambios en el código fuente — solución: compilar y commitear el `dist/` actualizado
- **Prompts de Gemini:** Se iteraron los prompts para obtener análisis en español, concisos, con severidad categorizada (critical/high/medium/low) y formato JSON estricto con schema validation
- **Auditoría de seguridad:** Se realizó un análisis completo del codebase identificando y corrigiendo SSRF, webhook spoofing, HTML injection y otros vectores de ataque

---

## Instalación local

### Prerrequisitos
- Node.js v20+
- Cuenta de Supabase con base de datos PostgreSQL
- API key de Gemini (Google AI Studio — gratuita)
- API key de Resend (gratuita en resend.com)

### Variables de entorno (`.env`)

```env
# Base de datos
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Supabase Auth
SUPABASE_URL="https://tu-proyecto.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="tu_service_role_key"
SUPABASE_JWT_SECRET="tu_jwt_secret"

# Google Gemini AI
GEMINI_API_KEY="AIzaSy..."

# Email (Resend)
RESEND_API_KEY="re_..."

# App
PORT=3001
NODE_ENV=development

# CORS (separar por coma si hay varios orígenes)
ALLOWED_ORIGINS="http://localhost:3000"

# GitHub Webhook (generá con: openssl rand -hex 32)
# Debe coincidir con el "Secret" configurado en GitHub → Settings → Webhooks
GITHUB_WEBHOOK_SECRET="tu_webhook_secret"
```

### Pasos

```bash
npm install
npx prisma generate
npx prisma db push      # Crea las tablas en Supabase
npm run start:dev       # Servidor en http://localhost:3001
```

### Build de producción

```bash
npm run build
npm run start:prod
```

> **Railway:** El proyecto usa nixpacks para el build automático. No es necesario commitear el `dist/`.

---

## Tests

```bash
npm run test          # Unit tests (Jest)
npm run test:cov      # Con coverage report
```

Tests incluidos:
- `MonitorsService` — CRUD, cálculo de métricas, check on-demand
- `CheckerService` — comportamiento ante URLs inalcanzables

---

## CI/CD

GitHub Actions corre en cada push a `main`:
- **Build** — `nest build`
- **Tests** — `jest`

Ver [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

---

## Schema de base de datos

```prisma
Monitor {
  id, userId, name, url
  expectedStatus, expectedText, intervalMinutes
  isActive, lastStatus
  notificationEmail, notificationWebhookUrl
  githubRepoUrl, githubWebhookId
  maintenanceWindows (JSON)
  securityGrade, securityHeaders (JSON)
  checks[]              // historial de checks HTTP
  securityIncidents[]   // vulnerabilidades detectadas por IA
}

Check {
  id, monitorId, status (up/down/degraded)
  statusCode, responseTimeMs, sslDaysLeft
  errorMessage
  securityGrade, securityHeaders (JSON)
  checkedAt
}

SecurityIncident {
  id, monitorId, commitHash, commitAuthor
  riskType, severity (Critical/High/Medium/Low/None)
  description, recommendation
  resolved, createdAt
}
```
