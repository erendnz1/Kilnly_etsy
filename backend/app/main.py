from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import engine
from app.routers.auth import router as auth_router
from app.routers.auth import router as auth_router
from app.routers.etsy import router as etsy_router

app = FastAPI(
    title="CraftPilot AI API",
    description="AI-powered Etsy Growth Platform API",
    version="0.1.0",
)


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Authentication
app.include_router(auth_router)
app.include_router(auth_router)
app.include_router(etsy_router)

@app.get("/")
def root():
    return {
        "message": "CraftPilot AI API is running"
    }


@app.get("/health")
def health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected"
        }

    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }

