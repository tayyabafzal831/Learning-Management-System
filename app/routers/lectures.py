from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Lecture, Enrollment
from app.dependencies import get_current_user, require_admin


router = APIRouter(
    prefix="/lectures",
    tags=["Lectures"]
)


@router.get("/course/{course_id}")
def get_course_lectures(
    course_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # Check if the user is enrolled
    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == course_id,
        Enrollment.status.in_(["enrolled", "completed"])
    ).first()

    if not enrollment:
        raise HTTPException(
            status_code=403,
            detail="You must enroll in this course first"
        )

    lectures = db.query(Lecture).filter(
        Lecture.course_id == course_id
    ).order_by(
        Lecture.lecture_number
    ).all()

    return lectures


@router.get("/{lecture_id}")
def get_lecture(
    lecture_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    lecture = db.query(Lecture).filter(
        Lecture.id == lecture_id
    ).first()

    if not lecture:
        raise HTTPException(
            status_code=404,
            detail="Lecture not found"
        )

    # Check enrollment
    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == lecture.course_id,
        Enrollment.status.in_(["enrolled", "completed"])
    ).first()

    if not enrollment:
        raise HTTPException(
            status_code=403,
            detail="You must enroll in this course first"
        )

    return lecture


@router.post("/course/{course_id}")
def create_lecture(
    course_id: int,
    title: str,
    video_url: str,
    lecture_number: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    lecture = Lecture(
        course_id=course_id,
        title=title,
        video_url=video_url,
        lecture_number=lecture_number
    )

    db.add(lecture)
    db.commit()
    db.refresh(lecture)

    return lecture 