# main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routers.predict import router as predict_router
from app.routers.auth import router as auth_router
from app.routers.profile import router as profile_router
from app.routers.manager import router as manager_router
from app.routers.feedback import router as user_feedback_router       # MỚI
from app.routers.manager_feedback import router as manager_feedback_router # MỚI

app = FastAPI(
    title="Deepfake Detection API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

BASE_DIR = os.path.dirname(__file__)
UPLOAD_DIR = os.path.join(os.path.dirname(BASE_DIR), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(predict_router)
app.include_router(manager_router)
app.include_router(user_feedback_router)       # MỚI
app.include_router(manager_feedback_router)    # MỚI

@app.get("/")
def home():
    return {
        "message": "Deepfake Detection API"
    }