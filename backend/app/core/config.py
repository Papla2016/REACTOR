from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./data/app.db"
    jwt_secret: str = "change-me"
    access_token_expire_minutes: int = 30
    refresh_token_expire_minutes: int = 60 * 24 * 7
    cors_origins: str = "http://localhost:5173"
    frontend_url: str = "http://localhost:5173"
    doctor_visible_types: str = "NAME,CITY"


@lru_cache
def get_settings() -> Settings:
    return Settings()
