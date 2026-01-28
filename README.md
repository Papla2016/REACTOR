# Medical Reactor (frontend + backend)

## Запуск

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Swagger: http://localhost:8000/docs

## Demo аккаунты

- Врач: `doctor@example.com` / `doctor123`
- Пациент: `patient@example.com` / `patient123`

## Основные переменные окружения backend

- `DATABASE_URL` — URL SQLite (например `sqlite:///./data/app.db`).
- `JWT_SECRET` — секрет для JWT.
- `CORS_ORIGINS` — список origin через запятую.
- `FRONTEND_URL` — куда редиректить после OAuth.
- `DOCTOR_VISIBLE_TYPES` — белый список типов маркеров, которые врач может видеть раскрытыми (например `NAME,CITY,EMAIL`).

## Основные сценарии

1. Войти как врач.
2. Ввести ФИО пациента в поле — выберите из списка или добавьте нового.
3. Заполнить поля дела и текст.
4. Нажать **Обезличить (авто)** или выделить фрагмент + ПКМ → выбрать тип и обезличить вручную.
5. Сохранить дело.
6. Войти как пациент и открыть дело — текст восстановится в оригинальном виде.

## OAuth мок

- `GET /oauth/{provider}/start?role=DOCTOR|PATIENT` редиректит на мок-страницу провайдера.
- После входа мока происходит редирект в frontend на `/oauth/callback` с access/refresh токенами.

## TODO / MVP допущения

- Авто-обезличивание использует regex (без NLP NER). Можно заменить на spaCy/DeepPavlov модульно.
- Токены хранятся в `localStorage` для простоты (лучше хранить refresh в httpOnly cookie).
- При создании пациента email опционален; в таком случае создаётся временный `@local` email.
