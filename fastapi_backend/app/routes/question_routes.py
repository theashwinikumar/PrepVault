from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.question import Question
from app.models.subject import Subject
from app.models.topic import Topic
from app.schemas.question import QuestionCreate, QuestionResponse
from app.utils.question_utils import normalize_question, generate_fingerprint


# 
from sqlalchemy import or_

from app.schemas.question import QuestionUpdate

from app.utils.question_utils import (
    normalize_question,
    generate_fingerprint
)

#

 
router = APIRouter(
    prefix="/api/questions",
    tags=["Questions"]
)


@router.get("/", response_model=list[QuestionResponse])
def get_questions(
    subject_id: UUID | None = None,
    topic_id: UUID | None = None,
    difficulty: str | None = None,
    question_type: str | None = None,
    company_id: UUID | None = None,
    search: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):

    query = db.query(Question).filter(
        Question.status == "published"
    )

    if subject_id:
        query = query.filter(
            Question.subject_id == subject_id
        )

    if topic_id:
        query = query.filter(
            Question.topic_id == topic_id
        )

    if difficulty:
        query = query.filter(
            Question.difficulty == difficulty.lower()
        )

    if question_type:
        query = query.filter(
            Question.question_type == question_type.lower()
        )

    if company_id:
        query = query.filter(
            Question.companies.any(id=company_id)
        )

    if search:
        query = query.filter(
            Question.question_text.ilike(f"%{search}%")
        )

    return (
        query.order_by(Question.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{question_id}", response_model=QuestionResponse)
def get_question(
    question_id: UUID,
    db: Session = Depends(get_db)
):

    question = db.query(Question).filter(
        Question.id == question_id,
        Question.status == "published"
    ).first()

    if not question:
        raise HTTPException(
            status_code=404,
            detail="Question not found"
        )

    return question


@router.post("/", response_model=QuestionResponse, status_code=201)
def create_question(
    question_data: QuestionCreate,
    db: Session = Depends(get_db)
):
    subject = db.query(Subject).filter(
        Subject.id == question_data.subject_id
    ).first()

    if not subject:
        raise HTTPException(
            status_code=404,
            detail="Subject not found"
        )

    topic = db.query(Topic).filter(
        Topic.id == question_data.topic_id,
        Topic.subject_id == question_data.subject_id
    ).first()

    if not topic:
        raise HTTPException(
            status_code=400,
            detail="Topic does not belong to the selected subject"
        )

    normalized_text = normalize_question(question_data.question_text)
    fingerprint = generate_fingerprint(question_data.question_text)

    existing_question = db.query(Question).filter(
        Question.fingerprint == fingerprint
    ).first()

    if existing_question:
        raise HTTPException(
            status_code=409,
            detail="This question already exists"
        )

    new_question = Question(
        subject_id=question_data.subject_id,
        topic_id=question_data.topic_id,
        source_id=question_data.source_id,
        import_batch_id=question_data.import_batch_id,
        question_text=question_data.question_text,
        normalized_text=normalized_text,
        fingerprint=fingerprint,
        difficulty=question_data.difficulty,
        question_type=question_data.question_type,
        answer=question_data.answer,
        explanation=question_data.explanation,
        status=question_data.status
    )

    try:
        db.add(new_question)
        db.commit()
        db.refresh(new_question)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Question could not be saved. Check for duplicate data or invalid references."
        )

    return new_question



@router.patch("/{question_id}", response_model=QuestionResponse)
def update_question(
    question_id: UUID,
    question_data: QuestionUpdate,
    db: Session = Depends(get_db)
):
    question = db.query(Question).filter(
        Question.id == question_id
    ).first()

    if not question:
        raise HTTPException(
            status_code=404,
            detail="Question not found"
        )

    update_data = question_data.model_dump(exclude_unset=True)

    # Validate question text
    if "question_text" in update_data:
        if not update_data["question_text"] or not update_data["question_text"].strip():
            raise HTTPException(
                status_code=422,
                detail="Question text cannot be empty"
            )

        update_data["normalized_text"] = normalize_question(
            update_data["question_text"]
        )

        new_fingerprint = generate_fingerprint(
            update_data["question_text"]
        )

        duplicate = db.query(Question).filter(
            Question.fingerprint == new_fingerprint,
            Question.id != question_id
        ).first()

        if duplicate:
            raise HTTPException(
                status_code=409,
                detail="Another question with the same text already exists"
            )

        update_data["fingerprint"] = new_fingerprint

    # Validate subject and topic together
    new_subject_id = update_data.get(
        "subject_id", question.subject_id
    )

    new_topic_id = update_data.get(
        "topic_id", question.topic_id
    )

    topic = db.query(Topic).filter(
        Topic.id == new_topic_id,
        Topic.subject_id == new_subject_id
    ).first()

    if not topic:
        raise HTTPException(
            status_code=400,
            detail="Topic does not belong to the selected subject"
        )

    # Apply changes
    for key, value in update_data.items():
        setattr(question, key, value)

    try:
        db.commit()
        db.refresh(question)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Question update failed due to conflicting or invalid data"
        )

    return question


@router.patch("/{question_id}/disable")
def disable_question(
    question_id: UUID,
    db: Session = Depends(get_db)
):
    question = db.query(Question).filter(
        Question.id == question_id
    ).first()

    if not question:
        raise HTTPException(
            status_code=404,
            detail="Question not found"
        )

    question.status = "disabled"

    db.commit()

    return {
        "message": "Question disabled successfully",
        "question_id": str(question.id)
    }
    
    
    
@router.patch("/{question_id}/publish")
def publish_question(
    question_id: UUID,
    db: Session = Depends(get_db)
    ):
    question = db.query(Question).filter(
        Question.id == question_id
    ).first()

    if not question:
        raise HTTPException(
            status_code=404,
            detail="Question not found"
        )

    question.status = "published"

    db.commit()

    return {
        "message": "Question published successfully",
        "question_id": str(question.id)
    }