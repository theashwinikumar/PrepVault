from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile
)

from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.import_batch import ImportBatch

from app.schemas.import_batch import (
    ImportBatchResponse,
    ImportResultResponse
)

from app.services.import_service import import_questions


router = APIRouter(
    prefix="/api/imports",
    tags=["Question Imports"]
)


MAX_FILE_SIZE = 10 * 1024 * 1024


# ==========================================
# 1. Upload Questions
# ==========================================

@router.post(
    "/questions",
    response_model=ImportResultResponse,
    status_code=201
)
async def upload_questions(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    filename = file.filename or ""

    if not filename.lower().endswith((".csv", ".xlsx")):
        raise HTTPException(
            status_code=400,
            detail="Only CSV and XLSX files are supported"
        )

    content = await file.read(MAX_FILE_SIZE + 1)

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File size cannot exceed 10 MB"
        )

    try:

        result = import_questions(
            db=db,
            filename=filename,
            content=content
        )

        return result

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred during import"
        )

    finally:
        await file.close()


# ==========================================
# 2. Get Import History
# ==========================================

@router.get(
    "/",
    response_model=list[ImportBatchResponse]
)
def get_import_history(
    db: Session = Depends(get_db)
):

    return db.query(ImportBatch).order_by(
        ImportBatch.started_at.desc()
    ).all()


# ==========================================
# 3. Get Import Batch Details
# ==========================================

@router.get(
    "/{batch_id}",
    response_model=ImportBatchResponse
)
def get_import_details(
    batch_id: UUID,
    db: Session = Depends(get_db)
):

    batch = db.query(ImportBatch).filter(
        ImportBatch.id == batch_id
    ).first()

    if not batch:

        raise HTTPException(
            status_code=404,
            detail="Import batch not found"
        )

    return batch