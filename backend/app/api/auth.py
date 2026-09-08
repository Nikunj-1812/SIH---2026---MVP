from fastapi import APIRouter, HTTPException, Depends, status
from typing import Dict, Any
import uuid
import jwt
import datetime
from backend.app.config import settings
from backend.app.schemas.all_schemas import LoginRequest, LoginResponse, RegisterRequest
from backend.app.services.security.audit import audit_logger

router = APIRouter(prefix="/api/auth", tags=["Auth"])

# Server-side Failed Login Attempt Tracker (Per email)
failed_login_attempts: Dict[str, Dict[str, Any]] = {}

@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest):
    email_clean = request.email.lower().strip()
    now = datetime.datetime.utcnow()

    # Check Rate Limit / Failed Attempt Lock (Max 5 attempts)
    record = failed_login_attempts.get(email_clean, {"count": 0, "locked_until": None})
    if record["locked_until"] and now < record["locked_until"]:
        wait_seconds = int((record["locked_until"] - now).total_seconds())
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Account temporarily locked due to {settings.MAX_LOGIN_ATTEMPTS} consecutive failed attempts. Please try again in {wait_seconds} seconds."
        )

    # Demo / In-Memory Auth Authentication Check
    if request.password != "password123" and request.password != "admin123":
        record["count"] += 1
        if record["count"] >= settings.MAX_LOGIN_ATTEMPTS:
            record["locked_until"] = now + datetime.timedelta(minutes=5)
            failed_login_attempts[email_clean] = record
            audit_logger.log_event(user_id="anonymous", action="LOGIN_LOCKED", entity_type="user", metadata={"email": email_clean})
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Account locked: Exceeded maximum {settings.MAX_LOGIN_ATTEMPTS} consecutive failed login attempts."
            )
        failed_login_attempts[email_clean] = record
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password credentials."
        )

    # Success: Reset failed attempts
    failed_login_attempts[email_clean] = {"count": 0, "locked_until": None}
    
    user_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, email_clean))
    role = "Admin" if "admin" in email_clean else "Operator"
    full_name = email_clean.split("@")[0].replace(".", " ").title()

    payload = {
        "user_id": user_id,
        "email": email_clean,
        "role": role,
        "exp": now + datetime.timedelta(days=1)
    }
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")

    audit_logger.log_event(user_id=user_id, action="USER_LOGIN", entity_type="user", metadata={"role": role})

    return LoginResponse(
        token=token,
        user_id=user_id,
        email=email_clean,
        full_name=full_name,
        role=role
    )

@router.post("/register", response_model=LoginResponse)
def register(request: RegisterRequest):
    email_clean = request.email.lower().strip()
    user_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, email_clean))
    
    payload = {
        "user_id": user_id,
        "email": email_clean,
        "role": request.role or "Operator",
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=1)
    }
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")

    audit_logger.log_event(user_id=user_id, action="USER_REGISTER", entity_type="user", metadata={"role": request.role})

    return LoginResponse(
        token=token,
        user_id=user_id,
        email=email_clean,
        full_name=request.full_name,
        role=request.role or "Operator"
    )
