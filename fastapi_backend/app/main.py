from fastapi import FastAPI

from app.routes import (
    subject_routes,
    topic_routes,
    company_routes,
    question_routes,
    import_routes
)


# Create FastAPI application FIRST
app = FastAPI(
    title="PTQB Hub API",
    description="Placement Training and Question Bank Backend",
    version="1.0.0"
)


# =================================
# Root endpoint
# =================================

@app.get("/")
def home():
    return {
        "message": "PTQB Hub API is running"
    }


# =================================
# Health check
# =================================

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


# =================================
# Register API routers
# =================================

app.include_router(subject_routes.router)
app.include_router(topic_routes.router)
app.include_router(company_routes.router)
app.include_router(question_routes.router)
app.include_router(import_routes.router)