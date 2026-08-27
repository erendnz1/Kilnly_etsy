import hashlib
import secrets
from datetime import datetime, timedelta

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal
from app.models.user import User
from app.schemas.auth import (
    MessageResponse,
    PasswordResetRequest,
    TokenResponse,
    UserLogin,
    UserRegister,
)
from app.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.services.email_service import send_email


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


security = HTTPBearer()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def hash_verification_token(token: str) -> str:
    return hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()


def create_verification_token() -> str:
    return secrets.token_urlsafe(32)


def create_verification_expiry() -> datetime:
    """
    Create a naive UTC datetime.

    PostgreSQL DateTime column is currently timezone-naive,
    so all verification timestamps use the same format.
    """
    return datetime.utcnow() + timedelta(minutes=30)


def is_token_expired(expires_at: datetime | None) -> bool:
    """
    Check expiration using naive UTC datetimes.
    Handles the existing DB value safely.
    """

    if expires_at is None:
        return True

    # Remove timezone info if an aware datetime somehow
    # comes back from the database.
    if expires_at.tzinfo is not None:
        expires_at = expires_at.replace(tzinfo=None)

    return expires_at < datetime.utcnow()
def create_password_reset_token() -> str:
    return secrets.token_urlsafe(32)


def hash_password_reset_token(token: str) -> str:
    return hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()


def create_password_reset_expiry() -> datetime:
    """
    Create a naive UTC datetime.

    PostgreSQL DateTime column is timezone-naive,
    so password reset timestamps use the same format
    as email verification timestamps.
    """
    return datetime.utcnow() + timedelta(minutes=30)

@router.post(
    "/register",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    user_data: UserRegister,
    db: Session = Depends(get_db),
):
    existing_user = (
        db.query(User)
        .filter(User.email == user_data.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    verification_token = create_verification_token()

    verification_token_hash = hash_verification_token(
        verification_token
    )

    verification_expires = create_verification_expiry()

    user = User(
        email=user_data.email,
        hashed_password=hash_password(
            user_data.password
        ),
        is_email_verified=False,
        verification_token_hash=verification_token_hash,
        verification_token_expires=verification_expires,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    verification_url = (
        f"{settings.frontend_url}"
        f"/{user_data.locale}/verify-email"
        f"?token={verification_token}"
    )

    send_email(
        to_email=user.email,
        subject="Verify your CraftPilot AI account",
        html_content=f"""
        <div style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 24px;
            color: #14201c;
        ">

            <div style="
                width: 48px;
                height: 48px;
                line-height: 48px;
                text-align: center;
                border-radius: 14px;
                background: #143d32;
                color: white;
                font-weight: bold;
                font-size: 18px;
            ">
                C
            </div>

            <h1 style="
                margin-top: 24px;
                margin-bottom: 12px;
            ">
                Verify your email
            </h1>

            <p style="
                color: #697671;
                line-height: 1.7;
            ">
                Welcome to CraftPilot AI.
                Please verify your email address to activate your account.
            </p>

            <a
                href="{verification_url}"
                style="
                    display: inline-block;
                    margin-top: 20px;
                    padding: 14px 24px;
                    background: #143d32;
                    color: white;
                    text-decoration: none;
                    border-radius: 999px;
                    font-weight: 600;
                "
            >
                Verify email
            </a>

            <p style="
                margin-top: 24px;
                color: #929d99;
                font-size: 13px;
                line-height: 1.6;
            ">
                This verification link expires in 30 minutes.
            </p>

        </div>
        """,
    )

    return {
        "message": (
            "Registration successful. "
            "Please check your email to verify your account."
        )
    }


@router.get(
    "/verify-email",
    response_model=MessageResponse,
)
def verify_email(
    token: str,
    db: Session = Depends(get_db),
):
    token_hash = hash_verification_token(token)

    user = (
        db.query(User)
        .filter(
            User.verification_token_hash == token_hash
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification token",
        )

    if is_token_expired(
        user.verification_token_expires
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token has expired",
        )

    user.is_email_verified = True
    user.verification_token_hash = None
    user.verification_token_expires = None

    db.commit()

    return {
        "message": "Email verified successfully."
    }
@router.post(
    "/forgot-password",
    response_model=MessageResponse,
)
def forgot_password(
    email: str,
    locale: str = "en",
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    # Do not reveal whether the email exists.
    if not user:
        return {
            "message": (
                "If an account exists with this email, "
                "you will receive a password reset link."
            )
        }

    reset_token = create_password_reset_token()

    user.password_reset_token_hash = (
        hash_password_reset_token(reset_token)
    )

    user.password_reset_token_expires = (
        create_password_reset_expiry()
    )

    db.commit()

    reset_url = (
        f"{settings.frontend_url}"
        f"/{locale}/reset-password"
        f"?token={reset_token}"
    )

    send_email(
        to_email=user.email,
        subject="Reset your CraftPilot AI password",
        html_content=f"""
        <div style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 24px;
            color: #14201c;
        ">

            <div style="
                width: 48px;
                height: 48px;
                line-height: 48px;
                text-align: center;
                border-radius: 14px;
                background: #143d32;
                color: white;
                font-weight: bold;
                font-size: 18px;
            ">
                C
            </div>

            <h1 style="
                margin-top: 24px;
                margin-bottom: 12px;
            ">
                Reset your password
            </h1>

            <p style="
                color: #697671;
                line-height: 1.7;
            ">
                We received a request to reset your
                CraftPilot AI password.
            </p>

            <p style="
                color: #697671;
                line-height: 1.7;
            ">
                Click the button below to create a new password.
            </p>

            <a
                href="{reset_url}"
                style="
                    display: inline-block;
                    margin-top: 20px;
                    padding: 14px 24px;
                    background: #143d32;
                    color: white;
                    text-decoration: none;
                    border-radius: 999px;
                    font-weight: 600;
                "
            >
                Reset password
            </a>

            <p style="
                margin-top: 24px;
                color: #929d99;
                font-size: 13px;
                line-height: 1.6;
            ">
                This link expires in 30 minutes.
            </p>

            <p style="
                margin-top: 16px;
                color: #929d99;
                font-size: 13px;
                line-height: 1.6;
            ">
                If you did not request a password reset,
                you can safely ignore this email.
            </p>

        </div>
        """,
    )

    return {
        "message": (
            "If an account exists with this email, "
            "you will receive a password reset link."
        )
    }


@router.post(
    "/reset-password",
    response_model=MessageResponse,
)
def reset_password(
    reset_data: PasswordResetRequest,
    db: Session = Depends(get_db),
):
    token_hash = hash_password_reset_token(
        reset_data.token
    )

    user = (
        db.query(User)
        .filter(
            User.password_reset_token_hash == token_hash
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token",
        )

    if is_token_expired(
        user.password_reset_token_expires
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset token has expired",
        )

    user.hashed_password = hash_password(
        reset_data.new_password
    )

    # Reset token'ı kullanıldıktan sonra geçersizleştir
    user.password_reset_token_hash = None
    user.password_reset_token_expires = None

    db.commit()

    return {
        "message": "Password reset successfully."
    }

@router.post(
    "/resend-verification",
    response_model=MessageResponse,
)
def resend_verification(
    email: str,
    locale: str = "en",
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already verified",
        )

    verification_token = create_verification_token()

    user.verification_token_hash = (
        hash_verification_token(verification_token)
    )

    user.verification_token_expires = (
        create_verification_expiry()
    )

    db.commit()

    verification_url = (
        f"{settings.frontend_url}"
        f"/{locale}/verify-email"
        f"?token={verification_token}"
    )

    send_email(
        to_email=user.email,
        subject="Verify your CraftPilot AI account",
        html_content=f"""
        <div style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 24px;
            color: #14201c;
        ">

            <div style="
                width: 48px;
                height: 48px;
                line-height: 48px;
                text-align: center;
                border-radius: 14px;
                background: #143d32;
                color: white;
                font-weight: bold;
                font-size: 18px;
            ">
                C
            </div>

            <h1 style="margin-top: 24px;">
                Verify your email
            </h1>

            <p style="
                color: #697671;
                line-height: 1.7;
            ">
                Please verify your email address to activate
                your CraftPilot AI account.
            </p>

            <a
                href="{verification_url}"
                style="
                    display: inline-block;
                    margin-top: 20px;
                    padding: 14px 24px;
                    background: #143d32;
                    color: white;
                    text-decoration: none;
                    border-radius: 999px;
                    font-weight: 600;
                "
            >
                Verify email
            </a>

            <p style="
                margin-top: 24px;
                color: #929d99;
                font-size: 13px;
            ">
                This link expires in 30 minutes.
            </p>

        </div>
        """,
    )

    return {
        "message": "Verification email sent successfully."
    }


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    user_data: UserLogin,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.email == user_data.email)
        .first()
    )

    if not user or not verify_password(
        user_data.password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in",
        )

    access_token = create_access_token(
        {"sub": str(user.id)}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.get("/me")
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
    db: Session = Depends(get_db),
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user = (
        db.query(User)
        .filter(User.id == int(user_id))
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return {
        "id": user.id,
        "email": user.email,
        "created_at": user.created_at,
        "is_email_verified": user.is_email_verified,
    }