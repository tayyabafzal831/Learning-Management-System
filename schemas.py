from pydantic import BaseModel, EmailStr, Field


class StudentCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    age: int = Field(gt=0, le=100)
    course: str = Field(min_length=2, max_length=100)


class StudentUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    age: int = Field(ge=5, le=100)
    course: str = Field(min_length=2, max_length=100)


class StudentResponse(BaseModel):
    id: int
    name: str
    email: str
    age: int
    course: str

    class Config:
        from_attributes = True