# Print Warehouse

Веб-система складского учёта для типографии. Замена связки Google-таблиц на NestJS + React + PostgreSQL.

## Стек

- **Backend:** Node.js 20, NestJS 10, Prisma 7, PostgreSQL 16
- **Frontend:** React 18, TypeScript, Vite
- **Infra:** Docker Compose (PostgreSQL + MinIO)

## Быстрый старт

```bash
# 1. Инфраструктура
docker compose up -d

# 2. Backend
cp .env.example backend/.env   # если ещё не скопирован
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run start:dev

# 3. Frontend (отдельный терминал)
cd frontend
npm install
npm run dev
```

- API: http://localhost:3000/api
- Swagger: http://localhost:3000/api/docs
- Frontend: http://localhost:5173
- MinIO Console: http://localhost:9001 (minioadmin / minioadmin)

### Первый вход

После `npm run prisma:seed --prefix backend`:

| | |
|---|---|
| Email | `admin@example.com` |
| Логин | `admin` |
| Телефон | `+79000000000` |
| Пароль | `admin12345` |
| Роль | ADMIN (руководитель) |

Вход возможен по **email**, **логину** или **телефону**.

## Production (Keenetic / домен)

**Не публикуйте `npm run dev` в интернет** — Vite dev-сервер отдаёт сотни модулей и HMR-скрипты.

### Docker (рекомендуется)

```bash
# JWT и домен (через запятую, если несколько)
export JWT_SECRET="your-secret"
export CORS_ORIGIN="https://wms.enot3color.keenetic.name"
export WEB_PORT=8080

docker compose -f docker-compose.prod.yml up -d --build
cd backend && npm run prisma:migrate && npm run prisma:seed
```

Nginx раздаёт собранный frontend и проксирует `/api` → backend.  
На роутере пробросьте порт **8080** (или 443 через свой SSL) на машину с Docker.

### Ручной деплой (nginx на хосте)

```bash
cd frontend && npm run build   # VITE_API_URL=/api уже в .env.production
# dist/ → /var/www/wms
# nginx: try_files + proxy /api → localhost:3000
```

### Частые проблемы

| Симптом | Причина | Решение |
|---|---|---|
| Страница login перезагружается | Dev-сервер Vite + битый token в localStorage | Production build + nginx |
| Много скриптов на login | Открыт `npm run dev` снаружи | `npm run build` + статика |
| Login не работает | API указывает на `localhost:3000` | `VITE_API_URL=/api` + nginx proxy |
| CORS error | Backend не знает домен | `CORS_ORIGIN=https://ваш-домен` |

## Структура

```
print-warehouse/
├── backend/          # NestJS API
│   ├── prisma/       # Схема БД
│   └── src/
├── frontend/         # React SPA
├── docker-compose.yml
└── .env.example
```

## MVP (из ТЗ)

- [x] Auth: JWT, роли (кладовщик / менеджер / руководитель)
- [ ] Номенклатура и карточка материала
- [ ] Журнал движений (приход, выдача, списание, возврат)
- [ ] Заявки менеджеров + workflow + резервы
- [ ] Стол заказов
- [ ] Инвентаризация по зонам
- [ ] Печатные формы (PDF)
- [ ] Роли и аудит
- [ ] Миграция из Google Sheets

## GitHub

Репозиторий: https://github.com/Enot3color/WMS

## Лицензия

Private / UNLICENSED
