"""FastAPI application entrypoint for the Clinical Lab Results Analyzer."""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.routes import router

from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("clinical_analyzer.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("==================================================")
    logger.info(" Clinical Lab Results Analyzer Backend Starting Up")
    logger.info(f" Version: {settings.VERSION}")
    logger.info(f" Gemini Model: {settings.GEMINI_MODEL}")
    logger.info(f" Google API Key Present: {bool(settings.GOOGLE_API_KEY)}")
    logger.info("==================================================")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Production-grade Clinical Laboratory Results Analyzer using deterministic reference-range "
        "classification, a simple LangGraph workflow, an MCP reference-range server, and Google Gemini "
        "for cautious clinical explanations."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Enable CORS for frontend applications
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for easy local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API router
app.include_router(router, prefix=settings.API_PREFIX)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
    )
