from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class SubjectBase(BaseModel):
    name: str
    slug: str


class SubjectCreate(SubjectBase):
    pass


class SubjectResponse(SubjectBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)