import hashlib
import random
import logging
from datetime import datetime, timedelta, timezone
from typing import Tuple, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from backend.core.config import settings
from backend.models.db_models import OTPLog, User

logger = logging.getLogger(__name__)

# Try importing Azure Communication Services SMS SDK
try:
    from azure.communication.sms import SmsClient
    AZURE_SMS_AVAILABLE = True
except ImportError:
    AZURE_SMS_AVAILABLE = False
    logger.info("azure-communication-sms SDK not installed. Defaulting to SMS Dev Logger driver.")

class OTPService:
    def __init__(self):
        self.conn_str = settings.AZURE_COMMUNICATION_CONNECTION_STRING
        self.sender_phone = settings.AZURE_COMMUNICATION_SENDER_PHONE
        self.client = None

        if AZURE_SMS_AVAILABLE and self.conn_str:
            try:
                self.client = SmsClient.from_connection_string(self.conn_str)
                logger.info("Azure Communication Services SMS Client initialized successfully.")
            except Exception as e:
                logger.warning(f"Could not connect to Azure Communication Services ({e}). Using SMS Dev Logger.")

    def _hash_otp(self, otp_code: str) -> str:
        """Hashes 6-digit OTP code using SHA256 with salt."""
        salted = f"{settings.SECRET_KEY}:{otp_code}"
        return hashlib.sha256(salted.encode('utf-8')).hexdigest()

    def generate_numeric_otp(self) -> str:
        """Generates a random 6-digit numeric OTP."""
        return f"{random.randint(100000, 999999)}"

    def dispatch_sms(self, mobile_number: str, otp_code: str) -> bool:
        """Dispatches OTP message via Azure Communication Services SMS API or Dev Logger."""
        message = f"Your Enterprise 5G/4G Field Portal login OTP code is: {otp_code}. Valid for {settings.OTP_EXPIRE_MINUTES} minutes."
        
        if self.client:
            try:
                sms_responses = self.client.send(
                    from_=self.sender_phone,
                    to=[mobile_number],
                    message=message
                )
                for response in sms_responses:
                    if response.successful:
                        logger.info(f"SMS successfully dispatched via Azure Communication Services to {mobile_number}")
                        return True
                    else:
                        logger.error(f"Azure SMS delivery error: {response.error_message}")
            except Exception as e:
                logger.error(f"Azure Communication Services SMS exception: {e}")

        # Development Fallback Logger
        logger.info(f"[SMS DEV LOGGER] To: {mobile_number} | Message: {message} | OTP Code: {otp_code}")
        return True

    def send_otp(self, db: Session, mobile_number: str) -> Tuple[bool, str, str]:
        """Generates 6-digit OTP, records hashed OTP in Azure SQL with 5-min expiry, and dispatches SMS."""
        clean_mobile = mobile_number.strip()
        if not clean_mobile:
            raise HTTPException(status_code=400, detail="Valid Mobile Number is required.")

        try:
            # Invalidate previous unused active OTPs for this number
            db.query(OTPLog).filter(
                OTPLog.mobile_number == clean_mobile, 
                OTPLog.is_used == False
            ).update({"is_used": True})
        except Exception:
            db.rollback()
            from backend.db.session import init_db
            init_db()

        otp_code = self.generate_numeric_otp()
        hashed_otp = self._hash_otp(otp_code)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

        otp_entry = OTPLog(
            mobile_number=clean_mobile,
            otp_hash=hashed_otp,
            expires_at=expires_at,
            is_used=False
        )
        db.add(otp_entry)
        db.commit()

        # Dispatch via Azure Communication Services
        self.dispatch_sms(clean_mobile, otp_code)

        return True, f"OTP dispatched successfully to {clean_mobile}.", otp_code

    def verify_otp(self, db: Session, mobile_number: str, otp_code: str) -> User:
        """Validates 6-digit OTP against Azure SQL OTPLogs and resolves/provisions User account."""
        clean_mobile = mobile_number.strip()
        hashed_input = self._hash_otp(otp_code.strip())

        now = datetime.now(timezone.utc)
        
        # Look up active matching OTP log
        otp_log = db.query(OTPLog).filter(
            OTPLog.mobile_number == clean_mobile,
            OTPLog.is_used == False
        ).order_by(OTPLog.created_at.desc()).first()

        if not otp_log:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active OTP request found for this mobile number. Please request a new OTP."
            )

        # Check Expiration (ensure datetime is timezone-aware)
        exp_time = otp_log.expires_at
        if exp_time.tzinfo is None:
            exp_time = exp_time.replace(tzinfo=timezone.utc)

        if now > exp_time:
            otp_log.is_used = True
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP has expired (validity 5 minutes). Please request a new OTP."
            )

        if otp_log.otp_hash != hashed_input:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid 6-digit OTP code. Please verify and try again."
            )

        # Mark OTP as consumed
        otp_log.is_used = True
        
        # Resolve or auto-provision User
        user = db.query(User).filter(User.mobile_number == clean_mobile).first()
        if not user:
            # Check if this is the designated Owner / Admin mobile number
            is_admin_number = clean_mobile in ["+917738079919", "7738079919", "+18005550999"]
            assigned_role = "admin" if is_admin_number else "engineer"
            user = User(
                mobile_number=clean_mobile,
                role=assigned_role
            )
            db.add(user)
        
        db.commit()
        db.refresh(user)
        return user

otp_service = OTPService()
