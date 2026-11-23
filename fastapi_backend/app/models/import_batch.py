import uuid

from sqlalchemy import Column, String, Integer, DateTime, CheckConstraint, text
from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base


class ImportBatch(Base):

    __tablename__ = "import_batches"

    __table_args__ = (
        CheckConstraint("total_records >= 0"),
        CheckConstraint("valid_records >= 0"),
        CheckConstraint("invalid_records >= 0"),
        CheckConstraint("duplicate_records >= 0"),
        CheckConstraint("inserted_records >= 0"),
        CheckConstraint(
            "status IN ('pending', 'processing', 'completed', 'failed')"
        ),
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    filename = Column(
        String(255),
        nullable=True
    )

    total_records = Column(Integer, server_default=text("0"))
    valid_records = Column(Integer, server_default=text("0"))
    invalid_records = Column(Integer, server_default=text("0"))
    duplicate_records = Column(Integer, server_default=text("0"))
    inserted_records = Column(Integer, server_default=text("0"))

    status = Column(
        String(50),
        server_default=text("'pending'")
    )

    started_at = Column(
        DateTime(timezone=True),
        server_default=text("now()")
    )

    completed_at = Column(
        DateTime(timezone=True),
        nullable=True
    )