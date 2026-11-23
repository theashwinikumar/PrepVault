import uuid

from sqlalchemy import Column, String, DateTime, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base


class Profile(Base):

    __tablename__ = "profiles"

    id = Column(
        UUID(as_uuid=True),
        ForeignKey("auth.users.id", ondelete="CASCADE"),
        primary_key=True
    )

    email = Column(
        String(255),
        unique=True,
        nullable=True
    )

    full_name = Column(
        String(150),
        nullable=True
    )

    role = Column(
        String(30),
        server_default=text("'STUDENT'")
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=text("now()")
    )