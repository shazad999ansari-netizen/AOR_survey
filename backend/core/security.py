from datetime import datetime, timedelta, timezone
from typing import Optional, Any
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from backend.core.config import settings
from backend.db.session import get_db
from backend.models.db_models import User

security = HTTPBearer()

def create_access_token(subject: str, role: str, mobile_number: str, expires_delta: Optional[timedelta] = None) -> str:
    """Creates a signed JWT session token containing user ID, mobile number, and RBAC role."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "mobile_number": mobile_number,
        "role": role,
        "iat": datetime.now(timezone.utc)
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> dict[str, Any]:
    """Decodes and validates a JWT session token signature."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token has expired. Please authenticate with OTP again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token signature.",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Extracts JWT bearer token from authorization headers and resolves active user account."""
    token = credentials.credentials
    payload = decode_token(token)
    user_id_str: Optional[str] = payload.get("sub")
    
    if not user_id_str or not user_id_str.isdigit():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token authentication subject."
        )
    
    user = db.query(User).filter(User.id == int(user_id_str)).first()
    if not user:
        # Fallback to lookup by mobile number or auto-provision from valid signed JWT session
        mobile = payload.get("mobile_number")
        role = payload.get("role", "engineer")
        if mobile:
            user = db.query(User).filter(User.mobile_number == mobile).first()
            if not user:
                user = User(id=int(user_id_str), mobile_number=mobile, role=role)
                db.add(user)
                try:
                    db.commit()
                    db.refresh(user)
                except Exception:
                    db.rollback()
                    user = db.query(User).filter(User.mobile_number == mobile).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user session could not be resolved. Please log in with OTP again."
        )
    return user

def require_engineer(current_user: User = Depends(get_current_user)) -> User:
    """RBAC Guard: Authorizes Field Engineers, Managers, and Report Authenticators."""
    if current_user.role not in ["engineer", "manager", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions: Field Engineer operational credentials required."
        )
    return current_user

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """RBAC Guard: Authorizes exclusive Report Authenticator and Manager executive dashboard operations."""
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: Manager or Report Authenticator executive credentials required."
        )
    return current_user
