from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.company import Company
from app.schemas.company import CompanyResponse

router = APIRouter(
    prefix="/api/companies",
    tags=["Companies"]
)


@router.get("/", response_model=list[CompanyResponse])
def get_companies(db: Session = Depends(get_db)):
    return db.query(Company).order_by(Company.name).all()