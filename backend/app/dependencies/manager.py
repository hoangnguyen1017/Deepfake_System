from fastapi import Depends, HTTPException
from app.dependencies.auth import get_current_user


def get_current_manager(user = Depends(get_current_user)):

    if user.role != "manager":
        raise HTTPException(
            status_code=403,
            detail="Manager only"
        )

    return user