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
        try:
            file_ext = os.path.splitext(file.filename or "")[1] or ".jpg"
            unique_name = f"{sub_directory}/{uuid.uuid4().hex}{file_ext}"
            
            await file.seek(0)
            content = await file.read()
            
            if not content:
                return "/uploads/placeholder.jpg"

            if not self.use_local_fallback and hasattr(self, 'container_client') and self.container_client:
                try:
                    blob_client = self.container_client.get_blob_client(unique_name)
                    content_settings = ContentSettings(content_type=file.content_type or "image/jpeg")
                    blob_client.upload_blob(content, overwrite=True, content_settings=content_settings)
                    return blob_client.url
                except Exception as e:
                    logger.error(f"Azure Blob upload failed ({e}). Reverting to local storage save.")
                    self.use_local_fallback = True

            # Local Filesystem Dev Fallback
            try:
                local_path_full = os.path.join(self.local_dir, unique_name.replace("/", os.sep))
                os.makedirs(os.path.dirname(local_path_full), exist_ok=True)
                
                with open(local_path_full, "wb") as buffer:
                    buffer.write(content)
                
                clean_rel_path = unique_name.replace(os.sep, '/')
                return f"/uploads/{clean_rel_path}"
            except Exception as local_err:
                logger.warning(f"Local storage save failed ({local_err}). Fallback to base64 data URL.")
                import base64
                b64 = base64.b64encode(content).decode('utf-8')
                mime = file.content_type or "image/jpeg"
                return f"data:{mime};base64,{b64}"
        except Exception as global_err:
            logger.error(f"Storage upload exception: {global_err}")
            return "/uploads/placeholder.jpg"

storage_service = StorageService()
