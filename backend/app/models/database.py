"""SQLAlchemy ORM models matching the project data blueprint."""

import os
import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    func,
    Text as SAText,
    JSON,
    TypeDecorator,
    CHAR,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB as PG_JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

# Pick column types based on database dialect (PostgreSQL vs SQLite)
USE_POSTGRES = os.environ.get("DATABASE_URL", "").startswith("postgresql")


class GUID(TypeDecorator):
    """Platform-independent GUID type.

    Uses PostgreSQL's native UUID type, otherwise stores as CHAR(36)
    stringified hex values (compatible with SQLite).
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID())
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return str(value)
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        return uuid.UUID(value)


if USE_POSTGRES:
    UUID_TYPE = PG_UUID(as_uuid=True)
    JSON_TYPE = PG_JSONB
else:
    UUID_TYPE = GUID()
    JSON_TYPE = JSON


class Competitor(Base):
    __tablename__ = "competitors"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID_TYPE, primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    website_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    monitored_urls: Mapped[List["MonitoredURL"]] = relationship(
        back_populates="competitor",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Competitor id={self.id} name={self.name!r}>"


class MonitoredURL(Base):
    __tablename__ = "monitored_urls"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID_TYPE, primary_key=True, default=uuid.uuid4
    )
    competitor_id: Mapped[uuid.UUID] = mapped_column(
        UUID_TYPE,
        ForeignKey("competitors.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    url: Mapped[str] = mapped_column(String(2048), nullable=False)
    page_type: Mapped[str] = mapped_column(
        String(32), nullable=False, default="changelog"
    )  # 'pricing' | 'changelog' | 'features'
    last_scraped_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    competitor: Mapped["Competitor"] = relationship(back_populates="monitored_urls")
    snapshots: Mapped[List["Snapshot"]] = relationship(
        back_populates="url",
        cascade="all, delete-orphan",
        order_by="desc(Snapshot.created_at)",
        lazy="selectin",
    )
    diff_logs: Mapped[List["DiffLog"]] = relationship(
        back_populates="url",
        cascade="all, delete-orphan",
        order_by="desc(DiffLog.created_at)",
        lazy="selectin",
    )

    __table_args__ = (
        Index("ix_monitored_urls_competitor_url", "competitor_id", "url"),
    )

    def __repr__(self) -> str:
        return f"<MonitoredURL id={self.id} url={self.url!r}>"


class Snapshot(Base):
    __tablename__ = "snapshots"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID_TYPE, primary_key=True, default=uuid.uuid4
    )
    url_id: Mapped[uuid.UUID] = mapped_column(
        UUID_TYPE,
        ForeignKey("monitored_urls.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    markdown_content: Mapped[str] = mapped_column(SAText, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    url: Mapped["MonitoredURL"] = relationship(back_populates="snapshots")

    __table_args__ = (
        Index("ix_snapshots_url_created", "url_id", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<Snapshot id={self.id} hash={self.content_hash[:8]}...>"


class DiffLog(Base):
    __tablename__ = "diff_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID_TYPE, primary_key=True, default=uuid.uuid4
    )
    url_id: Mapped[uuid.UUID] = mapped_column(
        UUID_TYPE,
        ForeignKey("monitored_urls.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    has_change: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    headline: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    bullets: Mapped[Optional[list]] = mapped_column(JSON_TYPE, nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    url: Mapped["MonitoredURL"] = relationship(back_populates="diff_logs")

    __table_args__ = (
        Index("ix_diff_logs_url_created", "url_id", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<DiffLog id={self.id} has_change={self.has_change}>"
