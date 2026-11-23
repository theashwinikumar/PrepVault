import uuid

from sqlalchemy import Column, String, DateTime, text
from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base


class Subject(Base):

    __tablename__ = "subjects"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    name = Column(
        String(100),
        nullable=False,
        unique=True
    )

    slug = Column(
        String(100),
        nullable=False,
        unique=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=text("now()")
    )