from fastapi import (
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.database.deps import get_db

from app.dependencies.auth import get_current_user

from app.database.models import (
    User,
    RolePermission
)

def get_user_permissions(
    user: User
) -> set[str]:

    if user.role is None:
        return set()

    permissions = set()

    for role_permission in user.role.role_permissions:

        if role_permission.permission is None:
            continue

        permissions.add(
            role_permission.permission.permission_code
        )

    return permissions
def require_permission(
    permission: str
):

    def permission_checker(

        current_user: User = Depends(
            get_current_user
        )

    ):

        user_permissions = get_user_permissions(
            current_user
        )

        if permission not in user_permissions:

            raise HTTPException(
                status_code=403,
                detail=f"Missing permission: {permission}"
            )

        return current_user

    return permission_checker