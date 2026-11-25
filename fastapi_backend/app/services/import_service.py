import csv
import io
from datetime import datetime, timezone

from openpyxl import load_workbook
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

VALID_DIFFICULTIES = {
    "easy",
    "medium",
    "hard"
}

VALID_QUESTION_TYPES = {
    "theory",
    "mcq",
    "coding",
    "output_based",
    "multiple_select"
}

VALID_STATUSES = {
    "draft",
    "published",
    "disabled"
}


def read_upload_file(filename: str, content: bytes):

    filename = filename.lower()

    records = []

    if filename.endswith(".csv"):

        try:
            text = content.decode("utf-8-sig")
        except UnicodeDecodeError:
            raise ValueError("CSV must use UTF-8 encoding")

        reader = csv.DictReader(io.StringIO(text))

        if not reader.fieldnames:
            raise ValueError("CSV file has no headers")

        headers = [
            str(header).strip().lower()
            for header in reader.fieldnames
        ]

        if len(headers) != len(set(headers)):
            raise ValueError("Duplicate column names found")

        if None in headers or "" in headers:
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

            cleaned_row = {
                key.strip().lower(): value
                for key, value in row.items()
            }

            records.append((row_number, cleaned_row))

    elif filename.endswith(".xlsx"):

        workbook = load_workbook(
            io.BytesIO(content),
            read_only=True,
            data_only=True
        )

        try:
            sheet = workbook.active

            rows = sheet.iter_rows(values_only=True)

            headers = next(rows, None)

            if not headers:
                raise ValueError("Excel file is empty")

            headers = [
                str(header).strip().lower()
                if header is not None else ""
                for header in headers
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

                record = dict(zip(headers, row))

                records.append((row_number, record))

        finally:
            workbook.close()

    else:
        raise ValueError(
            "Unsupported file format. Upload CSV or XLSX."
        )

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

    names = [
        name.strip()
        for name in str(value).split(",")
        if name.strip()
    ]

    # Remove repeated names within the same cell.
    unique_names = {}

    for name in names:
        unique_names[name.casefold()] = name

    return list(unique_names.values())


def get_matching_companies(db: Session, company_names):

    if not company_names:
        return []

    companies = db.query(Company).all()

    company_lookup = {
        company.name.casefold(): company
        for company in companies
    }

    matched_companies = []

    unknown_companies = []

    for name in company_names:

        company = company_lookup.get(name.casefold())

        if company:
            matched_companies.append(company)
        else:
            unknown_companies.append(name)

    if unknown_companies:
        raise ValueError(
            "Unknown company name(s): "
            + ", ".join(unknown_companies)
        )

    return matched_companies


def import_questions(
    db: Session,
    filename: str,
    content: bytes
):

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

            if None in record:
                raise ValueError(
                    "Row contains more values than the header"
                )

            subject_slug = str(
                record.get("subject_slug") or ""
            ).strip().lower()

            topic_slug = str(
                record.get("topic_slug") or ""
            ).strip().lower()

            question_text = str(
                record.get("question_text") or ""
            ).strip()

            difficulty = str(
                record.get("difficulty") or ""
            ).strip().lower()

            question_type = str(
                record.get("question_type") or ""
            ).strip().lower()

            status = str(
                record.get("status") or "published"
            ).strip().lower()

            # Read company names.

            company_names = parse_company_names(
                record.get("company_names")
            )

            # Validate required values.

            if not subject_slug:
                raise ValueError("Subject slug is required")

            if not topic_slug:
                raise ValueError("Topic slug is required")

            if not question_text:
                raise ValueError("Question text is required")

            if difficulty not in VALID_DIFFICULTIES:
                raise ValueError("Invalid difficulty")

            if question_type not in VALID_QUESTION_TYPES:
                raise ValueError("Invalid question type")

            if status not in VALID_STATUSES:
                raise ValueError("Invalid question status")

            # Validate subject.

            subject = db.query(Subject).filter(
                Subject.slug == subject_slug
            ).first()

            if not subject:
                raise ValueError(
                    f"Subject '{subject_slug}' does not exist"
                )

            # Validate topic belongs to subject.

            topic = db.query(Topic).filter(
                Topic.slug == topic_slug,
                Topic.subject_id == subject.id
            ).first()

            if not topic:
                raise ValueError(
                    f"Topic '{topic_slug}' does not belong "
                    f"to subject '{subject_slug}'"
                )

            # Generate normalized text and fingerprint.

            normalized_text = normalize_question(question_text)

            fingerprint = generate_fingerprint(question_text)

            batch.valid_records += 1

            # Check duplicates.

            duplicate = db.query(Question).filter(
                Question.fingerprint == fingerprint
            ).first()

            if duplicate:
                batch.duplicate_records += 1
                continue

            # Match companies against existing records.

            matched_companies = get_matching_companies(
                db,
                company_names
            )

            # Insert question and company relationships
            # inside the same savepoint.

            try:

                with db.begin_nested():

                    question = Question(
                        subject_id=subject.id,
                        topic_id=topic.id,
                        question_text=question_text,
                        normalized_text=normalized_text,
                        fingerprint=fingerprint,
                        difficulty=difficulty,
                        question_type=question_type,
                        answer=clean_optional_value(
                            record.get("answer")
                        ),
                        explanation=clean_optional_value(
                            record.get("explanation")
                        ),
                        status=status,
                        import_batch_id=batch.id
                    )

                    db.add(question)
                    db.flush()

                    for company in matched_companies:

                        association = QuestionCompany(
                            question_id=question.id,
                            company_id=company.id
                        )

                        db.add(association)

                    db.flush()

                batch.inserted_records += 1

            except IntegrityError:

                batch.duplicate_records += 1

        except ValueError as error:

            batch.invalid_records += 1

            errors.append({
                "row": row_number,
                "message": str(error)
            })

    batch.status = "completed"

    batch.completed_at = datetime.now(timezone.utc)

    db.commit()

    db.refresh(batch)

    return {
        "batch": batch,
        "errors": errors
    }