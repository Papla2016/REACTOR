"""Маршруты для работы с NER (Natasha + regexp)."""
from fastapi import APIRouter, HTTPException
from natasha import Doc, MorphVocab, NewsNERTagger, NewsEmbedding, NewsMorphTagger

from ..schemas import NERRequest, NERResponse, NEREntity
from ..utils.patterns import find_with_regex

router = APIRouter(prefix="/ner", tags=["ner"])

morph_vocab = MorphVocab()
emb = NewsEmbedding()
morph_tagger = NewsMorphTagger(emb)
ner_tagger = NewsNERTagger(emb)


@router.post("/process", response_model=NERResponse)
def process_text(payload: NERRequest) -> NERResponse:
    if not payload.text:
        raise HTTPException(status_code=400, detail="Текст отчёта не передан")

    doc = Doc(payload.text)
    doc.segment(morph_tagger)
    doc.tag_ner(ner_tagger)

    entities: list[NEREntity] = []
    for span in doc.spans:
        span.normalize(morph_vocab)
        entities.append(
            NEREntity(
                start=span.start,
                end=span.stop,
                value=payload.text[span.start : span.stop],
                entity_type=span.type,
                source="auto",
            )
        )

    for ent in find_with_regex(payload.text):
        entities.append(ent)

    entities.sort(key=lambda e: e.start)
    return NERResponse(entities=entities)
