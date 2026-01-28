from datetime import date
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from app.models import UserRole


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    role: UserRole
    full_name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: UserRole
    full_name: str


class PatientCreate(BaseModel):
    full_name: str
    email: Optional[EmailStr] = None


class PatientOption(BaseModel):
    id: int
    full_name: str
    email: EmailStr | None


class MarkerCreate(BaseModel):
    marker: str
    type: str
    original_value: str


class DeidentifyRequest(BaseModel):
    text: str


class DeidentifyResponse(BaseModel):
    masked_text: str
    markers: List[MarkerCreate]


class CaseCreate(BaseModel):
    patient_id: int
    patient_name: str
    doctor_name: str
    visit_date: date
    disease: str
    direction: str
    notes: str
    analysis_result: str
    masked_text: str
    markers: List[MarkerCreate]


class CaseSummary(BaseModel):
    id: int
    patient_name: str
    doctor_name: str
    visit_date: date
    disease: str
    direction: str


class CaseDetail(CaseSummary):
    notes: str
    analysis_result: str
    text: str
    markers: List[MarkerCreate]
