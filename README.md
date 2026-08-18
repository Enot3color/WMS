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

Репозиторий: _(будет добавлен после создания)_

### Что нужно для GitHub

1. Аккаунт на [github.com](https://github.com)
2. **GitHub CLI** (`gh`) или создание репозитория через веб-интерфейс
3. Аутентификация — один из вариантов:
   - `gh auth login` (рекомендуется)
   - SSH-ключ (`~/.ssh/id_ed25519.pub`) добавлен в GitHub → Settings → SSH keys
   - Personal Access Token для HTTPS

### Создание репозитория

```bash
# Установка GitHub CLI (Ubuntu)
sudo apt install gh

# Авторизация
gh auth login

# Создание private-репозитория и push
gh repo create print-warehouse --private --source=. --remote=origin --push
```

Или вручную на github.com → New repository → затем:

```bash
git remote add origin git@github.com:YOUR_USERNAME/print-warehouse.git
git push -u origin main
```

## Лицензия

Private / UNLICENSED
