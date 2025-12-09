"""Регулярные выражения для поиска номеров."""
import re
from typing import Iterable

from ..schemas import NEREntity

# Простые паттерны для демонстрации
INN_RE = re.compile(r"\b\d{10}(\d{2})?\b")
SNILS_RE = re.compile(r"\b\d{3}-\d{3}-\d{3} \d{2}\b")
PASSPORT_RE = re.compile(r"\b\d{4} \d{6}\b")
PHONE_RE = re.compile(r"\+?7\s?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}")
EMAIL_RE = re.compile(r"[\w\.-]+@[\w\.-]+")


def find_with_regex(text: str) -> Iterable[NEREntity]:
    patterns = [
        (INN_RE, "ИНН"),
        (SNILS_RE, "СНИЛС"),
        (PASSPORT_RE, "паспорт"),
        (PHONE_RE, "телефон"),
        (EMAIL_RE, "e-mail"),
    ]
    for regex, name in patterns:
        for m in regex.finditer(text):
            yield NEREntity(start=m.start(), end=m.end(), value=m.group(0), entity_type=name, source="auto")
