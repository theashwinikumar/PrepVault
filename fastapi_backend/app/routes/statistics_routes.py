from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.connection import get_db

from app.models.question import Question
from app.models.subject import Subject
from app.models.topic import Topic
from app.models.company import Company
from app.models.question_company import QuestionCompany


router = APIRouter(
    prefix="/api/statistics",
    tags=["Question Statistics"]
)


# =====================================
# 1. SUBJECT-WISE QUESTION COUNT
# =====================================

@router.get("/subjects")
def subject_question_count(
    db: Session = Depends(get_db)
):

    results = (
        db.query(
            Subject.id,
            Subject.name,
            func.count(Question.id).label("question_count")
        )
        .outerjoin(
            Question,
            (Question.subject_id == Subject.id) &
            (Question.status == "published")
        )
        .group_by(Subject.id, Subject.name)
        .order_by(Subject.name)
        .all()
    )

    return [
        {
            "subject_id": str(row.id),
            "subject_name": row.name,
            "question_count": row.question_count
        }
        for row in results
    ]


# =====================================
# 2. TOPIC-WISE QUESTION COUNT
# =====================================

@router.get("/topics")
def topic_question_count(
    subject_id: str | None = None,
    db: Session = Depends(get_db)
):

    query = (
        db.query(
            Topic.id,
            Topic.name,
            Topic.subject_id,
            func.count(Question.id).label("question_count")
        )
        .outerjoin(
            Question,
            (Question.topic_id == Topic.id) &
            (Question.status == "published")
        )
    )

    if subject_id:
        query = query.filter(
            Topic.subject_id == subject_id
        )

    results = (
        query.group_by(
            Topic.id,
            Topic.name,
            Topic.subject_id
        )
        .order_by(Topic.name)
        .all()
    )

    return [
        {
            "topic_id": str(row.id),
            "topic_name": row.name,
            "subject_id": str(row.subject_id),
            "question_count": row.question_count
        }
        for row in results
    ]


# =====================================
# 3. DIFFICULTY-WISE QUESTION COUNT
# =====================================

@router.get("/difficulty")
def difficulty_question_count(
    db: Session = Depends(get_db)
):

    results = (
        db.query(
            Question.difficulty,
            func.count(Question.id).label("question_count")
        )
        .filter(
            Question.status == "published"
        )
        .group_by(Question.difficulty)
        .all()
    )

    return [
        {
            "difficulty": row.difficulty,
            "question_count": row.question_count
        }
        for row in results
    ]


# =====================================
# 4. COMPANY-WISE QUESTION COUNT
# =====================================

@router.get("/companies")
def company_question_count(
    db: Session = Depends(get_db)
):

    results = (
        db.query(
            Company.id,
            Company.name,
            func.count(QuestionCompany.question_id).label(
                "question_count"
            )
        )
        .outerjoin(
            QuestionCompany,
            QuestionCompany.company_id == Company.id
        )
        .outerjoin(
            Question,
            (Question.id == QuestionCompany.question_id) &
            (Question.status == "published")
        )
        .group_by(Company.id, Company.name)
        .order_by(Company.name)
        .all()
    )

    return [
        {
            "company_id": str(row.id),
            "company_name": row.name,
            "question_count": row.question_count
        }
        for row in results
    ]


# =====================================
# 5. TOTAL PUBLISHED QUESTION COUNT
# =====================================

@router.get("/overview")
def question_overview(
    db: Session = Depends(get_db)
):

    total_questions = db.query(Question).filter(
        Question.status == "published"
    ).count()

    total_subjects = db.query(Subject).count()

    total_topics = db.query(Topic).count()

    total_companies = db.query(Company).count()

    return {
        "total_questions": total_questions,
        "total_subjects": total_subjects,
        "total_topics": total_topics,
        "total_companies": total_companies
    }