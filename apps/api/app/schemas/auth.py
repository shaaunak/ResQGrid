from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.models.enums import UserRole


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    user_id: str
    full_name: str


class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[UserRole] = None


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=255)
    role: UserRole = UserRole.CITIZEN
    phone: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: UserRole
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

