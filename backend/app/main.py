"""Точка входа FastAPI."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings, get_cors_config
from .routers import auth, ner, reports

settings = get_settings()
cors = get_cors_config(settings)

app = FastAPI(title="Med NER Demo")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors.allow_origins,
    allow_credentials=True,
    allow_methods=cors.allow_methods,
    allow_headers=cors.allow_headers,
)


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(ner.router)
app.include_router(reports.router)
