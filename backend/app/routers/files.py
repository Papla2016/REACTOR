from fastapi import APIRouter, UploadFile, File
from app.deidentify import deidentify_text
from app.schemas import DeidentifyResponse, MarkerCreate

router = APIRouter(prefix="/files", tags=["files"])


@router.post("/deidentify", response_model=DeidentifyResponse)
def deidentify_file(file: UploadFile = File(...)):
    content = file.file.read().decode("utf-8")
    masked, markers = deidentify_text(content)
    return DeidentifyResponse(masked_text=masked, markers=markers)
