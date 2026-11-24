from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ImportBatchResponse(BaseModel):
    id: UUID
    filename: Optional[str] = None

    total_records: int
    valid_records: int
    invalid_records: int
    duplicate_records: int
    inserted_records: int

    status: str

    started_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ImportRowError(BaseModel):
    row: int
    message: str


class ImportResultResponse(BaseModel):
    batch: ImportBatchResponse
    errors: list[ImportRowError]