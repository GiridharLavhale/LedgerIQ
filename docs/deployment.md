# Deployment & Infrastructure Guide — LedgerIQ

**Product:** LedgerIQ AI Finance Controller  
**Supported Deployments:** Docker Compose, Kubernetes, Bare Metal / Local Dev

---

## 1. Docker Compose Production Architecture

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:18-alpine
    container_name: ledgeriq-postgres
    environment:
      POSTGRES_USER: ledgeriq
      POSTGRES_PASSWORD: ledgeriq_secure_password
      POSTGRES_DB: ledgeriq_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ledgeriq -d ledgeriq_db"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: ledgeriq-redis
    ports:
      - "6379:6379"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: ledgeriq-backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://ledgeriq:ledgeriq_secure_password@postgres:5432/ledgeriq_db
      - REDIS_URL=redis://redis:6379/0
      - JWT_SECRET=ledgeriq_super_secret_jwt_key_2026_buildathon
      - AI_PROVIDER=gemini # or groq, openrouter, ollama, fallback
    depends_on:
      postgres:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: ledgeriq-frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## 2. Environment Variables Configuration (`.env`)

```ini
# Application
PROJECT_NAME=LedgerIQ
ENVIRONMENT=production
DEBUG=false
API_V1_STR=/api/v1

# Security
JWT_SECRET=super_secret_production_key_replace_in_prod_2026
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# Database (PostgreSQL default, falls back to sqlite+aiosqlite:///./ledgeriq.db)
DATABASE_URL=postgresql://ledgeriq:ledgeriq_secure_password@localhost:5432/ledgeriq_db
DB_ECHO=false

# AI Configuration
AI_PROVIDER=gemini # options: gemini, groq, openrouter, ollama, fallback
AI_MODEL_NAME=gemini-2.0-flash
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
OLLAMA_BASE_URL=http://localhost:11434

# CORS
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000","http://127.0.0.1:5173"]
```
