from fastapi import FastAPI

from app.routes import (
    subject_routes,
    topic_routes,
    company_routes,
    question_routes
)

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


app.include_router(subject_routes.router)
app.include_router(topic_routes.router)
app.include_router(company_routes.router)
app.include_router(question_routes.router)