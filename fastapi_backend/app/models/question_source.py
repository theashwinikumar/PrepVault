import uuid

from sqlalchemy import Column, String, Text, DateTime, text
from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base


class QuestionSource(Base):

    __tablename__ = "question_sources"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    source_name = Column(
        String(200),
        nullable=False
    )

    source_url = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=text("now()")
    )