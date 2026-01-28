from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app import models, schemas
from app.auth import get_current_user, require_role
from app.deidentify import apply_markers
from app.core.config import get_settings

router = APIRouter(prefix="/cases", tags=["cases"])


@router.post("", response_model=schemas.CaseSummary)
def create_case(payload: schemas.CaseCreate, db: Session = Depends(get_db), user: models.User = Depends(require_role(models.UserRole.DOCTOR))):
    patient = db.get(models.User, payload.patient_id)
    if not patient or patient.role != models.UserRole.PATIENT:
        raise HTTPException(status_code=404, detail="Patient not found")
    case = models.MedicalCase(
        patient_id=patient.id,
        doctor_id=user.id,
        patient_name=payload.patient_name,
        doctor_name=payload.doctor_name,
        visit_date=payload.visit_date,
        disease=payload.disease,
        direction=payload.direction,
        notes=payload.notes,
        analysis_result=payload.analysis_result,
    )
    db.add(case)
    db.commit()
    db.refresh(case)
    case_text = models.CaseText(case_id=case.id, masked_text=payload.masked_text)
    db.add(case_text)
    for marker in payload.markers:
        db.add(models.Marker(case_id=case.id, marker=marker.marker, type=marker.type, original_value=marker.original_value))
    db.commit()
    return schemas.CaseSummary(
        id=case.id,
        patient_name=case.patient_name,
        doctor_name=case.doctor_name,
        visit_date=case.visit_date,
        disease=case.disease,
        direction=case.direction,
    )


@router.get("", response_model=list[schemas.CaseSummary])
def list_cases(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    query = db.query(models.MedicalCase)
    if user.role == models.UserRole.DOCTOR:
        query = query.filter(models.MedicalCase.doctor_id == user.id)
    else:
        query = query.filter(models.MedicalCase.patient_id == user.id)
    cases = query.order_by(models.MedicalCase.created_at.desc()).all()
    return [
        schemas.CaseSummary(
            id=c.id,
            patient_name=c.patient_name,
            doctor_name=c.doctor_name,
            visit_date=c.visit_date,
            disease=c.disease,
            direction=c.direction,
        )
        for c in cases
    ]


@router.get("/{case_id}", response_model=schemas.CaseDetail)
def get_case(case_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    case = db.get(models.MedicalCase, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Not found")
    if user.role == models.UserRole.DOCTOR and case.doctor_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if user.role == models.UserRole.PATIENT and case.patient_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    markers = [schemas.MarkerCreate(marker=m.marker, type=m.type, original_value=m.original_value) for m in case.markers]
    if user.role == models.UserRole.PATIENT:
        text = apply_markers(case.case_text.masked_text, markers, visible_types=None)
    else:
        settings = get_settings()
        visible_types = {t.strip().upper() for t in settings.doctor_visible_types.split(',') if t.strip()}
        text = apply_markers(case.case_text.masked_text, markers, visible_types=visible_types)
    return schemas.CaseDetail(
        id=case.id,
        patient_name=case.patient_name,
        doctor_name=case.doctor_name,
        visit_date=case.visit_date,
        disease=case.disease,
        direction=case.direction,
        notes=case.notes,
        analysis_result=case.analysis_result,
        text=text,
        markers=markers,
    )



@router.get("/search", response_model=list[schemas.CaseSummary])
def search_cases(
    patient_id: int | None = None,
    doctor_id: int | None = None,
    disease: str | None = None,
    direction: str | None = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    query = db.query(models.MedicalCase)
    if user.role == models.UserRole.DOCTOR:
        query = query.filter(models.MedicalCase.doctor_id == user.id)
    else:
        query = query.filter(models.MedicalCase.patient_id == user.id)
    if patient_id:
        query = query.filter(models.MedicalCase.patient_id == patient_id)
    if doctor_id:
        query = query.filter(models.MedicalCase.doctor_id == doctor_id)
    if disease:
        query = query.filter(models.MedicalCase.disease.ilike(f"%{disease}%"))
    if direction:
        query = query.filter(models.MedicalCase.direction.ilike(f"%{direction}%"))
    cases = query.all()
    return [
        schemas.CaseSummary(
            id=c.id,
            patient_name=c.patient_name,
            doctor_name=c.doctor_name,
            visit_date=c.visit_date,
            disease=c.disease,
            direction=c.direction,
        )
        for c in cases
    ]
