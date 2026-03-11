def test_deidentify(client):
    response = client.post("/deidentify", json={"text": "Паспорт 1234 567890 и email test@example.com"})
    assert response.status_code == 200
    data = response.json()
    assert "masked_text" in data
    assert data["markers"]


def test_deidentify_reuses_marker_for_same_value(client):
    text = "Почта ivanov.i.i.1989@mail.ru и еще раз ivanov.i.i.1989@mail.ru"
    response = client.post('/deidentify', json={'text': text})
    assert response.status_code == 200

    data = response.json()
    assert data['masked_text'].count('EMAIL1') == 2
    assert len(data['markers']) == 1
    assert data['markers'][0]['original_value'] == 'ivanov.i.i.1989@mail.ru'
