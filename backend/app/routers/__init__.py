"""Роутеры приложения."""
from .auth import router as auth
from .ner import router as ner
from .reports import router as reports

__all__ = ["auth", "ner", "reports"]
