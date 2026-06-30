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
| `GithubModule` | Conexión con GitHub API, análisis de commits con Gemini |
| `NotificationModule` | Email (Resend) y webhooks (Discord/Slack/genérico) |
| `PlaygroundModule` | Endpoints de auditoría: API, código, DNS, simulador de ataques |
| `PublicStatusModule` | Endpoint sin auth para la página de estado pública |

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

## Uso de herramientas de IA

Desarrollado con **Claude Code (Anthropic)** durante la semana del challenge.

**Cómo se aplicó:**
- **Generación de servicios:** Los servicios de NestJS (checker, github, scheduler) se generaron con IA y se auditaron para corregir casos edge (falta de manejo de timeouts, promesas no resueltas)
- **Paralelización con IA:** Se identificó que el scan de commits era secuencial y lento — con ayuda de Claude se refactorizó a `Promise.allSettled` para analizar todos los commits simultáneamente
- **Debugging de Railway:** Se diagnosticó por qué el `dist/` commiteado hacía que Railway ignorara cambios en el código fuente — solución: compilar y commitear el `dist/` actualizado
- **Prompts de Gemini:** Se iteraron los prompts para obtener análisis en español, concisos, con severidad categorizada (critical/high/medium/low) y formato JSON estricto con schema validation

---

## Instalación local

### Prerrequisitos
- Node.js v20+
- Cuenta de Supabase con base de datos PostgreSQL
- API key de Gemini (Google AI Studio — gratuita)
- API key de Resend (gratuita en resend.com)

### Variables de entorno (`.env`)

```env
PORT=3001

# Base de datos
DATABASE_URL="postgresql://postgres:PASSWORD@HOST:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:PASSWORD@HOST:5432/postgres"

# Supabase Auth
SUPABASE_URL="https://tu-proyecto.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="tu_service_role_key"

# Google Gemini AI
GEMINI_API_KEY="AIzaSy..."

# Email (Resend)
RESEND_API_KEY="re_..."
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

> **Importante:** Railway ejecuta el `dist/` commiteado. Siempre correr `npm run build` y commitear el `dist/` antes de pushear cambios al backend.

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
  githubRepoUrl, securityGrade
  checks[]          // historial de checks HTTP
  securityIncidents[] // vulnerabilidades detectadas por IA
}

Check {
  id, monitorId, status (up/down/degraded)
  statusCode, responseTimeMs, sslDaysLeft
  securityGrade, securityHeaders
  checkedAt
}

SecurityIncident {
  id, monitorId, commitHash, commitAuthor
  riskType, severity, description, recommendation
  resolved, createdAt
}
```
