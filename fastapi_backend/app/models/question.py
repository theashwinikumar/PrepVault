import uuid

from sqlalchemy import (
    Column,
    String,
    Text,
    DateTime,
    ForeignKeyConstraint,
    ForeignKey,
    CheckConstraint,
    UniqueConstraint,
    text
)

from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base


class Question(Base):

    __tablename__ = "questions"

    __table_args__ = (

        ForeignKeyConstraint(
            ["topic_id", "subject_id"],
            ["topics.id", "topics.subject_id"],
            ondelete="RESTRICT"
        ),

        CheckConstraint(
            "difficulty IN ('easy', 'medium', 'hard')"
        ),

        CheckConstraint(
            "question_type IN "
            "('theory', 'mcq', 'coding', 'output_based', 'multiple_select')"
        ),

        CheckConstraint(
            "status IN ('draft', 'published', 'disabled')"
        ),

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

    topic_id = Column(
        UUID(as_uuid=True),
        nullable=False
    )

    source_id = Column(
        UUID(as_uuid=True),
        ForeignKey("question_sources.id", ondelete="SET NULL"),
        nullable=True
    )

    import_batch_id = Column(
        UUID(as_uuid=True),
        ForeignKey("import_batches.id", ondelete="SET NULL"),
        nullable=True
    )

    question_text = Column(
        Text,
        nullable=False
    )

    normalized_text = Column(Text, nullable=True)

    difficulty = Column(String(30), nullable=True)

    question_type = Column(String(50), nullable=True)

    answer = Column(Text, nullable=True)

    explanation = Column(Text, nullable=True)

    fingerprint = Column(
        String(100),
        unique=True,
        nullable=True
    )

    status = Column(
        String(30),
        server_default=text("'published'")
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=text("now()")
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=text("now()")
    )