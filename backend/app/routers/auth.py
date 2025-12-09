"""Простая авторизация медика по email/паролю."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import bcrypt

from .. import models, schemas
from ..db import get_db
from ..utils.generator import generate_token

router = APIRouter(prefix="/auth", tags=["auth"])


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


@router.post("/login", response_model=schemas.LoginResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    medic = db.query(models.Medic).filter(models.Medic.email == payload.email).first()
    if not medic or not verify_password(payload.password, medic.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверные учётные данные")
    token = generate_token(24)
    return schemas.LoginResponse(medic=medic, token=token)
