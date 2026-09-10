from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from database import get_db
from models import Student, User
from schemas import StudentCreate, StudentUpdate, StudentResponse
from app.dependencies import get_current_user, require_admin


router = APIRouter(
    prefix="/students",
    tags=["Students"]
)



@router.post("/", response_model=StudentResponse)
def create_student(
    student: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    new_student = Student(
        name=student.name,
        email=student.email,
        age=student.age,
        course=student.course
    )

    db.add(new_student)

    try:
        db.commit()
        db.refresh(new_student)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    return new_student


@router.get("/", response_model=list[StudentResponse])
def get_students(
    search: str | None = None,
    course: str | None = None,
    age: int | None = None,
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Student)

    if search:
        query = query.filter(
            Student.name.ilike(f"%{search}%")
        )

    if course:
        query = query.filter(
            Student.course.ilike(f"%{course}%")
        )

    if age:
        query = query.filter(
            Student.age == age
        )

    students = query.offset(skip).limit(limit).all()

    return students


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = db.query(Student).filter(
        Student.id == student_id
    ).first()

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    return student


@router.put("/{student_id}", response_model=StudentResponse)
def update_student(
    student_id: int,
    student: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    existing_student = db.query(Student).filter(
        Student.id == student_id
    ).first()

    if existing_student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    existing_student.name = student.name
    existing_student.email = student.email
    existing_student.age = student.age
    existing_student.course = student.course

    try:
        db.commit()
        db.refresh(existing_student)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    return existing_student


@router.delete("/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    student = db.query(Student).filter(
        Student.id == student_id
    ).first()

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    db.delete(student)
    db.commit()

    return {
        "message": "Student deleted successfully"
    }
