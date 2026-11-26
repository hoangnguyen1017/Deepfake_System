import os
import uuid
import aiofiles
from typing import List
from app.dependencies.auth import get_current_user
from app.database.models import User, FileUpload, PredictionHistory, ProcessStatus
from app.database.schemas import (
    PredictionResponse, 
    PredictionDetailResponse, 
    FileUploadResponse
)
from fastapi import (
    APIRouter,
    UploadFile,
    File,
    HTTPException,
    Depends,
    Query,
    status
)
from sqlalchemy.orm import Session
from app.database.deps import get_db
from app.model.inference import detector

router = APIRouter(prefix="/predict", tags=["Predict & History"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_FILE_SIZE = 100 * 1024 * 1024 


@router.post("")
async def predict(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if file.content_type is None or not file.content_type.startswith("video/"):
        raise HTTPException(
            status_code=400,
            detail="File tải lên không phải là định dạng Video hợp lệ."
        )

    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    file.file.seek(0)

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Dung lượng file vượt quá giới hạn cho phép ({MAX_FILE_SIZE // (1024*1024)}MB)."
        )

    ext = os.path.splitext(file.filename)[1] or ".mp4"
    stored_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, stored_filename)

    file_upload = FileUpload(
        user_id=current_user.user_id,
        filename=file.filename,
        stored_filename=stored_filename,
        file_path=file_path,
        file_size=file_size,
        mime_type=file.content_type,
        status=ProcessStatus.PENDING
    )
    db.add(file_upload)
    db.commit()
    db.refresh(file_upload)

    try:
        file_upload.status = ProcessStatus.PROCESSING
        db.commit()

        async with aiofiles.open(file_path, 'wb') as out_file:
            while content := await file.read(1024 * 1024):
                await out_file.write(content)

        print("STEP 1: ASYNC FILE SAVED SUCCESSFULLY")
        
        result = detector.predict_video(
            video_path=file_path,
            db=db,
            user_id=current_user.user_id,
            file_id=file_upload.file_id,
            video_name=file.filename
        )
        print("STEP 2: PREDICTION COMPLETED")
        return result

    except Exception as e:
        db.rollback()
        
        try:
            file_record = db.query(FileUpload).filter(FileUpload.file_id == file_upload.file_id).first()
            if file_record:
                file_record.status = ProcessStatus.FAILED
                file_record.error_message = str(e)
                db.commit()
        except Exception:
            db.rollback()
        
        if os.path.exists(file_path):
            os.remove(file_path)

        raise HTTPException(
            status_code=500,
            detail=f"Lỗi trong quá trình xử lý video: {str(e)}"
        )


# =======================================================
# CÁC API TRUY VẤN LỊCH SỬ & FILE UPLOAD
# =======================================================

@router.get("/history", response_model=List[PredictionResponse])
def get_prediction_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return (
        db.query(PredictionHistory)
        .filter(PredictionHistory.user_id == current_user.user_id)
        .order_by(PredictionHistory.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/history/{prediction_id}", response_model=PredictionDetailResponse)
def get_prediction_detail(
    prediction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = (
        db.query(PredictionHistory)
        .filter(
            PredictionHistory.id == prediction_id,
            PredictionHistory.user_id == current_user.user_id
        )
        .first()
    )
    
    if not record:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch sử dự đoán này.")
        
    result = PredictionDetailResponse.model_validate(record)
    if record.file_upload:
        result.file_info = FileUploadResponse.model_validate(record.file_upload)
        
    return result


@router.get("/files", response_model=List[FileUploadResponse])
def get_uploaded_files(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return (
        db.query(FileUpload)
        .filter(FileUpload.user_id == current_user.user_id)
        .order_by(FileUpload.uploaded_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.delete("/history/{prediction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prediction_history(
    prediction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Xóa 1 lịch sử dự đoán trong DB.
    SQLAlchemy sẽ tự động xóa dòng tương ứng trong bảng file_uploads nhờ cấu hình cascade.
    """
    record = (
        db.query(PredictionHistory)
        .filter(
            PredictionHistory.id == prediction_id,
            PredictionHistory.user_id == current_user.user_id
        )
        .first()
    )
    
    if not record:
        raise HTTPException(status_code=404, detail="Không tìm thấy bản ghi cần xóa.")

    # Chỉ cần gọi xóa PredictionHistory, SQLAlchemy ORM sẽ tự động gửi lệnh DELETE sang bảng file_uploads
    db.delete(record)
    db.commit()
    return None