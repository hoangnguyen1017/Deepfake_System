from app.database.database import Base, engine
# Import đầy đủ các models để SQLAlchemy tạo đủ bảng
from app.database.models import User, PredictionHistory, FileUpload 

def init_db():
    print("Dropping old tables...")
    Base.metadata.drop_all(bind=engine) # Xóa sạch các bảng cũ nếu có
    
    print("Creating new tables...")
    Base.metadata.create_all(bind=engine) # Tạo lại bảng mới hoàn toàn
    print("Database created successfully!")

if __name__ == "__main__":
    init_db()