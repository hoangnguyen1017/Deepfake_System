# app/routers/feedback.py
import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session, joinedload

from app.database.deps import get_db
from app.database.models import User, Feedback, FeedbackAttachment, Notification, FeedbackStatus
from app.database.schemas import FeedbackResponse, NotificationResponse, UnreadCountResponse
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/user", tags=["User Feedback & Notifications"])

UPLOAD_FEEDBACK_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "feedbacks")
os.makedirs(UPLOAD_FEEDBACK_DIR, exist_ok=True)

# 1. USER GỬI FEEDBACK (Text + Hình ảnh / Video đính kèm)
@router.post("/feedback", response_model=FeedbackResponse)
async def create_feedback(
    title: str = Form(...),
    content: str = Form(...),
    files: Optional[List[UploadFile]] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_feedback = Feedback(
        user_id=current_user.user_id,
        title=title,
        content=content,
        status=FeedbackStatus.PENDING
    )
    db.add(new_feedback)
    db.commit()
    db.refresh(new_feedback)

    # Xử lý lưu các file đính kèm (nếu có)
    if files:
        for file in files:
            if not file.filename:
                continue
            
            ext = os.path.splitext(file.filename)[1].lower()
            mime = file.content_type or ""
            
            # Phân loại Image hay Video
            if mime.startswith("image/"):
                file_type = "image"
            elif mime.startswith("video/"):
                file_type = "video"
            else:
                file_type = "other"

            unique_filename = f"{uuid.uuid4().hex}{ext}"
            file_path = os.path.join(UPLOAD_FEEDBACK_DIR, unique_filename)

            contents = await file.read()
            with open(file_path, "wb") as f:
                f.write(contents)

            # Đã mount /uploads nên đường dẫn URL tương đối:
            web_path = f"/uploads/feedbacks/{unique_filename}"

            attachment = FeedbackAttachment(
                feedback_id=new_feedback.feedback_id,
                filename=file.filename,
                stored_filename=unique_filename,
                file_path=web_path,
                file_type=file_type,
                mime_type=mime
            )
            db.add(attachment)

        db.commit()
        db.refresh(new_feedback)

    return new_feedback


# 2. USER XEM DANH SÁCH FEEDBACK CỦA MÌNH
@router.get("/feedbacks", response_model=List[FeedbackResponse])
def get_user_feedbacks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Feedback)\
             .options(joinedload(Feedback.attachments))\
             .filter(Feedback.user_id == current_user.user_id)\
             .order_by(Feedback.created_at.desc()).all()


# =======================================================
# NOTIFICATION APIS (Dành cho Icon Chuông Taskbar)
# =======================================================

# 3. LẤY DANH SÁCH THÔNG BÁO CỦA USER
@router.get("/notifications", response_model=List[NotificationResponse])
def get_notifications(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Notification)\
             .filter(Notification.user_id == current_user.user_id)\
             .order_by(Notification.created_at.desc())\
             .limit(limit).all()


# 4. ĐẾM SỐ THÔNG BÁO CHƯA ĐỌC (để hiển thị badge đỏ ở Icon Chuông)
@router.get("/notifications/unread-count", response_model=UnreadCountResponse)
def get_unread_notification_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    count = db.query(Notification)\
              .filter(Notification.user_id == current_user.user_id, Notification.is_read == False)\
              .count()
    return {"unread_count": count}


# 5. ĐÁNH DẤU 1 HOẶC TẤT CẢ THÔNG BÁO LÀ ĐÃ ĐỌC
@router.patch("/notifications/{notification_id}/read")
def mark_notification_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.user_id
    ).first()
    
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notif.is_read = True
    db.commit()
    return {"success": True}


@router.patch("/notifications/read-all")
def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(Notification)\
      .filter(Notification.user_id == current_user.user_id, Notification.is_read == False)\
      .update({"is_read": True})
    db.commit()
    return {"success": True}