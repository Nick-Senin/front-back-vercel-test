# FastAPI + React + Vercel App

Простое приложение с бэкендом на FastAPI и фронтендом на React, готовое к деплою на Vercel.

## Структура проекта

```
├── api/
│   └── index.py          # FastAPI бэкенд
├── frontend/
│   ├── src/
│   │   ├── App.tsx      # React компонент
│   │   ├── App.css      # Стили
│   │   ├── main.tsx     # Входная точка
│   │   └── index.css    # Глобальные стили
│   ├── package.json     # Зависимости Node.js
│   ├── vite.config.ts   # Конфиг Vite
│   └── vercel.json      # Конфиг Vercel для фронтенда
├── requirements.txt      # Зависимости Python
├── vercel.json          # Конфиг Vercel для бэкенда
└── .github/workflows/vercel-deploy.yml  # GitHub Actions
```

## API эндпоинты

- `GET /` - статус бэкенда
- `GET /api/health` - проверка здоровья
- `POST /api/echo` - эхо тест
- `GET /api/users` - список пользователей
- `GET /api/weather/omsk` - погода в Омске

## Локальная разработка

### Бэкенд
```bash
pip install -r requirements.txt
uvicorn api.index:app --reload --port 8000
```

### Фронтенд
```bash
cd frontend
npm install
npm run dev
```

## ✅ Приложение задеплоено!

**🚀 Live URL:** https://front-back-vercel-test-4x1det2gc-nicksenins-projects.vercel.app
**📂 GitHub:** https://github.com/Nick-Senin/front-back-vercel-test

## Деплой на Vercel

### 1. Создание репозитория
```bash
git init
git add .
git commit -m "Initial commit"
gh repo create <username>/<repo-name> --public --source=. --remote=origin --push
```

### 2. Настройка Vercel CLI
```bash
export VERCEL_TOKEN=<your-vercel-token>
npx -y vercel@latest link --project <project-name> --yes --token=$VERCEL_TOKEN
npx -y vercel@latest pull --environment=production --yes --token=$VERCEL_TOKEN
```

### 3. Первый деплой
```bash
npx -y vercel@latest --prod --yes --token=$VERCEL_TOKEN
```

### 4. Настройка автодеплоя через GitHub Actions

В GitHub репозитории добавьте секреты (Settings → Secrets and variables → Actions):
- `VERCEL_TOKEN` - токен Vercel
- `VERCEL_PROJECT_ID` - ID проекта из `.vercel/project.json`
- `VERCEL_ORG_ID` - ID организации из `.vercel/project.json`

Через CLI:
```bash
gh secret set VERCEL_TOKEN --body "$VERCEL_TOKEN"
gh secret set VERCEL_PROJECT_ID --body "<project-id>"
gh secret set VERCEL_ORG_ID --body "<org-id>"
```

Теперь каждый push в `main` ветку будет автоматически деплоить приложение.

## Особенности

- CORS настроен для работы фронтенда с бэкендом
- Proxy в Vite для локальной разработки (`/api` → `http://localhost:8000`)
- Современный UI с градиентами и адаптивным дизайном
- Обработка ошибок и состояния загрузки
- TypeScript для типобезопасности
