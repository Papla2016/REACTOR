
def test_deidentify(client):
    response = client.post("/deidentify", json={"text": "Паспорт 1234 567890 и email test@example.com"})
    assert response.status_code == 200
    data = response.json()
    assert "masked_text" in data
    assert data["markers"]
