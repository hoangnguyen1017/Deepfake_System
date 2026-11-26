# Deepfake Detection System
A web-based application for detecting deepfake videos using deep learning techniques. The system provides user authentication, video analysis, prediction results, and prediction history management.
## 1. Technologies

**Backend**
- Python 3.10
- FastAPI & Uvicorn
- SQLAlchemy
- PostgreSQL
- Pydantic
- PyTorch & Torchvision
- OpenCV & NumPy
- RetinaFace

**Frontend**
- Next.js
- React
- JavaScript / TypeScript
- npm

## 2. Prerequisites
Make sure the following software is installed:
- Python 3.10
- Node.js and npm
- PostgreSQL
- Git

## 3. Installation
### 3.1. Clone the Repository
```bash
git clone -b develop https://github.com/hoangnguyen1017/Deepfake_System.git
cd Deepfake_System
```

### 3.2. Backend Setup
Navigate to the backend directory:
```powershell
cd backend
```
Create a Python virtual environment:
```powershell
py -3.10 -m venv .venv
```
Activate the environment:
```powershell
.\.venv\Scripts\Activate.ps1
```
Install dependencies:
```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```
**Note:** PyTorch and Torchvision must have compatible versions. For GPU acceleration, install the appropriate CUDA-enabled PyTorch version for your system.
### 3.3. Frontend Setup
Open a new terminal from the project root and navigate to the frontend directory:
```powershell
cd frontend
```
Install dependencies:
```powershell
npm install
```

## 4. Environment Configuration
Create a `.env` file inside the `backend` directory using `.env.example` as a reference.
Example:
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/deepfake_database
```
Replace `YOUR_PASSWORD` with your PostgreSQL password.
Configure any additional environment variables required by the application.
**Important:** Never commit `.env` files, database passwords, API keys, or secret credentials to GitHub.

## 5. Database Setup
This project uses PostgreSQL with SQLAlchemy.

### 5.1. Create the Database
Install and start PostgreSQL:
https://www.postgresql.org/download/
Open pgAdmin or SQL Shell (psql) and execute:
```sql
CREATE DATABASE deepfake_database;
```

### 5.2. Initialize Database Tables
Make sure the PostgreSQL service is running and the database connection is correctly configured.
From the `backend` directory, with the virtual environment activated, run:
```powershell
python -m app.create_db
```
SQLAlchemy will automatically create the required tables based on the application's database models.
**Note:** This command initializes tables inside an existing PostgreSQL database. It does not create the database itself.

## 6. Model Weights
The trained model weights are not included in this repository due to their large file size.
Before using the video prediction feature, download or obtain the required model weights and place them in the location expected by the backend configuration.

## 7. Running the Application
Start the backend and frontend in two separate terminals.

### 7.1. Start Backend
From the `backend` directory:
```powershell
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```
Backend API:
http://127.0.0.1:8000
API documentation:
http://127.0.0.1:8000/docs

### 7.2. Start Frontend
From the `frontend` directory:
```powershell
npm run dev
```
Frontend application:
http://localhost:3000

## 8. Important Notes
- Ensure PostgreSQL is running before starting the backend.
- Initialize the database before using the application.
- Keep backend and frontend dependencies installed.

## Author

**Hoang Nguyen**
GitHub: https://github.com/hoangnguyen1017
