
def test_register_and_login(client):
    payload = {
        "email": "new@example.com",
        "password": "password123",
        "role": "PATIENT",
        "full_name": "Тест Пациент",
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 200

    login = client.post("/auth/login", json={"email": "new@example.com", "password": "password123"})
    assert login.status_code == 200
    data = login.json()
    assert "access_token" in data


def test_access_control(client):
    doctor_payload = {
        "email": "doc@test.com",
        "password": "docpass123",
        "role": "DOCTOR",
        "full_name": "Доктор",
    }
    patient_payload = {
        "email": "pat@test.com",
        "password": "patpass123",
        "role": "PATIENT",
        "full_name": "Пациент",
    }
    client.post("/auth/register", json=doctor_payload)
    client.post("/auth/register", json=patient_payload)

    login = client.post("/auth/login", json={"email": "pat@test.com", "password": "patpass123"})
    token = login.json()["access_token"]
    res = client.get("/patients?query=Паци", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403
