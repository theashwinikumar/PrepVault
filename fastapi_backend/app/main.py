from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


from app.routes import (
    subject_routes,
    topic_routes,
    company_routes,
    question_routes,
    import_routes,
    statistics_routes
)


# Create FastAPI application FIRST
app = FastAPI(
    title="PTQB Hub API",
    description="Placement Training and Question Bank Backend",
    version="1.0.0"
)


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
app.include_router(statistics_routes.router)