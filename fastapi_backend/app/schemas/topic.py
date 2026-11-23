from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class TopicBase(BaseModel):
    subject_id: UUID
    name: str
    slug: str


class TopicCreate(TopicBase):
    pass


class TopicResponse(TopicBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)