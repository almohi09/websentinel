# WebSentinel

Multi-tenant SaaS website security assessment and monitoring platform.
Backend: Java 21 + Spring Boot. Frontend: React (to be scaffolded). DB: PostgreSQL.

See `WebSentinel-PRD.md` and `WebSentinel — Prerequisites & Gap Analysis.md` for requirements.

## Repository layout

```
websentinel/
├── WebSentinel-PRD.md
├── WebSentinel — Prerequisites & Gap Analysis.md
├── README.md
├── .env.example              # copy to .env (never commit)
├── .gitignore
├── docker-compose.yml        # postgres + redis + mailhog
├── docs/
│   ├── er-diagram.dbml       # paste into dbdiagram.io
│   ├── openapi.yaml          # API contract (draft)
│   ├── threat-model.md
│   ├── data-retention.md
│   └── adr/
│       └── 0001-multi-tenancy.md
├── .github/workflows/ci.yml
└── websentinel-backend/      # Spring Boot modular monolith
    ├── pom.xml
    ├── Dockerfile
    └── src/main/...
```

## Run locally

1. Copy `.env.example` → `.env` and adjust.
2. Start infra: `docker compose up -d`
3. Backend:
   ```
   cd websentinel-backend
   mvn spring-boot:run
   ```
4. Swagger UI: http://localhost:8080/swagger-ui.html
5. Mailhog UI: http://localhost:8025

## Build

```
cd websentinel-backend
mvn clean verify
```

## Status

Scaffold only. Modules (auth, workspace, website, scanner, finding, ...) are to be implemented phase by phase per PRD §9.
Active scanning stays disabled until safety controls pass (see docs/threat-model.md).