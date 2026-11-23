from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class QuestionSourceBase(BaseModel):
    source_name: str
    source_url: Optional[str] = None


class QuestionSourceCreate(QuestionSourceBase):
    pass


class QuestionSourceResponse(QuestionSourceBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)