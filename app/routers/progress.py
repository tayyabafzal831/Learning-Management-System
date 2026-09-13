from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Lecture, Enrollment, LectureProgress, Course, Notification, User
from app.dependencies import get_current_user


router = APIRouter(
    prefix="/progress",
    tags=["Progress"]
)


@router.post("/lecture/{lecture_id}/complete")
def complete_lecture(
    lecture_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role == "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin cannot complete lectures"
        )

    # Find lecture
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

    # Find existing progress
    progress = db.query(LectureProgress).filter(
        LectureProgress.user_id == current_user.id,
        LectureProgress.lecture_id == lecture_id
    ).first()

    # Mark lecture as completed
    if progress:
        progress.completed = 1
    else:
        progress = LectureProgress(
            user_id=current_user.id,
            lecture_id=lecture_id,
            completed=1
        )

        db.add(progress)

    db.commit()
    db.refresh(progress)

    # Find the course
    course = db.query(Course).filter(
        Course.id == lecture.course_id
    ).first()

    # Count total lectures in this course
    total_lectures = db.query(Lecture).filter(
        Lecture.course_id == lecture.course_id
    ).count()

    # Count completed lectures by this user
    completed_lectures = db.query(LectureProgress).join(
        Lecture,
        LectureProgress.lecture_id == Lecture.id
    ).filter(
        LectureProgress.user_id == current_user.id,
        LectureProgress.completed == 1,
        Lecture.course_id == lecture.course_id
    ).count()

    course_completed = False

    # Check if all lectures are completed
    if (
        total_lectures > 0
        and completed_lectures == total_lectures
        and enrollment.status != "completed"
    ):
        # Mark enrollment as completed
        enrollment.status = "completed"

        # Find all admins
        admins = db.query(User).filter(
            User.role == "admin"
        ).all()

        # Create completion notification for each admin
        for admin in admins:
            notification = Notification(
                message=f"{current_user.name} completed course {course.title}",
                type="completion",
                recipient_user_id=admin.id
            )

            db.add(notification)

        course_completed = True

        db.commit()

    return {
        "message": "Lecture completed successfully",
        "progress": progress,
        "course_completed": course_completed
    }


@router.get("/course/{course_id}")
def get_course_progress(
    course_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role == "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin cannot view course progress"
        )

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

    progress = db.query(LectureProgress).join(
        Lecture,
        LectureProgress.lecture_id == Lecture.id
    ).filter(
        LectureProgress.user_id == current_user.id,
        Lecture.course_id == course_id
    ).all()

    return progress