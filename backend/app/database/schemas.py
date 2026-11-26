import re
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator
from app.database.models import FeedbackStatus, NotificationType

from app.core.security import validate_password_strength
from app.database.models import ProcessStatus, UserRole

class RefreshTokenRequest(BaseModel):
    refresh_token: str

# =========================
# REGISTER SCHEMA
# =========================
class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=20)
    fullname: str = Field(min_length=2, max_length=50)
    password: str = Field(min_length=8)
    age: int = Field(ge=13, le=120)
    email: EmailStr
    gender: Optional[str] = None

    @field_validator("username")
    @classmethod
    def validate_username(cls, v):
        if not re.match(r"^[a-zA-Z0-9_]{3,20}$", v):
            raise ValueError("Username must be 3-20 chars, no special symbols")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        return validate_password_strength(v)

    @field_validator("fullname")
    @classmethod
    def validate_fullname(cls, v):
        if not re.match(r"^[a-zA-ZÀ-ỹ\s]{2,50}$", v):
            raise ValueError("Fullname must contain only letters and spaces")
        return v

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, v):
        if v is None:
            return v
        if v not in ["male", "female", "other"]:
            raise ValueError("Gender must be male, female, or other")
        return v

class UserLogin(BaseModel):
    username: str
    password: str

class UserMiniInfo(BaseModel):
    username: str
    fullname: str
    email: str

    class Config:
        from_attributes = True

class UserProfileResponse(BaseModel):
    user_id: int
    username: str
    fullname: str
    age: int
    email: str
    gender: Optional[str]
    role: UserRole
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    fullname: str = Field(min_length=2, max_length=50)
    age: int = Field(ge=13, le=120)
    email: EmailStr
    gender: Optional[str] = None

class ManagerUserResponse(BaseModel):
    user_id: int
    username: str
    fullname: str
    email: str
    age: int
    gender: Optional[str]
    role: UserRole
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime]

    class Config:
        from_attributes = True

class ChangePassword(BaseModel):
    old_password: str
    new_password: str = Field(min_length=8)

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v):
        return validate_password_strength(v)

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v):
        return validate_password_strength(v)

# =======================================================
# SCHEMAS DÀNH CHO FILE UPLOAD (Ý TƯỞNG 1)
# =======================================================
class FileUploadBase(BaseModel):
    filename: str
    file_size: int
    mime_type: Optional[str] = None

class FileUploadResponse(FileUploadBase):
    file_id: int
    user_id: int
    stored_filename: str
    file_path: str
    status: ProcessStatus
    error_message: Optional[str] = None
    file_metadata: Optional[Dict[str, Any]] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True

# =======================================================
# SCHEMAS DÀNH CHO LỊCH SỬ DỰ ĐOÁN MỞ RỘNG (Ý TƯỞNG 2)
# =======================================================
class PredictionResponse(BaseModel):
    id: int
    user_id: int
    file_id: Optional[int] = None
    video_name: str
    label: str
    confidence: float
    fake_percent: float
    real_percent: float
    model_version: str
    processing_time_ms: float
    created_at: datetime

    class Config:
        from_attributes = True
        
from pydantic import BaseModel, Field
class PredictionDetailResponse(PredictionResponse):
    frame_analysis_details: Optional[Dict[str, Any]] = None
    upload: Optional[FileUploadResponse] = None
    file_upload: Optional[FileUploadResponse] = Field(None, validation_alias="upload")
    user: Optional[UserMiniInfo] = None

    class Config:
        from_attributes = True

# =======================================================
# SCHEMAS DÀNH CHO MANAGER CONTROL PANEL
# =======================================================
class ManagerStatsResponse(BaseModel):
    total_users: int
    active_users: int
    total_scans: int
    fake_detected_ratio: float

class ManagerUserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=20)
    fullname: str = Field(min_length=2, max_length=50)
    email: EmailStr
    age: int = Field(ge=13, le=120)
    password: str = Field(min_length=8)
    gender: Optional[str] = None
    role: UserRole = UserRole.USER

    @field_validator("username")
    @classmethod
    def validate_username(cls, v):
        if not re.match(r"^[a-zA-Z0-9_]{3,20}$", v):
            raise ValueError("Username must be 3-20 chars, no special symbols")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        return validate_password_strength(v)

    @field_validator("fullname")
    @classmethod
    def validate_fullname(cls, v):
        if not re.match(r"^[a-zA-ZÀ-ỹ\s]{2,50}$", v):
            raise ValueError("Fullname must contain only letters and spaces")
        return v

class ManagerUserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=20)
    fullname: Optional[str] = Field(None, min_length=2, max_length=50)
    email: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if v is None or v == "":
            return None
        return validate_password_strength(v)

class UserStatusUpdate(BaseModel):
    is_active: bool



# Thêm vào cuối file app/database/schemas.py


# =======================================================
# SCHEMAS FEEDBACK ATTACHMENT
# =======================================================
class FeedbackAttachmentResponse(BaseModel):
    attachment_id: int
    filename: str
    file_path: str
    file_type: str
    mime_type: Optional[str] = None

    class Config:
        from_attributes = True

# =======================================================
# SCHEMAS FEEDBACK
# =======================================================
class FeedbackCreate(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    content: str = Field(min_length=5)

class FeedbackReplyRequest(BaseModel):
    reply_content: str = Field(min_length=1)

class FeedbackResponse(BaseModel):
    feedback_id: int
    user_id: int
    title: str
    content: str
    status: FeedbackStatus
    reply_content: Optional[str] = None
    replied_by: Optional[int] = None
    replied_at: Optional[datetime] = None
    created_at: datetime
    attachments: List[FeedbackAttachmentResponse] = []
    user: Optional[UserMiniInfo] = None

    class Config:
        from_attributes = True

# =======================================================
# SCHEMAS NOTIFICATION (CHO BIỂU TƯỢNG CHUÔNG)
# =======================================================
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: NotificationType
    is_read: bool
    reference_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UnreadCountResponse(BaseModel):
    unread_count: int




# --- ANALYTICS SCHEMAS ---
class HourlyDistribution(BaseModel):
    day_of_week: int # 0: Thứ 2, ..., 6: Chủ Nhật
    day_name: str    # "T2", "T3", ..., "CN"
    hour: int        # 0 -> 23
    scan_count: int

class PredictionDistribution(BaseModel):
    total_scans: int
    real_count: int
    fake_count: int
    real_percentage: float
    fake_percentage: float

class ConfidenceDistribution(BaseModel):
    low_confidence_count: int      # < 60% (Cần Retrain)
    moderate_confidence_count: int # 60% - 80%
    high_confidence_count: int     # > 80%
    low_confidence_percentage: float

class DetailedAnalyticsResponse(BaseModel):
    prediction_dist: PredictionDistribution
    confidence_dist: ConfidenceDistribution
    hourly_peak_matrix: List[HourlyDistribution]