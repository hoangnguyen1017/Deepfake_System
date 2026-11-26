# app/database/models.py
import enum
from datetime import datetime
from sqlalchemy import JSON, Boolean, Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from .database import Base

class UserRole(str, enum.Enum):
    USER = "user"
    MANAGER = "manager"

class ProcessStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

# --- ENUMS MỚI DÙNG CHO FEEDBACK & NOTIFICATION ---
class FeedbackStatus(str, enum.Enum):
    PENDING = "pending"      # Chưa phản hồi
    REPLIED = "replied"      # Đã phản hồi
    CLOSED = "closed"        # Đã đóng/giải quyết

class NotificationType(str, enum.Enum):
    FEEDBACK_REPLY = "feedback_reply"
    SYSTEM_ALERT = "system_alert"


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False)
    fullname = Column(String(255), nullable=False)
    password = Column(String(255), nullable=False)
    age = Column(Integer, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    gender = Column(String(20), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    # Relationships cũ
    uploads = relationship("FileUpload", back_populates="user", cascade="all, delete-orphan")
    predictions = relationship("PredictionHistory", back_populates="user", cascade="all, delete-orphan")
    
    # Relationships MỚI (Bổ sung foreign_keys="[Feedback.user_id]" ở đây)
    feedbacks = relationship(
        "Feedback", 
        back_populates="user", 
        foreign_keys="[Feedback.user_id]", 
        cascade="all, delete-orphan"
    )
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

# Thêm các class này vào app/database/models.py

class FileUpload(Base):
    __tablename__ = "file_uploads"

    file_id = Column(Integer, primary_key=True, index=True) # Đổi id -> file_id cho đồng bộ
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False) # Bổ sung
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)          # Bổ sung
    mime_type = Column(String(100), nullable=True)        # Bổ sung
    status = Column(Enum(ProcessStatus), default=ProcessStatus.PENDING, nullable=False) # Bổ sung
    error_message = Column(Text, nullable=True)          # Bổ sung
    file_metadata = Column(JSON, nullable=True)           # Bổ sung
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="uploads")
    predictions = relationship("PredictionHistory", back_populates="upload", cascade="all, delete-orphan")

class PredictionHistory(Base):
    __tablename__ = "prediction_histories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    file_id = Column(Integer, ForeignKey("file_uploads.file_id"), nullable=True)
    video_name = Column(String(255), nullable=True)
    label = Column(String(50), nullable=False) 
    confidence = Column(Float, nullable=False)
    
    # --- CÁC CỘT ĐÃ ĐƯỢC BỔ SUNG ĐỂ TƯƠNG THÍCH HOÀN TOÀN ---
    fake_percent = Column(Float, nullable=True)
    real_percent = Column(Float, nullable=True)
    model_version = Column(String(100), nullable=True)
    processing_time_ms = Column(Float, nullable=True)
    
    # Đổi tên/tạo alias hỗ trợ trường frame_analysis_details từ inference.py
    frame_analysis_details = Column(JSON, nullable=True)
    details = Column(JSON, nullable=True) 
    
    status = Column(Enum(ProcessStatus), default=ProcessStatus.COMPLETED, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="predictions")
    upload = relationship("FileUpload", back_populates="predictions")
    
# =======================================================
# BẢNG MỚI: FEEDBACK (Ý kiến/Báo lỗi của User)
# =======================================================
class Feedback(Base):
    __tablename__ = "feedbacks"

    feedback_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    status = Column(Enum(FeedbackStatus), default=FeedbackStatus.PENDING, nullable=False)
    
    # Trả lời từ Manager
    reply_content = Column(Text, nullable=True)
    replied_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    replied_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships (Chỉ rõ foreign_keys cho từng mối quan hệ)
    user = relationship("User", foreign_keys=[user_id], back_populates="feedbacks")
    manager = relationship("User", foreign_keys=[replied_by])
    attachments = relationship("FeedbackAttachment", back_populates="feedback", cascade="all, delete-orphan")

# =======================================================
# BẢNG MỚI: FEEDBACK ATTACHMENT (File đính kèm: Ảnh/Video)
# =======================================================
class FeedbackAttachment(Base):
    __tablename__ = "feedback_attachments"

    attachment_id = Column(Integer, primary_key=True, index=True)
    feedback_id = Column(Integer, ForeignKey("feedbacks.feedback_id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=False) # "image" hoặc "video"
    mime_type = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    feedback = relationship("Feedback", back_populates="attachments")


# =======================================================
# BẢNG MỚI: NOTIFICATION (Thông báo cho biểu tượng chuông Taskbar)
# =======================================================
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(Enum(NotificationType), default=NotificationType.FEEDBACK_REPLY, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    reference_id = Column(Integer, nullable=True) # ID của feedback liên quan (nếu có)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")