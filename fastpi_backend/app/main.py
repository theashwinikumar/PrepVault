from fastapi import FastAPI, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database.connection import get_db

app = FastAPI(
    title="PTQB Hub API",
    description="Placement Training and Question Bank API",
    version="1.0.0"
)

@app.get("/")
def home():
    return {
        "success": True,
        "message": "PTQB Hub API is running!"
    }

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))

    return {
        "status": "healthy",
        "database": "connected"
    }
    