from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app import models, schemas
from app.auth import hash_password, verify_password, create_access_token, create_refresh_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=schemas.UserResponse)
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = models.User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        full_name=payload.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return schemas.UserResponse(id=user.id, email=user.email, role=user.role, full_name=user.full_name)


@router.post("/login", response_model=schemas.TokenPair)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return schemas.TokenPair(
        access_token=create_access_token(user),
        refresh_token=create_refresh_token(user),
    )


@router.post("/refresh", response_model=schemas.TokenPair)
def refresh(payload: dict, db: Session = Depends(get_db)):
    token = payload.get("refresh_token")
    if not token:
        raise HTTPException(status_code=400, detail="refresh_token required")
    from jose import jwt, JWTError
    from app.core.config import get_settings

    settings = get_settings()
    try:
        decoded = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        if decoded.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token")
        user_id = int(decoded.get("sub"))
    except (JWTError, ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return schemas.TokenPair(
        access_token=create_access_token(user),
        refresh_token=create_refresh_token(user),
    )
