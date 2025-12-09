"""Конфигурация приложения и чтение .env."""
from pydantic import BaseModel
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "med_ner_demo"
    db_user: str = "med_ner_user"
    db_password: str = "supersecret"

    app_host: str = "0.0.0.0"
    app_port: int = 8000
    allowed_origins: str = "*"


class CORSConfig(BaseModel):
    allow_origins: list[str]
    allow_methods: list[str] = ["*"]
    allow_headers: list[str] = ["*"]


def get_settings() -> Settings:
    return Settings()


def get_cors_config(settings: Settings) -> CORSConfig:
    origins = [o.strip() for o in settings.allowed_origins.split(",") if o.strip()]
    return CORSConfig(allow_origins=origins or ["*"])
