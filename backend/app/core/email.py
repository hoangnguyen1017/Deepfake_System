from email.message import EmailMessage
import aiosmtplib

from app.core.config import settings


async def send_reset_email(email: str, token: str):
    reset_link = (
        f"{settings.FRONTEND_URL}/reset-password?token={token}"
    )

    message = EmailMessage()
    message["From"] = settings.EMAIL_ADDRESS
    message["To"] = email
    message["Subject"] = "Reset your Deepfake System password"

    message.set_content(
        f"""
Hello,

You requested to reset your password.

Click the link below to reset it:

{reset_link}

This link will expire in {settings.RESET_TOKEN_EXPIRE_MINUTES} minutes.

If you did not request a password reset, please ignore this email.

Deepfake Detection System
"""
    )

    message.add_alternative(
        f"""
<html>
<body style="font-family:Arial,sans-serif">
    <h2>Deepfake Detection System</h2>

    <p>Hello,</p>

    <p>You requested to reset your password.</p>

    <p>
        <a href="{reset_link}"
           style="
                display:inline-block;
                padding:12px 24px;
                background:#2563eb;
                color:white;
                text-decoration:none;
                border-radius:6px;">
            Reset Password
        </a>
    </p>

    <p>
        Or copy this link:
    </p>

    <p>{reset_link}</p>

    <p>
        This link will expire in
        {settings.RESET_TOKEN_EXPIRE_MINUTES} minutes.
    </p>

    <p>If you did not request this email, please ignore it.</p>

    <br>

    <p>Deepfake Detection System</p>

</body>
</html>
""",
        subtype="html",
    )

    await aiosmtplib.send(
        message,
        hostname=settings.EMAIL_HOST,
        port=settings.EMAIL_PORT,
        username=settings.EMAIL_ADDRESS,
        password=settings.EMAIL_PASSWORD,
        start_tls=True,
    )