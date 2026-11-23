from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class CompanyBase(BaseModel):
    name: str
    slug: str


class CompanyCreate(CompanyBase):
    pass


class CompanyResponse(CompanyBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)