from fastapi import FastAPI
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.core.config import get_settings
from app.db import SessionLocal, engine, Base
from app import models
from app.auth import hash_password
from app.routers import auth, cases, oauth, patients, files, deidentify

settings = get_settings()

app = FastAPI(title="Medical Deidentify API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(oauth.router)
app.include_router(patients.router)
app.include_router(cases.router)
app.include_router(files.router)
app.include_router(deidentify.router)


@app.on_event("startup")
def on_startup():
    ensure_sqlite_dir()
    Base.metadata.create_all(bind=engine)
    seed_demo_users()


def ensure_sqlite_dir():
    url = settings.database_url
    if url.startswith('sqlite:///'):
        path = url.replace('sqlite:///', '')
        directory = Path(path).parent
        directory.mkdir(parents=True, exist_ok=True)


def seed_demo_users():
    db: Session = SessionLocal()
    try:
        if db.query(models.User).count() == 0:
            doctor = models.User(
                email="doctor@example.com",
                password_hash=hash_password("doctor123"),
                role=models.UserRole.DOCTOR,
                full_name="Иванов Иван Иванович",
            )
            patient = models.User(
                email="patient@example.com",
                password_hash=hash_password("patient123"),
                role=models.UserRole.PATIENT,
                full_name="Петров Петр Петрович",
            )
            db.add_all([doctor, patient])
            db.commit()
    finally:
        db.close()
