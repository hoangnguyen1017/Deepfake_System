from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.database.deps import get_db

from app.database.models import (
    User,
    PredictionHistory
)

from app.database.schemas import (
    UserUpdate,
    ChangePassword
)

from app.core.security import (
    verify_password,
    hash_password
)

from app.dependencies.auth import (
    get_current_user
)

router = APIRouter(
    prefix="/profile",
    tags=["Profile"]
)


# =====================================
# GET USER INFO
# =====================================

@router.get("/me")
def get_profile(
    current_user: User = Depends(get_current_user)
):
    return {
        "user_id": current_user.user_id,
        "username": current_user.username,
        "fullname": current_user.fullname,
        "email": current_user.email,
        "age": current_user.age,
        "gender": current_user.gender,
        "created_at": current_user.created_at,
        "last_login": current_user.last_login
    }
# =====================================
# UPDATE PROFILE
# =====================================

@router.put("/me")
def update_profile(
    data: UserUpdate,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db)
):

    current_user.fullname = data.fullname
    current_user.email = data.email
    current_user.age = data.age
    current_user.gender = data.gender

    db.commit()
    db.refresh(current_user)

    return {
        "success": True,
        "message": "Profile updated"
    }


# =====================================
# CHANGE PASSWORD
# =====================================

@router.put("/change-password")
def change_password(
    data: ChangePassword,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db)
):

    if not verify_password(
        data.old_password,
        current_user.password
    ):
        raise HTTPException(
            status_code=400,
            detail="Old password incorrect"
        )

    current_user.password = hash_password(
        data.new_password
    )

    db.commit()

    return {
        "success": True,
        "message": "Password changed"
    }


# =====================================
# GET HISTORY
# =====================================

@router.get("/history")
def get_history(
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db)
):

    history = db.query(
        PredictionHistory
    ).filter(
        PredictionHistory.user_id
        == current_user.user_id
    ).order_by(
        PredictionHistory.created_at.desc()
    ).all()

    return history


# =====================================
# DELETE ONE HISTORY
# =====================================

@router.delete("/history/{history_id}")
def delete_history(
    history_id: int,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db)
):

    history = db.query(
        PredictionHistory
    ).filter(
        PredictionHistory.id == history_id,
        PredictionHistory.user_id
        == current_user.user_id
    ).first()

    if not history:
        raise HTTPException(
            status_code=404,
            detail="History not found"
        )

    db.delete(history)
    db.commit()

    return {
        "success": True
    }


# =====================================
# DELETE ALL HISTORY
# =====================================

@router.delete("/history")
def delete_all_history(
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db)
):

    db.query(
        PredictionHistory
    ).filter(
        PredictionHistory.user_id
        == current_user.user_id
    ).delete()

    db.commit()

    return {
        "success": True,
        "message": "All history deleted"
    }