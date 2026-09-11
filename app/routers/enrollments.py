from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Enrollment, Course, Notification
from app.dependencies import get_current_user


router = APIRouter(
    prefix="/enrollments",
    tags=["Enrollments"]
)


@router.post("/course/{course_id}")
def enroll_in_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # Check if course exists
    course = db.query(Course).filter(
        Course.id == course_id
    ).first()

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found"
        )

    # Check if user is already enrolled
    existing_enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == course_id
    ).first()

    if existing_enrollment:
        raise HTTPException(
            status_code=400,
            detail="Already enrolled in this course"
        )

    # Create enrollment
    enrollment = Enrollment(
        user_id=current_user.id,
        course_id=course_id,
        status="enrolled"
    )

    db.add(enrollment)
    notification = Notification(
    message=f"{current_user.username} enrolled in course {course.title}",
    type="enrollment"
)

    db.add(notification)
    db.commit()
    db.refresh(enrollment)

    return enrollment


@router.get("/my-courses")
def get_my_courses(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    enrollments = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id
    ).all()

    return enrollments