import os
import tempfile
from pydantic_settings import BaseSettings

temp_dir = tempfile.gettempdir().replace("\\", "/")
default_sqlite_url = f"sqlite:///{temp_dir}/field_engineer_surveys.db"
default_upload_dir = f"{temp_dir}/uploads"

class Settings(BaseSettings):
    # App Title & Version
    PROJECT_NAME: str = "Mobile Field Engineer 5G/4G Inspection Portal"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    
    # JWT Auth & Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "b0c3f8f94d3e2a1e7d6c5b4a39281746f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480 # 8 hours shift
    
    # OTP Configuration (5 Minutes Expiration)
    OTP_EXPIRE_MINUTES: int = 5
    OTP_LENGTH: int = 6
    
    # Azure Communication Services SMS Settings
    AZURE_COMMUNICATION_CONNECTION_STRING: str = os.getenv("AZURE_COMMUNICATION_CONNECTION_STRING", "")
    AZURE_COMMUNICATION_SENDER_PHONE: str = os.getenv("AZURE_COMMUNICATION_SENDER_PHONE", "+18005550100")
    
    # Database Configuration (Azure SQL ODBC or tempfile SQLite fallback)
    DATABASE_URL: str = os.getenv("DATABASE_URL", default_sqlite_url)

    # Azure Blob Storage Configuration
    AZURE_STORAGE_CONNECTION_STRING: str = os.getenv("AZURE_STORAGE_CONNECTION_STRING", "mock_local_storage")
    AZURE_BLOB_CONTAINER_NAME: str = os.getenv("AZURE_BLOB_CONTAINER_NAME", "rf-surveys-snaps")
    LOCAL_UPLOAD_DIR: str = os.getenv("LOCAL_UPLOAD_DIR", default_upload_dir)

    # Vision AI Configuration (OpenAI GPT-4o Vision or Azure AI Vision API)
    VISION_PROVIDER: str = os.getenv("VISION_PROVIDER", "mock") # Options: 'openai', 'azure', 'mock'
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    AZURE_VISION_ENDPOINT: str = os.getenv("AZURE_VISION_ENDPOINT", "")
    AZURE_VISION_KEY: str = os.getenv("AZURE_VISION_KEY", "")

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

settings = Settings()
os.makedirs(settings.LOCAL_UPLOAD_DIR, exist_ok=True)
