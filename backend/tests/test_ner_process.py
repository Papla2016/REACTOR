from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_ner_process_returns_entities():
    sample = "Пациент Иванов Иван Иванович, телефон +7 999 123-45-67"
    resp = client.post("/ner/process", json={"text": sample})
    assert resp.status_code == 200
    data = resp.json()
    assert "entities" in data
    assert isinstance(data["entities"], list)
    assert any(ent["value"] for ent in data["entities"])
