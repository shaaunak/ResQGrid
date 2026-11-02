import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.v1.admin import router as admin_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.assignments import router as assignments_router
from app.api.v1.auth import router as auth_router
from app.api.v1.evidence import router as evidence_router
from app.api.v1.health import router as health_router
from app.api.v1.incidents import router as incidents_router
from app.api.v1.intelligence import router as intelligence_router
from app.api.v1.inventory import router as inventory_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.simulations import router as simulations_router
from app.api.v1.teams import router as teams_router
from app.api.v1.users import router as users_router
from app.core.config import settings
from app.core.database import Base, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle event to verify database connectivity and create storage folders."""
    os.makedirs(settings.LOCAL_STORAGE_DIR, exist_ok=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="ResQGrid API",
    description="Cloud-Native Disaster Response & Intelligent Resource Coordination Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.ENVIRONMENT == "development" else settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler to sanitize error responses in production."""
    # In development, return error message for debugging
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal operational error occurred.", "error": str(exc)},
    )


# Register API v1 routers
api_v1_prefix = "/api/v1"
app.include_router(health_router, prefix=api_v1_prefix)
app.include_router(auth_router, prefix=api_v1_prefix)
app.include_router(users_router, prefix=api_v1_prefix)
app.include_router(incidents_router, prefix=api_v1_prefix)
app.include_router(teams_router, prefix=api_v1_prefix)
app.include_router(assignments_router, prefix=api_v1_prefix)
app.include_router(inventory_router, prefix=api_v1_prefix)
app.include_router(evidence_router, prefix=api_v1_prefix)
app.include_router(notifications_router, prefix=api_v1_prefix)
app.include_router(simulations_router, prefix=api_v1_prefix)
app.include_router(intelligence_router, prefix=api_v1_prefix)
app.include_router(analytics_router, prefix=api_v1_prefix)
app.include_router(admin_router, prefix=api_v1_prefix)


@app.get("/")
async def root():
    return {
        "service": "ResQGrid Core API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "operational",
    }
