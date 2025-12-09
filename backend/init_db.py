"""Инициализация схемы БД и создание тестового медика."""
import bcrypt
from sqlalchemy import text

from app.config import get_settings
from app.db import engine, SessionLocal
from app import models


def create_tables():
    models.Base.metadata.create_all(bind=engine)


def seed_doctor():
    settings = get_settings()
    with SessionLocal() as db:
        existing = db.query(models.Medic).filter(models.Medic.email == "doctor@example.com").first()
        if existing:
            return
        password = "doctor123"
        password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        medic = models.Medic(full_name="Иванов Иван Иванович", email="doctor@example.com", password_hash=password_hash)
        db.add(medic)
        db.commit()
        db.refresh(medic)
        print("Создан тестовый медик doctor@example.com / doctor123")


def main():
    settings = get_settings()
    print(
        f"Создание схемы в базе {settings.db_name} на {settings.db_host}:{settings.db_port} пользователем {settings.db_user}"
    )
    create_tables()
    seed_doctor()
    print("Готово")


if __name__ == "__main__":
    main()
