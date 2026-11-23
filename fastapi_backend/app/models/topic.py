import uuid

from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base


class Topic(Base):

    __tablename__ = "topics"

    __table_args__ = (
        UniqueConstraint("subject_id", "slug"),
        UniqueConstraint("subject_id", "name"),
        UniqueConstraint("id", "subject_id"),
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    subject_id = Column(
        UUID(as_uuid=True),
        ForeignKey("subjects.id", ondelete="RESTRICT"),
        nullable=False
    )

    name = Column(
        String(150),
        nullable=False
    )

    slug = Column(
        String(150),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=text("now()")
    )