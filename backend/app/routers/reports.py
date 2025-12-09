"""Работа с отчётами и сущностями."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..db import get_db

router = APIRouter(prefix="/reports", tags=["reports"])


def get_patient(db: Session, full_name: str, dob):
    query = db.query(models.Patient).filter(models.Patient.full_name == full_name)
    if dob:
        query = query.filter(models.Patient.date_of_birth == dob)
    return query.first()


@router.post("", response_model=schemas.ReportOut, status_code=status.HTTP_201_CREATED)
def create_report(payload: schemas.ReportCreate, db: Session = Depends(get_db)):
    medic = db.get(models.Medic, payload.medic_id)
    if not medic:
        raise HTTPException(status_code=404, detail="Медик не найден")

    patient = get_patient(db, payload.patient_full_name, payload.patient_date_of_birth)
    if not patient:
        patient = models.Patient(full_name=payload.patient_full_name, date_of_birth=payload.patient_date_of_birth)
        db.add(patient)
        db.flush()

    report = models.ExamReport(
        medic_id=payload.medic_id,
        patient_id=patient.id if patient else None,
        raw_text=payload.raw_text,
        processed_text=payload.raw_text,
        viewer_full_name=payload.viewer_full_name,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("", response_model=list[schemas.ReportOut])
def list_reports(medic_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(models.ExamReport)
    if medic_id:
        query = query.filter(models.ExamReport.medic_id == medic_id)
    reports = query.order_by(models.ExamReport.created_at.desc()).all()
    return reports


@router.get("/{report_id}", response_model=schemas.ReportWithEntities)
def get_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(models.ExamReport).filter(models.ExamReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Отчёт не найден")
    return report


@router.post("/{report_id}/entities/auto", response_model=list[schemas.EntityOut])
def save_auto_entities(report_id: int, entities: list[schemas.EntityCreate], db: Session = Depends(get_db)):
    report = db.get(models.ExamReport, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Отчёт не найден")

    saved = []
    for ent in entities:
        item = models.Entity(
            report_id=report_id,
            start_offset=ent.start_offset,
            end_offset=ent.end_offset,
            value=ent.value,
            entity_type=ent.entity_type,
            source=ent.source or "auto",
            created_by=ent.created_by,
        )
        db.add(item)
        saved.append(item)
    db.commit()
    for item in saved:
        db.refresh(item)
    return saved


@router.post("/{report_id}/entities/manual", response_model=schemas.EntityOut, status_code=status.HTTP_201_CREATED)
def add_manual_entity(report_id: int, payload: schemas.EntityCreate, db: Session = Depends(get_db)):
    report = db.get(models.ExamReport, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Отчёт не найден")

    entity = models.Entity(
        report_id=report_id,
        start_offset=payload.start_offset,
        end_offset=payload.end_offset,
        value=payload.value,
        entity_type=payload.entity_type,
        source=payload.source or "manual",
        created_by=payload.created_by,
    )
    db.add(entity)
    db.commit()
    db.refresh(entity)
    return entity
