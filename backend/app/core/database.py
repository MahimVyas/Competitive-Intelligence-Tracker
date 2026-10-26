"""Async SQLAlchemy database setup (Supabase / PostgreSQL / SQLite fallback)."""

import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# Use SQLite by default for zero-config local development
DATABASE_URL = settings.database_url or "sqlite+aiosqlite:///./ci_tracker.db"

# SQLite requires special connect args; PostgreSQL does not
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_async_engine(
    DATABASE_URL,
    echo=settings.app_env == "development",
    pool_pre_ping=True,
    connect_args=connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields an async DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db() -> None:
    """Create all tables on startup (use Alembic migrations in production).

    Import models inside this function so they register with Base.metadata
    before create_all() is called.
    """
    # Import models so they register with Base.metadata
    from app.models.database import (  # noqa: F401
        Competitor,
        MonitoredURL,
        Snapshot,
        DiffLog,
    )

    if DATABASE_URL.startswith("sqlite"):
        # SQLite + aiosqlite: run_sync + create_all doesn't emit DDL properly.
        # Use the sync engine for schema creation.
        from sqlalchemy import create_engine

        sync_url = DATABASE_URL.replace("+aiosqlite", "")
        sync_engine = create_engine(sync_url)
        Base.metadata.create_all(sync_engine)
        sync_engine.dispose()
    else:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
