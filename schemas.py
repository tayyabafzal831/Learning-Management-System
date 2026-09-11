from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    username: str = Field(min_length=2, max_length=100)
    password: str = Field(min_length=4)
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    age: int = Field(gt=0, le=100)


class UserResponse(BaseModel):
    id: int
    username: str
    name: str
    email: str
    age: int
    role: str

    class Config:
        from_attributes = True