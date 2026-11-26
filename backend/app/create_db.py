from app.database.database import Base, engine

# Import đầy đủ các models
from app.database.models import User, PredictionHistory, FileUpload


def init_db():
    print("Creating database tables...")

    Base.metadata.create_all(bind=engine)

    print("Database initialized successfully!")


if __name__ == "__main__":
    init_db()