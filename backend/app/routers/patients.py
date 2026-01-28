from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app import models, schemas
from app.auth import require_role

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("")
def search_patients(query: str, db: Session = Depends(get_db), user: models.User = Depends(require_role(models.UserRole.DOCTOR))):
    patients = (
        db.query(models.User)
        .filter(models.User.role == models.UserRole.PATIENT, models.User.full_name.ilike(f"%{query}%"))
        .limit(10)
        .all()
    )
    return [schemas.PatientOption(id=p.id, full_name=p.full_name, email=p.email) for p in patients]


@router.post("")
def create_patient(payload: schemas.PatientCreate, db: Session = Depends(get_db), user: models.User = Depends(require_role(models.UserRole.DOCTOR))):
    if payload.email:
        existing = db.query(models.User).filter(models.User.email == payload.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already exists")
    email = payload.email or f"{payload.full_name.replace(' ', '.').lower()}@local"
    patient = models.User(
        email=email,
        password_hash=None,
        role=models.UserRole.PATIENT,
        full_name=payload.full_name,
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return schemas.PatientOption(id=patient.id, full_name=patient.full_name, email=patient.email)
