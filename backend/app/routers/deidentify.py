from fastapi import APIRouter
from app.schemas import DeidentifyRequest, DeidentifyResponse
from app.deidentify import deidentify_text

router = APIRouter(tags=["deidentify"])


@router.post("/deidentify", response_model=DeidentifyResponse)
def deidentify(payload: DeidentifyRequest):
    masked, markers = deidentify_text(payload.text)
    return DeidentifyResponse(masked_text=masked, markers=markers)
