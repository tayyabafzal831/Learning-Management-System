from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.routers.students import router as student_router
from app.routers.auth import router as auth_router
from app.routers import courses
from app.routers import lectures
from app.routers import enrollments
from app.routers import progress
from app.routers import notifications

app = FastAPI(
    title="Student Management System",
    description="API for managing students",
    version="1.0.0"
)

app.mount("/frontend", StaticFiles(directory="frontend", html=True), name="frontend")


app.include_router(student_router)
app.include_router(auth_router)
app.include_router(courses.router)
app.include_router(lectures.router)
app.include_router(enrollments.router)
app.include_router(progress.router)
app.include_router(notifications.router)

@app.get("/")
def home():
    return {"message": "Student Management System"}