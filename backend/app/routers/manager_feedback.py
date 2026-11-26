# app/routers/manager_feedback.py
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database.deps import get_db
from app.database.models import User, Feedback, Notification, FeedbackStatus, NotificationType
from app.database.schemas import FeedbackResponse, FeedbackReplyRequest
from app.dependencies.manager import get_current_manager

router = APIRouter(prefix="/manager/feedbacks", tags=["Manager Feedback Control"])

# 1. MANAGER LẤY TOÀN BỘ FEEDBACK
@router.get("", response_model=List[FeedbackResponse])
def manager_get_all_feedbacks(
    status_filter: str = None,
    current_manager: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    query = db.query(Feedback).options(
        joinedload(Feedback.attachments),
        joinedload(Feedback.user)
    )
    
    if status_filter:
        query = query.filter(Feedback.status == status_filter)
        
    return query.order_by(Feedback.created_at.desc()).all()


# 2. MANAGER TRẢ LỜI FEEDBACK
@router.post("/{feedback_id}/reply", response_model=FeedbackResponse)
def manager_reply_feedback(
    feedback_id: int,
    payload: FeedbackReplyRequest,
    current_manager: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    # Thêm joinedload ở đây để khi return feedback có luôn object user
    feedback = db.query(Feedback).options(
        joinedload(Feedback.attachments),
        joinedload(Feedback.user)
    ).filter(Feedback.feedback_id == feedback_id).first()

    if not feedback:
        raise HTTPException(status_code=404, detail="Không tìm thấy Feedback này.")

    # Cập nhật thông tin trả lời
    feedback.reply_content = payload.reply_content
    feedback.replied_by = current_manager.user_id
    feedback.replied_at = datetime.utcnow()
    feedback.status = FeedbackStatus.REPLIED

    # TỰ ĐỘNG TẠO NOTIFICATION CHO USER
    notification = Notification(
        user_id=feedback.user_id,
        title="Phản hồi từ Quản trị viên",
        message=f"Manager đã trả lời góp ý '{feedback.title}': \"{payload.reply_content}\"",
        type=NotificationType.FEEDBACK_REPLY,
        reference_id=feedback.feedback_id,
        is_read=False
    )
    db.add(notification)

    db.commit()
    db.refresh(feedback)
    return feedback