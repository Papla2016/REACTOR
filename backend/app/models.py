import enum
from datetime import datetime
from sqlalchemy import String, DateTime, Enum, Integer, ForeignKey, Text, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base


class UserRole(str, enum.Enum):
    PATIENT = "PATIENT"
    DOCTOR = "DOCTOR"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    oauth_provider: Mapped[str | None] = mapped_column(String(50), nullable=True)
    oauth_subject: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    cases_as_patient: Mapped[list["MedicalCase"]] = relationship(
        back_populates="patient", foreign_keys="MedicalCase.patient_id"
    )
    cases_as_doctor: Mapped[list["MedicalCase"]] = relationship(
        back_populates="doctor", foreign_keys="MedicalCase.doctor_id"
    )


class MedicalCase(Base):
    __tablename__ = "medical_cases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    doctor_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    patient_name: Mapped[str] = mapped_column(String(255))
    doctor_name: Mapped[str] = mapped_column(String(255))
    visit_date: Mapped[datetime] = mapped_column(Date)
    disease: Mapped[str] = mapped_column(String(255))
    direction: Mapped[str] = mapped_column(String(255))
    notes: Mapped[str] = mapped_column(Text)
    analysis_result: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient: Mapped[User] = relationship(back_populates="cases_as_patient", foreign_keys=[patient_id])
    doctor: Mapped[User] = relationship(back_populates="cases_as_doctor", foreign_keys=[doctor_id])
    case_text: Mapped["CaseText"] = relationship(back_populates="medical_case", uselist=False)
    markers: Mapped[list["Marker"]] = relationship(back_populates="medical_case", cascade="all, delete-orphan")


class CaseText(Base):
    __tablename__ = "case_texts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("medical_cases.id"), unique=True)
    masked_text: Mapped[str] = mapped_column(Text)

    medical_case: Mapped[MedicalCase] = relationship(back_populates="case_text")


class Marker(Base):
    __tablename__ = "markers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("medical_cases.id"))
    marker: Mapped[str] = mapped_column(String(50))
    type: Mapped[str] = mapped_column(String(50))
    original_value: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    medical_case: Mapped[MedicalCase] = relationship(back_populates="markers")
