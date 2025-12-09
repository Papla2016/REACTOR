"""Pydantic-схемы для запросов и ответов."""
from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


class HealthResponse(BaseModel):
    status: str


class MedicCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str


class MedicOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    medic: MedicOut
    token: str


class PatientBase(BaseModel):
    full_name: str
    date_of_birth: Optional[date] = None


class PatientCreate(PatientBase):
    pass


class PatientOut(PatientBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ReportCreate(BaseModel):
    medic_id: int
    patient_full_name: str
    patient_date_of_birth: Optional[date] = None
    raw_text: str
    viewer_full_name: str


class ReportOut(BaseModel):
    id: int
    medic_id: int
    patient: Optional[PatientOut]
    raw_text: str
    processed_text: Optional[str]
    viewer_full_name: str
    created_at: datetime

    class Config:
        from_attributes = True


class EntityBase(BaseModel):
    start_offset: int = Field(ge=0)
    end_offset: int = Field(gt=0)
    value: str
    entity_type: str
    source: str = "auto"
    created_by: Optional[str] = None


class EntityCreate(EntityBase):
    pass


class EntityOut(EntityBase):
    id: int
    report_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ReportWithEntities(ReportOut):
    entities: List[EntityOut]


class NERRequest(BaseModel):
    text: str


class NEREntity(BaseModel):
    start: int
    end: int
    value: str
    entity_type: str
    source: str = "auto"


class NERResponse(BaseModel):
    entities: List[NEREntity]
