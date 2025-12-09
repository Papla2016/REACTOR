"""Описание таблиц проекта."""
from datetime import datetime
from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Medic(Base):
    __tablename__ = "medics"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    reports = relationship("ExamReport", back_populates="medic")


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    date_of_birth = Column(Date)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    reports = relationship("ExamReport", back_populates="patient")


class ExamReport(Base):
    __tablename__ = "exam_reports"

    id = Column(Integer, primary_key=True, index=True)
    medic_id = Column(Integer, ForeignKey("medics.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    raw_text = Column(Text, nullable=False)
    processed_text = Column(Text, nullable=True)
    viewer_full_name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    medic = relationship("Medic", back_populates="reports")
    patient = relationship("Patient", back_populates="reports")
    entities = relationship("Entity", back_populates="report", cascade="all, delete")


class Entity(Base):
    __tablename__ = "entities"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("exam_reports.id"), nullable=False)
    start_offset = Column(Integer, nullable=False)
    end_offset = Column(Integer, nullable=False)
    value = Column(String(512), nullable=False)
    entity_type = Column(String(64), nullable=False)
    source = Column(String(32), default="auto", nullable=False)
    created_by = Column(String(128))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    report = relationship("ExamReport", back_populates="entities")
