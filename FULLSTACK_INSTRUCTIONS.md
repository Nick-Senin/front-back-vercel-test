# Full-Stack приложение FastAPI + React на Vercel

Полная инструкция по созданию и деплою Full-Stack приложения с бэкендом на Python (FastAPI) и фронтендом на React + TypeScript с автоматическим деплоем через GitHub Actions.

## 🏗️ Архитектура решения

### Структура проекта
```
project-root/
├── api/
│   └── index.py          # FastAPI бэкенд (serverless функции)
├── src/                  # React компоненты фронтенда
│   ├── App.tsx
│   ├── App.css  
│   ├── main.tsx
│   └── index.css
├── package.json          # Зависимости Node.js для фронтенда
├── requirements.txt      # Зависимости Python для бэкенда  
├── vercel.json           # Конфиг Vercel для фронт + бэк
├── index.html            # HTML шаблон (в корне!)
├── vite.config.ts        # Конфиг Vite
├── tsconfig*.json        # TypeScript конфиги
├── .github/workflows/    # GitHub Actions
└── .gitignore
```

### Ключевые принципы
1. **Единый проект** - фронтенд и бэкенд в одном репозитории
2. **Фронтенд в корне** - React файлы на верхнем уровне для Vercel
3. **API в папке `/api/`** - для автоматического роутинга Vercel
4. **Двойная сборка** - отдельные билдеры для фронта и бэка

---

## 🚀 Быстрый старт

### 1. Создание бэкенда

**`api/index.py`**
```python
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI(title="Full-Stack App")

# КРИТИЧНО: Настройка CORS для фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене указать конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ok", "message": "FastAPI Backend", "version": "1.0"}

@app.get("/api/health")
def health():
    return {"ok": True}

@app.get("/api/users")
def get_users():
    return {
        "users": [
            {"id": 1, "name": "Alice", "email": "alice@example.com"},
            {"id": 2, "name": "Bob", "email": "bob@example.com"}
        ]
    }

@app.post("/api/echo")
async def echo(request: Request):
    try:
        data = await request.json()
    except Exception:
        data = None
    return JSONResponse(content={"received": data})
```

**`requirements.txt`**
```txt
fastapi==0.112.2
uvicorn==0.30.6
httpx==0.27.2
```

### 2. Создание фронтенда

**`package.json`**
```json
{
  "name": "fullstack-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "vercel-build": "npm run build"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.5.3",
    "vite": "^5.4.1"
  }
}
```

**`index.html`** (ВАЖНО: в корне проекта)
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Full-Stack App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**`src/App.tsx`**
```tsx
import { useState, useEffect } from 'react'
import './App.css'

interface User {
  id: number
  name: string
  email: string
}

function App() {
  const [users, setUsers] = useState<User[]>([])
  const [message, setMessage] = useState('')

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      setUsers(data.users)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const testEcho = async () => {
    try {
      const response = await fetch('/api/echo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: 'Hello from frontend!' }),
      })
      const data = await response.json()
      setMessage(JSON.stringify(data, null, 2))
    } catch (error) {
      console.error('Error testing echo:', error)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <div className="App">
      <header>
        <h1>Full-Stack App</h1>
      </header>

      <main>
        <section>
          <h2>Users</h2>
          <div className="users-grid">
            {users.map(user => (
              <div key={user.id} className="user-card">
                <h3>{user.name}</h3>
                <p>{user.email}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2>API Test</h2>
          <button onClick={testEcho}>Test Echo</button>
          {message && (
            <pre className="message-box">{message}</pre>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
```

### 3. Конфигурация Vercel

**`vercel.json`** (КРИТИЧНО для Full-Stack)
```json
{
  "builds": [
    { 
      "src": "package.json", 
      "use": "@vercel/static-build", 
      "config": { "distDir": "dist" } 
    },
    { 
      "src": "api/index.py", 
      "use": "@vercel/python" 
    }
  ],
  "routes": [
    { "handle": "filesystem" },
    { "src": "/api/(.*)", "dest": "api/index.py" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

**`vite.config.ts`**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

### 4. TypeScript конфигурация

**`tsconfig.json`**
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

**`tsconfig.app.json`**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

---

## 🛠️ Локальная разработка

### Запуск бэкенда
```bash
# Установка зависимостей Python
pip install -r requirements.txt

# Запуск FastAPI сервера
uvicorn api.index:app --reload --port 8000
# API доступно на http://localhost:8000
```

### Запуск фронтенда  
```bash
# Установка зависимостей Node.js
npm install

# Запуск Vite dev server
npm run dev
# Фронтенд доступен на http://localhost:5173
# API проксируется на http://localhost:5173/api/*
```

---

## 🚀 Деплой на Vercel

### Предварительная настройка

1. **Установка GitHub CLI**
```bash
# macOS
brew install gh

# Авторизация
gh auth login
```

2. **Получение токена Vercel**
- Зайти в [Vercel Dashboard](https://vercel.com/account/tokens)
- Создать токен с правами: `read:project`, `read:user`, `write:project`
- Экспортировать: `export VERCEL_TOKEN=your_token_here`

### Автоматический деплой

**`.github/workflows/vercel-deploy.yml`**
```yaml
name: Deploy to Vercel

on:
  push:
    branches: [ "main" ]
  workflow_dispatch:

permissions:
  contents: read
  deployments: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install Python deps
        run: |
          python -m pip install --upgrade pip
          if [ -f requirements.txt ]; then pip install -r requirements.txt; fi

      - name: Install Vercel CLI
        run: npm i -g vercel@latest

      - name: Pull Vercel env
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

      - name: Build
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Пошаговые команды деплоя

```bash
# 1. Инициализация Git
git init
git add .
git commit -m "feat: initial full-stack setup"

# 2. Создание GitHub репозитория
gh repo create username/project-name --public --source=. --remote=origin --push

# 3. Привязка к Vercel
npx vercel@latest link --project project-name --yes --token=$VERCEL_TOKEN
npx vercel@latest pull --environment=production --yes --token=$VERCEL_TOKEN

# 4. Первый деплой
npx vercel@latest --prod --yes --token=$VERCEL_TOKEN

# 5. Настройка GitHub Secrets
gh secret set VERCEL_TOKEN --body "$VERCEL_TOKEN"
gh secret set VERCEL_PROJECT_ID --body "$(node -p "require('./.vercel/project.json').projectId")"
gh secret set VERCEL_ORG_ID --body "$(node -p "require('./.vercel/project.json').orgId")"
```

---

## ⚠️ Частые проблемы и решения

### 1. "Authentication Required" на продакшене

**Проблема:** Vercel показывает страницу авторизации вместо приложения

**Причина:** Включен Deployment Protection  

**Решение:**
- Зайти в Vercel Dashboard → Project Settings → Deployment Protection
- Отключить Protection для Production
- Или настроить bypass token согласно [документации](https://vercel.com/docs/deployment-protection)

### 2. CORS ошибки между фронтом и бэком

**Проблема:** `Access to fetch at '/api/users' blocked by CORS policy`

**Решение:** Убедиться что в FastAPI настроен CORS middleware:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене указать домены
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)
```

### 3. 404 на API роутах в продакшене

**Проблема:** Фронтенд работает, но `/api/*` возвращает 404

**Причины и решения:**
```json
// vercel.json - НЕПРАВИЛЬНО
{
  "routes": [
    { "src": "/(.*)", "dest": "/index.html" },  // ❌ Перехватывает ВСЕ роуты
    { "src": "/api/(.*)", "dest": "api/index.py" }
  ]
}

// vercel.json - ПРАВИЛЬНО
{
  "routes": [
    { "handle": "filesystem" },                  // ✅ Сначала статические файлы
    { "src": "/api/(.*)", "dest": "api/index.py" }, // ✅ Потом API
    { "src": "/(.*)", "dest": "/index.html" }    // ✅ В конце SPA fallback
  ]
}
```

### 4. Frontend не собирается в GitHub Actions

**Проблема:** `Build command failed: npm run build`

**Причины:**
- Отсутствует `"vercel-build": "npm run build"` в scripts
- TypeScript ошибки компиляции
- Отсутствующие зависимости

**Решение:**
```json
// package.json
{
  "scripts": {
    "vercel-build": "npm run build"  // ✅ Обязательно для Vercel
  }
}
```

### 5. Python зависимости не устанавливаются

**Проблема:** `No module named 'fastapi'`

**Решение:**
- Убедиться что `requirements.txt` в корне проекта
- Проверить правильность названий и версий пакетов
- Добавить в GitHub Actions установку Python зависимостей

### 6. Статические файлы не загружаются

**Проблема:** CSS/JS файлы возвращают 404

**Причина:** Неправильный порядок routes в `vercel.json`

**Решение:** Обязательно добавить `{ "handle": "filesystem" }` первым роутом

### 7. API работает локально, но не в продакшене

**Проблема:** Локально все ОК, в Vercel API не отвечает

**Диагностика:**
```bash
# Проверить логи деплоя
npx vercel@latest inspect <deployment-url> --logs --token=$VERCEL_TOKEN

# Проверить настройки проекта
npx vercel@latest project ls --token=$VERCEL_TOKEN
```

**Частые причины:**
- Неправильная структура папок (`api/` должна быть в корне)
- Ошибки в Python коде (проверить синтаксис)
- Отсутствие ASGI точки входа

---

## 🎯 Рекомендации для продакшена

### Безопасность
```python
# api/index.py - Продакшн настройки
from fastapi.middleware.cors import CORSMiddleware
import os

# CORS только для известных доменов
allowed_origins = [
    "https://your-domain.vercel.app",
    "https://your-custom-domain.com",
]

if os.getenv("NODE_ENV") == "development":
    allowed_origins.append("http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

### Переменные окружения
```bash
# Vercel Dashboard → Project Settings → Environment Variables
# Или через CLI:
vercel env add DATABASE_URL production
vercel env add API_SECRET_KEY production
```

### Мониторинг
```python
# api/index.py - Логирование
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.get("/api/health")
def health():
    logger.info("Health check requested")
    return {"ok": True, "timestamp": datetime.now().isoformat()}
```

### Производительность
- Использовать `httpx.AsyncClient()` для внешних запросов
- Кэшировать статические данные
- Оптимизировать bundle размер React приложения

---

## 🔧 Полезные команды

```bash
# Локальная разработка
uvicorn api.index:app --reload --port 8000  # Запуск API
npm run dev                                 # Запуск фронтенда

# Vercel команды
npx vercel@latest                           # Деплой текущей версии  
npx vercel@latest --prod                    # Продакшн деплой
npx vercel@latest logs <deployment>         # Просмотр логов
npx vercel@latest rollback <deployment>     # Откат к предыдущей версии

# GitHub команды
gh run list -L 5                           # Статус последних запусков
gh run watch <run_id>                      # Отслеживание выполнения
gh secret list                             # Список секретов репозитория
```

---

## 📋 Чек-лист успешного деплоя

### Pre-deploy checklist
- [ ] `api/index.py` содержит FastAPI приложение
- [ ] `requirements.txt` содержит все Python зависимости  
- [ ] `package.json` содержит `"vercel-build"` скрипт
- [ ] `index.html` находится в корне проекта
- [ ] `vercel.json` настроен для фронт + бэк
- [ ] CORS настроен в FastAPI
- [ ] `.gitignore` исключает `node_modules/`, `dist/`, `.vercel/`

### Post-deploy checklist
- [ ] Фронтенд загружается без ошибок
- [ ] API эндпоинты отвечают корректно
- [ ] CORS не блокирует запросы
- [ ] GitHub Actions выполняется успешно
- [ ] Секреты добавлены в GitHub репозиторий

---

**Успешных деплоев! 🚀**
