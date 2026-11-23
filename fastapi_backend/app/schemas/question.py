from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime


# Common question fields
class QuestionBase(BaseModel):
    subject_id: UUID
    topic_id: UUID
    question_text: str
    difficulty: Optional[str] = None
    question_type: Optional[str] = None
    answer: Optional[str] = None
    explanation: Optional[str] = None
    status: str = "published"


# Schema for creating a question
class QuestionCreate(QuestionBase):
    source_id: Optional[UUID] = None
    import_batch_id: Optional[UUID] = None


# Schema for updating a question
class QuestionUpdate(BaseModel):
    subject_id: Optional[UUID] = None
    topic_id: Optional[UUID] = None
    question_text: Optional[str] = None
    difficulty: Optional[str] = None
    question_type: Optional[str] = None
    answer: Optional[str] = None
    explanation: Optional[str] = None
    status: Optional[str] = None
    source_id: Optional[UUID] = None
    import_batch_id: Optional[UUID] = None


# Schema for returning a question
class QuestionResponse(QuestionBase):
    id: UUID
    source_id: Optional[UUID] = None
    import_batch_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)