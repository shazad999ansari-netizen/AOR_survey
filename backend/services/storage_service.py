import os
import uuid
import logging
from typing import Optional
from fastapi import UploadFile

from backend.core.config import settings

logger = logging.getLogger(__name__)

try:
    from azure.storage.blob import BlobServiceClient, ContentSettings
    AZURE_BLOB_AVAILABLE = True
except ImportError:
    AZURE_BLOB_AVAILABLE = False
    logger.warning("azure.storage.blob module not found. Defaulting to local filesystem blob fallback.")

class StorageService:
    def __init__(self):
        self.connection_string = settings.AZURE_STORAGE_CONNECTION_STRING
        self.container_name = settings.AZURE_BLOB_CONTAINER_NAME
        self.local_dir = settings.LOCAL_UPLOAD_DIR
        self.use_local_fallback = (self.connection_string == "mock_local_storage" or not AZURE_BLOB_AVAILABLE)
        
        if not self.use_local_fallback:
            try:
                self.blob_service_client = BlobServiceClient.from_connection_string(self.connection_string)
                self.container_client = self.blob_service_client.get_container_client(self.container_name)
                if not self.container_client.exists():
                    self.container_client.create_container(public_access="blob")
            except Exception as e:
                logger.warning(f"Could not initialize Azure Blob client ({e}). Switching to local storage dev fallback.")
                self.use_local_fallback = True

    async def upload_file(self, file: UploadFile, sub_directory: str = "snaps") -> str:
        """
        Uploads a physical photo or RF screenshot snap to Azure Blob Storage or local fallback directory.
        Returns the public URL or static path referencing the uploaded asset.
        """
        file_ext = os.path.splitext(file.filename or "")[1] or ".jpg"
        unique_name = f"{sub_directory}/{uuid.uuid4().hex}{file_ext}"
        
        content = await file.read()
        
        if not self.use_local_fallback:
            try:
                blob_client = self.container_client.get_blob_client(unique_name)
                content_settings = ContentSettings(content_type=file.content_type or "image/jpeg")
                blob_client.upload_blob(content, overwrite=True, content_settings=content_settings)
                return blob_client.url
            except Exception as e:
                logger.error(f"Azure Blob upload failed ({e}). Reverting to local storage save.")
                self.use_local_fallback = True

        # Local Filesystem Dev Fallback
        local_path_full = os.path.join(self.local_dir, unique_name.replace("/", os.sep))
        os.makedirs(os.path.dirname(local_path_full), exist_ok=True)
        
        with open(local_path_full, "wb") as buffer:
            buffer.write(content)
        
        # Return web accessible static URL matching main.py mount
        return f"/uploads/{unique_name.replace(os.sep, '/')}"

storage_service = StorageService()
