# D:\Deepfake-System\backend\app\routers\manager.py
import io
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy import func, extract,or_
from sqlalchemy.orm import Session, joinedload
from app.database.deps import get_db
from app.database.models import User, PredictionHistory, UserRole
from app.database.schemas import (
    ManagerUserResponse, 
    PredictionResponse, 
    ManagerStatsResponse,
    ManagerUserCreate,
    ManagerUserUpdate,
    UserStatusUpdate,
    PredictionDetailResponse,
    # Cần đảm bảo các Schema Analytics dưới đây đã được định nghĩa trong app/database/schemas.py
    DetailedAnalyticsResponse,
    PredictionDistribution,
    ConfidenceDistribution,
    HourlyDistribution
)
from app.dependencies.manager import get_current_manager 
from app.core.security import hash_password 

router = APIRouter(
    prefix="/manager",
    tags=["Manager Control Panel"]
)

# =======================================================
# 1. LẤY DANH SÁCH TẤT CẢ NGƯỜI DÙNG (Hiển thị cho bảng quản trị)
# =======================================================
@router.get("/users", response_model=List[ManagerUserResponse])
def manager_get_all_users(
    current_manager: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    # Trả về tất cả các tài khoản để manager quản trị (bao gồm cả các tài khoản manager khác)
    # Nếu chỉ muốn lấy người dùng thường, bạn có thể lọc: .filter(User.role == UserRole.USER)
    users = db.query(User).order_by(User.user_id.desc()).all()
    return users


# =======================================================
# 2. LẤY THỐNG KÊ TỔNG QUAN HỆ THỐNG (DASHBOARD STATS)
# =======================================================
@router.get("/stats", response_model=ManagerStatsResponse)
def get_manager_stats(
    current_manager: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    # Tính toán các chỉ số
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    total_scans = db.query(PredictionHistory).count()
    
    # Tính tỷ lệ deepfake phát hiện được
    fake_detected_ratio = 0.0
    if total_scans > 0:
        # Giả định nhãn lưu chữ phát hiện deepfake là "Fake" (không phân biệt hoa thường)
        fake_scans = db.query(PredictionHistory).filter(
            PredictionHistory.label.ilike("fake")
        ).count()
        fake_detected_ratio = (fake_scans / total_scans) * 100.0

    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_scans": total_scans,
        "fake_detected_ratio": round(fake_detected_ratio, 1)
    }


# =======================================================
# 3. TẠO TÀI KHOẢN MỚI THỦ CÔNG
# =======================================================
@router.post("/users", response_model=ManagerUserResponse)
def manager_create_user(
    payload: ManagerUserCreate,
    current_manager: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    # Kiểm tra trùng lặp
    existing_user = db.query(User).filter(
        (User.username == payload.username) | (User.email == payload.email)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=400, 
            detail="Tên tài khoản (Username) hoặc Email này đã tồn tại trên hệ thống."
        )

    # Đăng ký tài khoản mới với mật khẩu đã hash
    new_user = User(
        username=payload.username,
        fullname=payload.fullname,
        email=payload.email,
        age=payload.age,
        password=hash_password(payload.password),
        gender=payload.gender,
        role=payload.role,
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


# =======================================================
# 4. CHỈNH SỬA CHI TIẾT TÀI KHOẢN (VÀ RESET MẬT KHẨU)
# =======================================================
@router.put("/users/{user_id}", response_model=ManagerUserResponse)
def manager_update_user(
    user_id: int,
    payload: ManagerUserUpdate,
    current_manager: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng này.")

    # 1. Chuyển payload thành dict, loại bỏ các trường không được gửi từ client
    update_data = payload.dict(exclude_unset=True)

    # 2. Xử lý riêng mật khẩu (nếu có trong payload)
    if "password" in update_data and update_data["password"]:
        user.password = hash_password(update_data["password"])
        del update_data["password"] # Xóa để không ghi đè password đã hash bằng string gốc

    # 3. Cập nhật các trường còn lại một cách tự động
    for key, value in update_data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return user


# =======================================================
# 5. KHÓA / MỞ KHÓA TÀI KHOẢN (Cập nhật cột is_active)
# =======================================================
@router.patch("/users/{user_id}/status", response_model=ManagerUserResponse)
def manager_toggle_user_status(
    user_id: int,
    payload: UserStatusUpdate,
    current_manager: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    if user_id == current_manager.user_id:
        raise HTTPException(status_code=400, detail="Bạn không thể tự khóa tài khoản chính mình.")

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng này.")

    user.is_active = payload.is_active
    db.commit()
    db.refresh(user)
    return user


# =======================================================
# 6. XEM LỊCH SỬ DỰ ĐOÁN CỦA MỘT USER CỤ THỂ
# =======================================================
@router.get("/users/{user_id}/history", response_model=List[PredictionDetailResponse])
def manager_get_user_history(
    user_id: int,
    current_manager: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng này trên hệ thống.")
       
    history = db.query(PredictionHistory)\
        .options(
            joinedload(PredictionHistory.upload), # Nạp thông tin FileUpload
            joinedload(PredictionHistory.user)        # Nạp thông tin User
        )\
        .filter(PredictionHistory.user_id == user_id)\
        .order_by(PredictionHistory.created_at.desc())\
        .all()
   
    return history

# =======================================================
# 7. XÓA MỘT USER KHỎI HỆ THỐNG
# =======================================================
@router.delete("/users/{user_id}")
def manager_delete_user(
    user_id: int,
    current_manager: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    if user_id == current_manager.user_id:
        raise HTTPException(status_code=400, detail="Bạn không thể tự xóa tài khoản của chính mình.")

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Target user not found")
        
    db.query(PredictionHistory).filter(PredictionHistory.user_id == user_id).delete()
    db.delete(user)
    db.commit()
    
    return {
        "success": True,
        "message": f"User {user.username} and their data have been deleted successfully."
    }


# =======================================================
# 8. EXPORT USERS (Hỗ trợ định dạng .csv và .xlsx)
# =======================================================
@router.get("/users/export")
def export_users(
    format: str = Query("csv", description="Định dạng file xuất ra: 'csv' hoặc 'xlsx'"),
    db: Session = Depends(get_db),
    current_manager: User = Depends(get_current_manager)
):
    users = db.query(User).all()
    
    data = []
    for u in users:
        data.append({
            "username": u.username,
            "fullname": u.fullname,
            "email": u.email,
            "age": u.age,
            "gender": u.gender or "",
            "role": u.role.value if hasattr(u.role, 'value') else str(u.role),
            "is_active": u.is_active
        })
    
    df = pd.DataFrame(data)
    
    if format == "xlsx":
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name="Users")
        output.seek(0)
        headers = {
            'Content-Disposition': 'attachment; filename="users_export.xlsx"'
        }
        return StreamingResponse(
            output, 
            headers=headers, 
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    else:
        stream = io.StringIO()
        df.to_csv(stream, index=False, encoding="utf-8-sig")
        response = StreamingResponse(
            iter([stream.getvalue()]), 
            media_type="text/csv"
        )
        response.headers["Content-Disposition"] = "attachment; filename=users_export.csv"
        return response


# =======================================================
# 9. IMPORT USERS
# =======================================================
@router.post("/users/import")
async def import_users(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_manager: User = Depends(get_current_manager)
):
    filename = file.filename.lower()
    contents = await file.read()
    
    try:
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Định dạng file không hỗ trợ. Vui lòng chỉ tải lên file .csv hoặc .xlsx")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Lỗi đọc file: {str(e)}")

    required_cols = ["username", "fullname", "email", "age"]
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        raise HTTPException(
            status_code=400, 
            detail=f"File import thiếu các cột bắt buộc: {', '.join(missing_cols)}"
        )

    imported_count = 0
    errors = []
    
    default_hashed_password = hash_password("Abc123456")

    for index, row in df.iterrows():
        username = str(row["username"]).strip()
        fullname = str(row["fullname"]).strip()
        email = str(row["email"]).strip()
        
        try:
            age = int(row["age"])
        except:
            errors.append(f"Dòng {index + 2}: Tuổi không hợp lệ")
            continue

        gender = str(row["gender"]).strip() if "gender" in df.columns and pd.notna(row["gender"]) else None
        role_str = str(row["role"]).strip().lower() if "role" in df.columns and pd.notna(row["role"]) else "user"
        role = UserRole.MANAGER if role_str == "manager" else UserRole.USER

        existing_user = db.query(User).filter((User.username == username) | (User.email == email)).first()
        if existing_user:
            errors.append(f"Dòng {index + 2}: Username '{username}' hoặc Email '{email}' đã tồn tại.")
            continue

        new_user = User(
            username=username,
            fullname=fullname,
            password=default_hashed_password,
            age=age,
            email=email,
            gender=gender,
            role=role,
            is_active=True
        )
        db.add(new_user)
        imported_count += 1

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi lưu trữ cơ sở dữ liệu: {str(e)}")

    return {
        "success": True,
        "imported_count": imported_count,
        "errors": errors,
        "message": f"Nạp thành công {imported_count} người dùng mới."
    }


# =======================================================
# 10. LẤY TOÀN BỘ LỊCH SỬ HỆ THỐNG
# =======================================================
@router.get("/history", response_model=List[PredictionDetailResponse])
def get_all_history(
    limit: int = Query(100, description="Giới hạn số lượng bản ghi hiển thị"),
    skip: int = Query(0, description="Bỏ qua số lượng bản ghi"),
    label: str = Query(None, description="Lọc theo nhãn 'Fake' hoặc 'Real'"),
    db: Session = Depends(get_db),
    current_manager: User = Depends(get_current_manager)
):
    """
    Trả về toàn bộ lịch sử quét của hệ thống kèm thông tin của từng người dùng.
    Hỗ trợ phân trang và lọc để tối ưu hóa hiệu năng render biểu đồ ở Frontend.
    """
    query = db.query(PredictionHistory)
    
    # Bộ lọc theo nhãn nếu có
    if label:
        query = query.filter(PredictionHistory.label.ilike(label))
        
    # Sắp xếp lịch sử mới nhất lên đầu
    all_history = query.order_by(PredictionHistory.created_at.desc())\
                       .offset(skip)\
                       .limit(limit)\
                       .all()
    return all_history



# =======================================================
# 3. THỐNG KÊ NÂNG CAO & ANALYTICS (REAL/FAKE, CONFIDENCE & PEAK HOURS)
# =======================================================
@router.get("/analytics/advanced", response_model=DetailedAnalyticsResponse)
def get_advanced_analytics(
    current_manager: User = Depends(get_current_manager),
    db: Session = Depends(get_db)
):
    """
    Thống kê Cục bộ toàn bộ dữ liệu quét trong Hệ thống:
    - Phân bổ kết quả nhận diện (Real vs Fake)
    - Phân bổ mức độ tin cậy của mô hình AI
    - Khung giờ và các ngày trong tuần có lượt quét cao nhất
    """
    total_scans = db.query(PredictionHistory).count()

    # --- 1. Phân bổ Real vs Fake toàn hệ thống ---
    fake_count = db.query(PredictionHistory).filter(
        or_(
            PredictionHistory.label.ilike("%fake%"),
            PredictionHistory.label == "1"
        )
    ).count()
    
    # Số lượng Real = Tổng số - Fake (đảm bảo tổng luôn bằng 100%)
    real_count = max(0, total_scans - fake_count)

    fake_pct = round((fake_count / total_scans * 100.0), 2) if total_scans > 0 else 0.0
    real_pct = round((real_count / total_scans * 100.0), 2) if total_scans > 0 else 0.0

    prediction_dist = PredictionDistribution(
        total_scans=total_scans,
        real_count=real_count,
        fake_count=fake_count,
        real_percentage=real_pct,
        fake_percentage=fake_pct
    )

    # --- 2. Phân bổ Độ tin cậy (Confidence Score) ---
    # Quy chuẩn: Nếu confidence lưu dạng 0.0-1.0 thì nhân 100, nếu lưu 0.0-100.0% thì giữ nguyên
    all_predictions = db.query(PredictionHistory.confidence).all()
    
    low_conf = 0
    mod_conf = 0
    high_conf = 0

    for item in all_predictions:
        conf = item.confidence or 0.0
        # Tự động quy đổi về thang 100%
        score = conf * 100.0 if conf <= 1.0 else conf

        if score < 60.0:
            low_conf += 1
        elif 60.0 <= score < 80.0:
            mod_conf += 1
        else:
            high_conf += 1

    low_pct = round((low_conf / total_scans * 100.0), 2) if total_scans > 0 else 0.0

    confidence_dist = ConfidenceDistribution(
        low_confidence_count=low_conf,
        moderate_confidence_count=mod_conf,
        high_confidence_count=high_conf,
        low_confidence_percentage=low_pct
    )

    # --- 3. Thống kê Lượt quét Cục bộ theo Ngày trong tuần ---
    day_names = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]
    
    # Lấy toàn bộ thời gian quét
    history_dates = db.query(PredictionHistory.created_at).all()
    
    # Khởi tạo ma trận đếm theo (thứ, giờ)
    count_map = {}
    for record in history_dates:
        if record.created_at:
            dt = record.created_at
            # dt.weekday(): Monday is 0 and Sunday is 6 (Chuẩn ISO)
            weekday = dt.weekday() 
            hour = dt.hour
            count_map[(weekday, hour)] = count_map.get((weekday, hour), 0) + 1

    # Tạo danh sách HourlyDistribution
    hourly_matrix = []
    for day_idx in range(7):
        for hour_idx in range(24):
            sc_count = count_map.get((day_idx, hour_idx), 0)
            hourly_matrix.append(HourlyDistribution(
                day_of_week=day_idx,
                day_name=day_names[day_idx],
                hour=hour_idx,
                scan_count=sc_count
            ))

    return DetailedAnalyticsResponse(
        prediction_dist=prediction_dist,
        confidence_dist=confidence_dist,
        hourly_peak_matrix=hourly_matrix
    )