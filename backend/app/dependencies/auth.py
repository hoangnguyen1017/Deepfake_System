from fastapi import (
    Depends,
    HTTPException
)
from app.database.models import User, UserRole
from fastapi.security import (
    OAuth2PasswordBearer
)

from jose import (
    jwt,
    JWTError
)

from sqlalchemy.orm import Session

from app.database.deps import get_db
from app.database.models import User

from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)


def get_current_user(
    token: str = Depends(
        oauth2_scheme
    ),
    db: Session = Depends(
        get_db
    )
):

    try:

        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        if payload.get("type") != "access":

            raise HTTPException(
                status_code=401,
                detail="Invalid token type"
            )

        user_id = payload.get("sub")

        if user_id is None:

            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

    except JWTError:

        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    user = db.query(User).filter(
        User.user_id == int(user_id)
    ).first()

    if not user:

        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    # KIỂM TRA TRẠNG THÁI: Chặn sử dụng API nếu tài khoản bị khóa giữa chừng
    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Your account has been locked. Please sign in again."
        )

    return user


def get_current_manager(
    current_user: User = Depends(get_current_user)
):
    # So sánh trực tiếp thông qua Enum (không lo bị lỗi so sánh chuỗi chữ thường/chữ hoa)
    if current_user.role != UserRole.MANAGER:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: You do not have permission to access this resource"
        )
    return current_user