from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.topic import Topic
from app.schemas.topic import TopicResponse

router = APIRouter(
    prefix="/api/topics",
    tags=["Topics"]
)


@router.get("/", response_model=list[TopicResponse])
def get_topics(
    subject_id: UUID | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(Topic)

    if subject_id:
        query = query.filter(Topic.subject_id == subject_id)

    return query.order_by(Topic.name).all()