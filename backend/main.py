import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.core.config import settings
from backend.db.session import init_db
from backend.api.v1 import auth, surveys, hotspots, reports

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(name)s - %(message)s")
logger = logging.getLogger(__name__)

import asyncio
from backend.telegram_bot import run_telegram_bot_loop

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Execute database initialization and RBAC seed accounts on application startup
    logger.info("Initializing Azure SQL Database schema and testing account seeds...")
    try:
        init_db()
    except Exception as e:
        logger.error(f"Failed to run init_db during lifespan startup: {e}")
    
    # Launch Telegram Bot background worker if TELEGRAM_BOT_TOKEN is provided
    bot_task = asyncio.create_task(run_telegram_bot_loop())
    yield
    bot_task.cancel()
    logger.info("Application shutdown completed.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise Zero-Entry Field Engineer Portal API for 5G/4G Inspections & RF Vision AI Audits.",
    lifespan=lifespan
)

# Enable CORS for seamless interaction with web frontend UI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount local upload folder for photo verification (with serverless fallback guard)
try:
    uploads_dir = os.path.abspath(settings.LOCAL_UPLOAD_DIR)
    os.makedirs(uploads_dir, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")
except Exception as err:
    logger.warning(f"Static uploads mount skipped or running in read-only environment: {err}")

# Register API v1 Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(surveys.router, prefix=settings.API_V1_STR)
app.include_router(hotspots.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)

# Mount Frontend App statically at Root (MUST be after API registration)
frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend")
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
else:
    logger.warning("Frontend directory not found at expected path during assembly.")
