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
