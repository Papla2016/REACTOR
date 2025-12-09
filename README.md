# Демо обезличивания мед. отчётов

Проект показывает связку Vite + React для кабинета медика и Python FastAPI для автоматической/ручной разметки персональных данных с помощью Natasha. Данные хранятся в PostgreSQL, конфигурация задаётся через `.env`.

## Архитектура и схема БД

- **frontend** (Vite/React) — личный кабинет медика, создание и просмотр отчётов, вызов NER и ручная разметка.
- **backend** (FastAPI + Natasha) — REST API, подключение к PostgreSQL, работа с отчётами и сущностями.
- **База данных** — PostgreSQL с таблицами:
  - `medics(id, full_name, email, password_hash, created_at)`
  - `patients(id, full_name, date_of_birth, created_at)`
  - `exam_reports(id, medic_id, patient_id, raw_text, processed_text, viewer_full_name, created_at)`
  - `entities(id, report_id, start_offset, end_offset, value, entity_type, source, created_by, created_at)`

## Переменные окружения

Скопируйте `.env.example` в `.env` и подставьте свои значения:

```
cp .env.example .env
```

Пример содержимого:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=med_ner_demo
DB_USER=med_ner_user
DB_PASSWORD=supersecret

APP_HOST=0.0.0.0
APP_PORT=8000
ALLOWED_ORIGINS=http://localhost:5173

VITE_API_URL=http://localhost:8000
```

Vite автоматически подхватывает переменные `VITE_*` из `.env` при `npm run dev`/`npm run build`.

## Подготовка окружения

1. **Клонирование**
   ```bash
   git clone <URL>
   cd REACTOR
   ```
2. **PostgreSQL**. Быстрый способ через Docker:
   ```bash
   docker run --name med-ner-pg -e POSTGRES_USER=med_ner_user -e POSTGRES_PASSWORD=supersecret \
     -e POSTGRES_DB=med_ner_demo -p 5432:5432 -d postgres:15
   ```
   Или используйте свою базу, указав реквизиты в `.env`.
3. **Инициализация БД и тестового медика**
   ```bash
   # Linux/macOS
   PYTHONPATH=backend python backend/init_db.py

   # Windows (cmd)
   set PYTHONPATH=backend && python backend\init_db.py

   ```
   Создаётся схема и пользователь `doctor@example.com` / `doctor123` (пароль хэшируется).

## Запуск Python-бэкенда (FastAPI)

1. Установите зависимости:
   ```bash
   pip install -r backend/requirements.txt
   ```
2. Стартуйте сервис (учитывает `.env`):
   ```bash
   cd backend
   # Значения APP_HOST/APP_PORT берутся из .env автоматически, поэтому
   # указываем только путь до env-файла и включаем hot-reload
   uvicorn app.main:app --env-file ../.env --reload --host 0.0.0.0 --port 8000
 main
   ```
3. Базовые эндпоинты:
   - `GET /health` — проверка доступности.
   - `POST /auth/login` — вход по email/паролю.
   - `POST /reports` / `GET /reports` / `GET /reports/{id}` — работа с отчётами.
   - `POST /ner/process` — извлечение сущностей Natasha + RegExp.
   - `POST /reports/{id}/entities/auto` — сохранение авторазметки.
   - `POST /reports/{id}/entities/manual` — добавление сущности вручную.

### Примеры запросов

```bash
# Healthcheck
curl http://localhost:8000/health

# Запуск NER
curl -X POST http://localhost:8000/ner/process \
  -H 'Content-Type: application/json' \
  -d '{"text":"Пациент Иванов Иван Иванович, телефон +7 999 123-45-67"}'

# Добавление ручной сущности
curl -X POST http://localhost:8000/reports/1/entities/manual \
  -H 'Content-Type: application/json' \
  -d '{"start_offset":0,"end_offset":21,"value":"Иванов Иван Иванович","entity_type":"ФИО","source":"manual","created_by":"demo"}'
```

## Запуск фронтенда

1. Установите Node.js 18+ и зависимости:
   ```bash
   npm install
   ```
2. Запустите dev-сервер:
   ```bash
   npm run dev
   ```
   Vite возьмёт `VITE_API_URL` из `.env` и будет слать запросы на FastAPI. Откройте адрес из консоли (обычно `http://localhost:5173`).

## Сценарий демонстрации

1. Войти как `doctor@example.com` / `doctor123`.
2. Создать отчёт: введите ФИО пациента, текст и ФИО зрителя, нажмите «Сохранить отчёт».
3. Открыть отчёт в списке и нажать «Обработать нейросетью» — подсветятся найденные Natasha/RegExp сущности и запишутся в БД.
4. Для ручной разметки выделите текст в области «Выделите фрагмент» и кликните ПКМ → появится модалка, выберите тип и сохраните — сущность добавится в таблицу `entities`.
5. Перезагрузите отчёт, чтобы убедиться, что все сущности сохраняются.

## Тесты

Минимальные тесты размещены в `backend/tests/`:
- `/health`
- `/ner/process`

Запуск (понадобятся зависимости, задайте PYTHONPATH):
```bash
PYTHONPATH=backend pytest backend/tests
```

## Структура Python-бэкенда
```
backend/
  app/
    __init__.py
    main.py          # FastAPI + CORS
    config.py        # чтение env
    db.py            # сессия SQLAlchemy
    models.py        # таблицы
    schemas.py       # Pydantic-схемы
    routers/
      auth.py        # вход медика
      ner.py         # Natasha + regex
      reports.py     # отчёты и сущности
    utils/
      generator.py   # генераторы токенов/паролей
      patterns.py    # регулярки ИНН/СНИЛС/телефон и т.п.
  init_db.py         # создание схемы + тестовый медик
  requirements.txt
```

## Пояснения по фронтенду

- Все запросы идут на `VITE_API_URL` через `fetch`.
- Личный кабинет умеет:
  - вход по email/паролю;
  - создание отчёта с пациентом и зрителем;
  - просмотр списка отчётов и деталей;
  - кнопка «Обработать нейросетью» отправляет текст на `/ner/process`, подсвечивает сущности и сохраняет их;
  - ПКМ по выделенному тексту открывает модалку для ручной разметки и сохранения в `/reports/{id}/entities/manual`.

Все тексты и комментарии в коде русские; переменные подключения берутся только из `.env`.
