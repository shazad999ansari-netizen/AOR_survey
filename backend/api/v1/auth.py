from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any

from backend.db.session import get_db
from backend.models.db_models import User
from backend.schemas.pydantic_schemas import SendOTPRequest, VerifyOTPRequest, OTPResponse, TokenResponse, UserResponse
from backend.core.security import create_access_token, get_current_user
from backend.services.otp_service import otp_service

router = APIRouter(prefix="/auth", tags=["Mobile OTP Authentication"])

@router.post("/send-otp", response_model=OTPResponse, status_code=status.HTTP_200_OK)
def send_otp(payload: SendOTPRequest, db: Session = Depends(get_db)) -> Any:
    """
    Core API Route: /api/v1/auth/send-otp
    Generates a 6-digit OTP, records hashed OTP in Azure SQL with 5-min expiration,
    and dispatches SMS via Azure Communication Services.
    """
    try:
        from backend.db.session import init_db
        init_db()
    except Exception as e:
        pass

    success, msg, demo_otp = otp_service.send_otp(db, payload.mobile_number)
    return OTPResponse(
        success=success,
        message=msg,
        demo_otp_code=demo_otp # Provided for zero-friction dev testing
    )

@router.post("/verify-otp", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def verify_otp(payload: VerifyOTPRequest, db: Session = Depends(get_db)) -> Any:
    """
    Core API Route: /api/v1/auth/verify-otp
    Validates 6-digit OTP against Azure SQL OTPLogs, provisions user session,
    and returns a signed JWT access token.
    """
    user = otp_service.verify_otp(db, payload.mobile_number, payload.otp_code)
    
    access_token = create_access_token(
        subject=str(user.id),
        role=user.role,
        mobile_number=user.mobile_number
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)) -> Any:
    """Returns profile and role metadata for the active authenticated mobile session."""
    return current_user
