from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.security import hash_password
from app.database.deps import get_db
from app.database.models import User
from app.core.security import verify_password
from jose import jwt, JWTError
from app.core.config import settings

from app.core.email import send_reset_email


from app.core.jwt import (
    create_access_token,
    create_refresh_token,
    create_reset_token
)
from app.database.schemas import (
    UserCreate,
    UserLogin,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest
)
router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# =========================
# REGISTER
# =========================
@router.post("/register")
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.username == user.username
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username already exists"
        )

    existing_email = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    new_user = User(
        username=user.username,
        fullname=user.fullname,
        password=hash_password(user.password),
        age=user.age,
        email=user.email,
        gender=user.gender
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "success": True,
        "message": "Register successful",
        "user_id": new_user.user_id
    }


# =========================
# LOGIN
# =========================
@router.post("/login")
def login_user(
    user: UserLogin,
    db: Session = Depends(get_db)
):

    db_user = db.query(User).filter(
        User.username == user.username
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    if not verify_password(
        user.password,
        db_user.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Wrong password"
        )

    # KIỂM TRA TRẠNG THÁI: Chặn đăng nhập nếu tài khoản bị khóa
    if not db_user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Your account has been locked. Please contact support."
        )

    db_user.last_login = datetime.utcnow()
    db.commit()
    
    # Thêm thông tin role vào Access Token
    access_token = create_access_token(
        {
            "sub": str(db_user.user_id),
            "role": db_user.role.value, # <-- Thêm dòng này
            "type": "access"
        }
    )
    refresh_token = create_refresh_token(
        {
            "sub": str(db_user.user_id),
            "type": "refresh"
        }
    )
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }
# =========================
# REFRESH TOKEN
# =========================

@router.post("/refresh")
def refresh_access_token(
    data: RefreshTokenRequest,
    db: Session = Depends(get_db) # Thêm dependency db để truy vấn trạng thái user
):
    try:
        payload = jwt.decode(
            data.refresh_token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=401,
                detail="Invalid token type"
            )
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token payload"
            )

        # KIỂM TRA TRẠNG THÁI: Không cho phép refresh token nếu tài khoản bị khóa
        user = db.query(User).filter(User.user_id == int(user_id)).first()
        if not user:
            raise HTTPException(
                status_code=401,
                detail="User not found"
            )
        if not user.is_active:
            raise HTTPException(
                status_code=403,
                detail="Your account has been locked."
            )

        new_access_token = create_access_token(
            {
                "sub": str(user_id),
                "type": "access"
            }
        )
        return {
            "access_token": new_access_token
        }
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid refresh token"
        )
    
@router.post("/forgot-password")
async def forgot_password(
    data: ForgotPasswordRequest,
    db: Session = Depends(get_db)

):
    user = db.query(User).filter(
        User.email == data.email
    ).first()
    if not user:
        return {
            "message": "If this email exists, a reset link has been sent."
        }
    token = create_reset_token(
        {
            "sub": str(user.user_id)
        })
    await send_reset_email(
        user.email,
        token)
    return {
        "message": "Reset email sent"}


@router.post("/reset-password")
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db)

):
    try:
        payload = jwt.decode(
            data.token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )
    if payload.get("type") != "reset":
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )
    user_id = payload.get("sub")
    user = db.query(User).filter(
        User.user_id == int(user_id)
    ).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found")
    if verify_password(
        data.new_password,
        user.password):
        raise HTTPException(
            status_code=400,
            detail="New password must be different from old password")
    user.password = hash_password(
        data.new_password)
    db.commit()
    return {
        "message": "Password reset successfully"}