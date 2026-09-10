from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Course
from app.dependencies import get_current_user, require_admin

router = APIRouter(
    prefix="/courses",
    tags=["Courses"]
)


@router.get("/")
def get_courses(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    courses = db.query(Course).all()

    return courses


@router.get("/{course_id}")
def get_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    course = db.query(Course).filter(
        Course.id == course_id
    ).first()

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found"
        )

    return course


@router.post("/")
def create_course(
    title: str,
    description: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    course = Course(
        title=title,
        description=description
    )

    db.add(course)
    db.commit()
    db.refresh(course)

    return course 