"""
LedgerIQ FastAPI Application Entrypoint
"""
import uuid
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.core.config import settings
from app.core.database import init_db, AsyncSessionLocal
from app.core.logging import logger
from app.core.security import get_password_hash
from app.models.organization import Organization
from app.models.user import User, UserRole

# Import API Routers
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.uploads import router as uploads_router
from app.api.batches import router as batches_router
from app.api.exceptions import router as exceptions_router
from app.api.copilot import router as copilot_router
from app.api.evaluations import router as evaluations_router
from app.api.reports import router as reports_router
from app.api.dashboard import router as dashboard_router
from app.api.audit import router as audit_router
from app.api.settings import router as settings_router
from app.api.data_sources import router as data_sources_router
from app.api.transactions import router as transactions_router
from app.api.verification import router as verification_router
from app.api.agents import router as agents_router
from app.api.razorpay import router as razorpay_router


async def seed_initial_data():
    """Seed default organization and demo administrative account."""
    async with AsyncSessionLocal() as session:
        stmt = select(Organization).where(Organization.slug == "razorpay-finops")
        res = await session.execute(stmt)
        org = res.scalars().first()

        if not org:
            org = Organization(
                name="Razorpay FinOps Org",
                slug="razorpay-finops",
                currency="INR"
            )
            session.add(org)
            await session.flush()

            # Create default admin user
            admin_user = User(
                org_id=org.id,
                email="admin@ledgeriq.io",
                full_name="Priya Sharma (FinOps Lead)",
                hashed_password=get_password_hash("admin123"),
                role=UserRole.ADMIN.value
            )
            session.add(admin_user)
            await session.commit()
            logger.info("Initialized default admin: admin@ledgeriq.io / admin123")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting LedgerIQ API Server...")
    await init_db()
    await seed_initial_data()
    yield
    # Shutdown
    logger.info("Shutting down LedgerIQ API Server...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise-grade AI Finance Controller & Multi-Source Reconciliation Engine",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request ID & Performance Middleware
@app.middleware("http")
async def add_correlation_id_and_timing(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or f"req-{uuid.uuid4().hex[:8]}"
    request.state.request_id = request_id
    start_time = time.time()

    response = await call_next(request)

    process_time = (time.time() - start_time) * 1000
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Response-Time-MS"] = f"{process_time:.2f}"
    return response


# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    req_id = getattr(request.state, "request_id", "unknown")
    logger.error(f"Unhandled server exception [req: {req_id}]: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred. Please contact financial operations support.",
                "request_id": req_id
            }
        }
    )


# Health Check Endpoints
@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "project": settings.PROJECT_NAME, "version": settings.VERSION}


@app.get("/health/live", tags=["Health"])
async def liveness_check():
    return {"status": "alive"}


@app.get("/health/ready", tags=["Health"])
async def readiness_check():
    return {"status": "ready", "database": "connected", "ai_provider": settings.AI_PROVIDER}


# Mount API V1 Routers
api_v1 = settings.API_V1_STR
app.include_router(auth_router, prefix=api_v1)
app.include_router(users_router, prefix=api_v1)
app.include_router(uploads_router, prefix=api_v1)
app.include_router(batches_router, prefix=api_v1)
app.include_router(exceptions_router, prefix=api_v1)
app.include_router(copilot_router, prefix=api_v1)
app.include_router(evaluations_router, prefix=api_v1)
app.include_router(reports_router, prefix=api_v1)
app.include_router(dashboard_router, prefix=api_v1)
app.include_router(audit_router, prefix=api_v1)
app.include_router(settings_router, prefix=api_v1)
app.include_router(data_sources_router, prefix=api_v1)
app.include_router(transactions_router, prefix=api_v1)
app.include_router(verification_router, prefix=api_v1)
app.include_router(agents_router, prefix=api_v1)
app.include_router(razorpay_router, prefix=api_v1)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
