import re
from collections import defaultdict
from typing import List
from app.schemas import MarkerCreate


PATTERNS = {
    "EMAIL": re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"),
    "PHONE": re.compile(r"(\+7|8)\s?\(?\d{3}\)?\s?\d{3}[\s-]?\d{2}[\s-]?\d{2}"),
    "PASSPORT": re.compile(r"\b\d{4}\s?\d{6}\b"),
    "NAME": re.compile(r"\b[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+\b"),
    "CITY": re.compile(r"\b(Москва|Санкт-Петербург|Новосибирск|Екатеринбург|Казань)\b", re.IGNORECASE),
}


def deidentify_text(text: str) -> tuple[str, List[MarkerCreate]]:
    markers: List[MarkerCreate] = []
    counters = defaultdict(int)

    def replace(match: re.Match, marker_type: str) -> str:
        value = match.group(0)
        counters[marker_type] += 1
        marker = f"{marker_type}{counters[marker_type]}"
        markers.append(MarkerCreate(marker=marker, type=marker_type, original_value=value))
        return marker

    masked = text
    for marker_type, pattern in PATTERNS.items():
        masked = pattern.sub(lambda m, t=marker_type: replace(m, t), masked)

    return masked, markers


def apply_markers(masked_text: str, markers: List[MarkerCreate], visible_types: set[str] | None = None) -> str:
    result = masked_text
    for marker in markers:
        if visible_types is None or marker.type in visible_types:
            result = result.replace(marker.marker, marker.original_value)
    return result
