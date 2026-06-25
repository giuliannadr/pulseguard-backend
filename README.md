# PulseGuard — Backend (NestJS + Prisma + PostgreSQL)

PulseGuard es una plataforma DevSecOps y de monitoreo de disponibilidad en tiempo real. Este repositorio contiene el código del backend, una API REST construida sobre **NestJS** que integra **Prisma ORM**, **Supabase PostgreSQL** y **Gemini 2.5 Flash** para auditoría y simulaciones de seguridad automáticas.

## 🛠 Arquitectura del Software (Clean Architecture Rules)

El backend de PulseGuard se ha diseñado siguiendo los principios de la **Arquitectura Limpia (Clean Architecture)** y separación de responsabilidades en capas para garantizar la testabilidad, escalabilidad y facilidad de mantenimiento:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Frameworks & Drivers (Prisma, PostgreSQL, Gemini API)    │
│    └─ Outer infrastructure detail                           │
├─────────────────────────────────────────────────────────────┤
│ 2. Interface Adapters (NestJS Controllers, DTOs, Guards)   │
│    └─ Receives HTTP transport & parses payloads             │
├─────────────────────────────────────────────────────────────┤
│ 3. Use Cases / Services (MonitorsService, PlaygroundService)│
│    └─ Core business logic rules & orchestrators             │
├─────────────────────────────────────────────────────────────┤
│ 4. Entities / Domain (Database Schema models)               │
│    └─ Core database entities independent of framework       │
└─────────────────────────────────────────────────────────────┘
```

1. **Capa de Entidades (Domain Entities):** Definidas en `prisma/schema.prisma`. Contiene los modelos base independientes de la lógica de negocio: `Monitor`, `Check` y `SecurityIncident`.
2. **Capa de Casos de Uso (Services):** Contienen las reglas esenciales de negocio (ej. `MonitorsService`, `GithubService`, `PlaygroundService`). No tienen dependencias con el protocolo de transporte (HTTP) ni cabeceras express.
3. **Capa de Adaptadores de Interfaz (Controllers & Guards):** En `src/**/*.controller.ts`. Son responsables de recibir las peticiones REST, validar DTOs, aplicar el middleware de autenticación (`SupabaseAuthGuard`) y retornar los payloads en formato JSON.
4. **Capa de Frameworks (Drivers):** Herramientas externas que se inyectan en la aplicación (Base de datos PostgreSQL en Supabase, Axios para solicitudes HTTP, Google Generative AI SDK para el escaneo de código).

---

## 🚀 Tecnologías Principales

- **NestJS:** Framework progresivo de Node.js para construir servicios desacoplados.
- **Prisma ORM:** Modelado de tipos seguro y consultas SQL estructuradas.
- **Supabase (PostgreSQL):** Base de datos persistente con soporte para suscripciones en tiempo real.
- **Gemini 2.5 Flash:** Modelo de lenguaje generativo utilizado para auditoría de código estático (SAST), auditoría de cabeceras seguras de API y análisis del simulador de ataques.
- **Axios:** Cliente HTTP para pruebas de endpoints y descargas de diffs desde GitHub API.

---

## 🤖 Orquestación de IA y Decisiones de Ingeniería

El desarrollo de PulseGuard se ha realizado asistido por **modelos de lenguaje avanzados (Gemini 3.5 / Claude)**. 
- **Criterio de QA Humano-en-el-Bucle (Human-in-the-Loop):** Se auditaron todas las salidas generadas, adaptando los tipos estrictos de TypeScript y reparando las APIs de streaming JSON.
- **Ingeniería de Prompts para Seguridad:** Se desarrollaron prompts estructurados con validación de esquemas estricta (`SchemaType.OBJECT`) para asegurar que Gemini responda en formato JSON predecible, mitigando alucinaciones y asegurando códigos de estado estables.

---

## 🧪 Simulador de Ataques Integrado (Playground)

El backend expone endpoints interactivos bajo la ruta `/playground` que permiten realizar auditorías seguras en tiempo real:
- **API Auditor:** Realiza peticiones asíncronas y audita con Gemini la seguridad de los headers (CORS, HSTS, XSS protection, cookies seguras).
- **Code Auditor (SAST):** Analiza dependencias y código en busca de malas prácticas o claves secretas inyectadas.
- **Hacking Simulator:** Ejecuta probes inofensivos (`SQL Injection` con lógica OR, `Reflected XSS`, ráfagas rápidas para evaluar `Rate Limiting` y `Sensitive Path Traversal` como buscar `/.env`) para diagnosticar la resiliencia del servidor.

---

## 📦 Instalación y Configuración Local

### Prerrequisitos
- Node.js v20.x o v22.x
- Cuenta de Supabase (Base de datos PostgreSQL)
- Clave de API de Gemini (`GEMINI_API_KEY`)

### Variables de Entorno (`.env`)
Crea un archivo `.env` en la raíz de `pulseguard-backend/`:
```env
PORT=3001
API_URL=http://localhost:3001/api

# Database connection
DATABASE_URL="postgresql://postgres:password@aws-db.pooler.supabase.com:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:password@aws-db.pooler.supabase.com:5432/postgres"

# Supabase Auth
SUPABASE_URL="https://rswebvxvtppfopegedfb.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."

# Google Gemini AI Key
GEMINI_API_KEY="AIzaSy..."
```

### Ejecutar Localmente
1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Generar el cliente Prisma:
   ```bash
   npx prisma generate
   ```
3. Sincronizar esquema de base de datos:
   ```bash
   npx prisma db push
   ```
4. Levantar servidor de desarrollo:
   ```bash
   npm run start:dev
   ```

---

## 🛡 Verificación y Tests

Para ejecutar las suites de prueba unitarias:
```bash
npm run test
```
Para verificar la compilación estricta de TypeScript antes de producción:
```bash
npm run build
```
