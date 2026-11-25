import csv
import io
import re
import unicodedata
from datetime import datetime, timezone

from openpyxl import load_workbook
from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.subject import Subject
from app.models.topic import Topic
from app.models.question import Question
from app.models.import_batch import ImportBatch
from app.models.company import Company
from app.models.question_company import QuestionCompany

from app.utils.question_utils import (
    normalize_question,
    generate_fingerprint
)


REQUIRED_COLUMNS = {
    "subject_slug",
    "topic_slug",
    "question_text",
    "difficulty",
    "question_type"
}

VALID_DIFFICULTIES = {"easy", "medium", "hard"}

VALID_QUESTION_TYPES = {
    "theory",
    "mcq",
    "coding",
    "output_based",
    "multiple_select"
}

VALID_STATUSES = {"draft", "published", "disabled"}


def _slugify(value: str) -> str:
    """Create a URL/database-friendly slug from a display name."""
    value = unicodedata.normalize("NFKD", value)
    value = value.encode("ascii", "ignore").decode("ascii")
    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def _display_name_from_slug(slug: str) -> str:
    """Convert a slug such as operating-systems to Operating Systems."""
    return " ".join(part.capitalize() for part in slug.split("-") if part)


def read_upload_file(filename: str, content: bytes):
    filename = filename.lower()
    records = []

    if filename.endswith(".csv"):
        try:
            decoded = content.decode("utf-8-sig")
        except UnicodeDecodeError as exc:
            raise ValueError("CSV must use UTF-8 encoding") from exc

        reader = csv.DictReader(io.StringIO(decoded))
        if not reader.fieldnames:
            raise ValueError("CSV file has no headers")

        headers = [
            str(header).strip().lower() if header is not None else ""
            for header in reader.fieldnames
        ]

        if len(headers) != len(set(headers)):
            raise ValueError("Duplicate column names found")
        if "" in headers:
            raise ValueError("Invalid column name")

        missing = REQUIRED_COLUMNS - set(headers)
        if missing:
            raise ValueError(
                f"Missing columns: {', '.join(sorted(missing))}"
            )

        for row_number, row in enumerate(reader, start=2):
            if None in row:
                records.append((row_number, row))
                continue

            if not any(
                value is not None and str(value).strip()
                for value in row.values()
            ):
                continue

            records.append((
                row_number,
                {
                    (key.strip().lower() if key else key): value
                    for key, value in row.items()
                }
            ))

    elif filename.endswith(".xlsx"):
        try:
            workbook = load_workbook(
                io.BytesIO(content),
                read_only=True,
                data_only=True
            )
        except Exception as exc:
            raise ValueError(f"Could not read Excel file: {exc}") from exc

        try:
            sheet = workbook.active
            rows = sheet.iter_rows(values_only=True)
            raw_headers = next(rows, None)

            if not raw_headers:
                raise ValueError("Excel file is empty")

            headers = [
                str(header).strip().lower()
                if header is not None else ""
                for header in raw_headers
            ]

            if len(headers) != len(set(headers)):
                raise ValueError("Duplicate column names found")
            if "" in headers:
                raise ValueError("Invalid column name")

            missing = REQUIRED_COLUMNS - set(headers)
            if missing:
                raise ValueError(
                    f"Missing columns: {', '.join(sorted(missing))}"
                )

            for row_number, row in enumerate(rows, start=2):
                if not any(
                    value is not None and str(value).strip()
                    for value in row
                ):
                    continue

                # Preserve extra cell values so malformed rows are reported.
                if len(row) > len(headers) and any(
                    value is not None and str(value).strip()
                    for value in row[len(headers):]
                ):
                    records.append((row_number, {None: row}))
                    continue

                records.append((
                    row_number,
                    dict(zip(headers, row[:len(headers)]))
                ))
        finally:
            workbook.close()

    else:
        raise ValueError("Unsupported file format. Upload CSV or XLSX.")

    if not records:
        raise ValueError("No question records found")

    return records


def clean_optional_value(value):
    if value is None:
        return None
    value = str(value).strip()
    return value if value else None


def parse_company_names(value):
    if value is None:
        return []

    # Comma-separated company names, as in the agreed import template.
    unique_names = {}
    for raw_name in str(value).split(","):
        name = raw_name.strip()
        if name:
            unique_names.setdefault(name.casefold(), name)

    return list(unique_names.values())


def _get_or_create_subject(db: Session, subject_slug: str) -> Subject:
    subject = db.query(Subject).filter(
        func.lower(Subject.slug) == subject_slug
    ).one_or_none()

    if subject:
        return subject

    name = _display_name_from_slug(subject_slug)
    subject = db.query(Subject).filter(
        func.lower(Subject.name) == name.casefold()
    ).one_or_none()

    if subject:
        return subject

    subject = Subject(name=name, slug=subject_slug)
    db.add(subject)
    db.flush()
    return subject


def _get_or_create_topic(
    db: Session,
    subject: Subject,
    topic_slug: str
) -> Topic:
    topic = db.query(Topic).filter(
        Topic.subject_id == subject.id,
        func.lower(Topic.slug) == topic_slug
    ).one_or_none()

    if topic:
        return topic

    name = _display_name_from_slug(topic_slug)
    topic = db.query(Topic).filter(
        Topic.subject_id == subject.id,
        func.lower(Topic.name) == name.casefold()
    ).one_or_none()

    if topic:
        return topic

    topic = Topic(
        subject_id=subject.id,
        name=name,
        slug=topic_slug
    )
    db.add(topic)
    db.flush()
    return topic


def _get_or_create_company(db: Session, company_name: str) -> Company:
    company = db.query(Company).filter(
        func.lower(Company.name) == company_name.casefold()
    ).one_or_none()

    if company:
        return company

    base_slug = _slugify(company_name)
    if not base_slug:
        raise ValueError(
            f"Company name '{company_name}' cannot be converted to a slug"
        )

    slug = base_slug
    suffix = 2
    while db.query(Company.id).filter(
        func.lower(Company.slug) == slug
    ).first():
        slug = f"{base_slug}-{suffix}"
        suffix += 1

    company = Company(name=company_name, slug=slug)
    db.add(company)
    db.flush()
    return company


def _validate_row(record):
    if None in record:
        raise ValueError("Row contains more values than the header")

    subject_slug = str(record.get("subject_slug") or "").strip().lower()
    topic_slug = str(record.get("topic_slug") or "").strip().lower()
    question_text = str(record.get("question_text") or "").strip()
    difficulty = str(record.get("difficulty") or "").strip().lower()
    question_type = str(record.get("question_type") or "").strip().lower()
    status = str(record.get("status") or "published").strip().lower()

    if not subject_slug:
        raise ValueError("Subject slug is required")
    if not topic_slug:
        raise ValueError("Topic slug is required")
    if not question_text:
        raise ValueError("Question text is required")
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", subject_slug):
        raise ValueError("Subject slug must contain lowercase letters, numbers and hyphens")
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", topic_slug):
        raise ValueError("Topic slug must contain lowercase letters, numbers and hyphens")
    if difficulty not in VALID_DIFFICULTIES:
        raise ValueError(f"Invalid difficulty '{difficulty}'")
    if question_type not in VALID_QUESTION_TYPES:
        raise ValueError(f"Invalid question_type '{question_type}'")
    if status not in VALID_STATUSES:
        raise ValueError(f"Invalid status '{status}'")

    return {
        "subject_slug": subject_slug,
        "topic_slug": topic_slug,
        "question_text": question_text,
        "difficulty": difficulty,
        "question_type": question_type,
        "status": status,
        "answer": clean_optional_value(record.get("answer")),
        "explanation": clean_optional_value(record.get("explanation")),
        "company_names": parse_company_names(record.get("company_names"))
    }


def import_questions(db: Session, filename: str, content: bytes):
    records = read_upload_file(filename, content)

    batch = ImportBatch(
        filename=filename,
        total_records=len(records),
        status="processing"
    )
    db.add(batch)
    db.flush()

    errors = []

    for row_number, record in records:
        try:
            data = _validate_row(record)
            normalized_text = normalize_question(data["question_text"])
            fingerprint = generate_fingerprint(data["question_text"])

            # Count rows passing field validation, including valid duplicates.
            batch.valid_records += 1

            # Check duplicates before creating any master records.
            duplicate = db.query(Question.id).filter(
                Question.fingerprint == fingerprint
            ).first()

            if duplicate:
                batch.duplicate_records += 1
                continue

            # Each row is atomic: newly created master data, question and
            # company mappings all roll back together if this row fails.
            try:
                with db.begin_nested():
                    subject = _get_or_create_subject(
                        db, data["subject_slug"]
                    )
                    topic = _get_or_create_topic(
                        db, subject, data["topic_slug"]
                    )

                    companies = [
                        _get_or_create_company(db, name)
                        for name in data["company_names"]
                    ]

                    question = Question(
                        subject_id=subject.id,
                        topic_id=topic.id,
                        question_text=data["question_text"],
                        normalized_text=normalized_text,
                        fingerprint=fingerprint,
                        difficulty=data["difficulty"],
                        question_type=data["question_type"],
                        answer=data["answer"],
                        explanation=data["explanation"],
                        status=data["status"],
                        import_batch_id=batch.id
                    )
                    db.add(question)
                    db.flush()

                    for company in companies:
                        db.add(QuestionCompany(
                            question_id=question.id,
                            company_id=company.id
                        ))

                    db.flush()

                batch.inserted_records += 1

            except IntegrityError as exc:
                # The savepoint has rolled back. Only classify as duplicate
                # when the fingerprint is now present; otherwise report it.
                duplicate = db.query(Question.id).filter(
                    Question.fingerprint == fingerprint
                ).first()

                if duplicate:
                    batch.duplicate_records += 1
                else:
                    batch.invalid_records += 1
                    errors.append({
                        "row": row_number,
                        "message": (
                            "Database constraint error while importing row; "
                            "no records from this row were saved."
                        )
                    })

        except ValueError as exc:
            batch.invalid_records += 1
            errors.append({
                "row": row_number,
                "message": str(exc)
            })

    batch.status = "completed"
    batch.completed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(batch)

    return {
        "batch": batch,
        "errors": errors
    }
