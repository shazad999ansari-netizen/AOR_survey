from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
import logging

from backend.core.config import settings

logger = logging.getLogger(__name__)

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initializes schema tables and seeds default mobile account records."""
    from backend.models.db_models import Base, User

    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            logger.info("Database empty. Seeding default mobile test accounts...")
            
            engineer_user = User(
                mobile_number="+18005550199",
                role="engineer"
            )
            admin_user = User(
                mobile_number="+18005550999",
                role="admin"
            )
            owner_user = User(
                mobile_number="+917738079919",
                role="admin"
            )
            owner_user_raw = User(
                mobile_number="7738079919",
                role="admin"
            )
            
            db.add(engineer_user)
            db.add(admin_user)
            db.add(owner_user)
            db.add(owner_user_raw)
            db.commit()
            logger.info("Seeding complete: +917738079919 (Owner/Admin) and test accounts created.")
    except Exception as e:
        logger.error(f"Error during database initialization: {e}")
        db.rollback()
    finally:
        db.close()
