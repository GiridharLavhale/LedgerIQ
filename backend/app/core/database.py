"""
Database Engine, Session Management and Base Declarative Model
"""
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from sqlalchemy import event, text
from app.core.config import settings
from app.core.logging import logger

# Base Model for all ORM Entities
Base = declarative_base()

# Resolve engine URL for async drivers
database_url = settings.DATABASE_URL
if database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://")

# Engine creation with dialect-specific options
engine_kwargs = {
    "echo": settings.DB_ECHO,
    "future": True,
}

if "sqlite" in database_url:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # PostgreSQL pool configuration
    engine_kwargs["pool_size"] = 20
    engine_kwargs["max_overflow"] = 10
    engine_kwargs["pool_pre_ping"] = True

engine = create_async_engine(database_url, **engine_kwargs)

# Async Session Factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency yielding an async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            raise e
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database tables and constraints."""
    async with engine.begin() as conn:
        if "sqlite" in str(engine.url):
            await conn.execute(text("PRAGMA foreign_keys = ON;"))
        # Create all tables defined in Base.metadata
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database initialized successfully.")
