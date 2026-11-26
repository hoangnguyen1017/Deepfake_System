from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
import re
ph = PasswordHasher()


def hash_password(password: str) -> str:
    return ph.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:

    try:
        return ph.verify(
            hashed_password,
            plain_password
        )

    except VerifyMismatchError:
        return False
    

def validate_password_strength(
    password: str
):

    if not re.search(r"[A-Z]", password):
        raise ValueError(
            "Password must contain at least 1 uppercase letter"
        )

    if not re.search(r"[a-z]", password):
        raise ValueError(
            "Password must contain at least 1 lowercase letter"
        )

    if not re.search(r"\d", password):
        raise ValueError(
            "Password must contain at least 1 number"
        )

    return password