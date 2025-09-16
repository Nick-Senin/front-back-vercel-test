## FastAPI → Vercel: мгновенный деплой из Cursor через GitHub

Ниже — полный сценарий, как развернуть FastAPI на Vercel, настроить автодеплой из Cursor через GitHub и быстро отлаживать. Указаны типовые ошибки и их решения.

### Используемые технологии
- **FastAPI** (Python, ASGI)
- **Vercel** (Serverless Functions, `@vercel/python`)
- **Vercel CLI** (`npx vercel`)
- **GitHub** + **GitHub Actions**
- **gh (GitHub CLI)** — удобное управление секретами/репозиторием
- **httpx** — пример внешнего запроса в эндпоинте

---

## 1) Структура проекта
- `api/index.py` — точка входа FastAPI (серверлесс функция)
- `requirements.txt` — зависимости Python
- `vercel.json` — конфиг Vercel (builder `@vercel/python` и роуты)
- `.github/workflows/vercel-deploy.yml` — автодеплой из GitHub Actions

Пример содержимого:

```python
# api/index.py
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import httpx

app = FastAPI(title="FastAPI on Vercel")

@app.get("/")
def root():
    return {"status": "ok", "message": "FastAPI on Vercel", "source": "serverless"}

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/echo")
async def echo(request: Request):
    try:
        data = await request.json()
    except Exception:
        data = None
    return JSONResponse(content={"received": data})

@app.get("/weather/omsk")
async def weather_omsk():
    latitude = 54.9914
    longitude = 73.3645
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
        "timezone": "auto",
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
    except Exception as exc:
        return JSONResponse(status_code=502, content={"error": "weather_fetch_failed", "detail": str(exc)})

    return {
        "city": "Omsk",
        "coordinates": {"latitude": latitude, "longitude": longitude},
        "current": data.get("current"),
        "meta": {"source": "open-meteo.com"},
    }
```

```txt
# requirements.txt
fastapi==0.112.2
uvicorn==0.30.6
httpx==0.27.2
```

```json
// vercel.json — корректный конфиг для Python на Vercel
{
  "builds": [
    { "src": "api/index.py", "use": "@vercel/python" }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "api/index.py" }
  ]
}
```

```yaml
# .github/workflows/vercel-deploy.yml
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

      - name: Install deps (optional)
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

---

## 2) Предусловия
- Аккаунты: GitHub, Vercel
- Локально: `git`, `Python 3.11+`, `node/npm`, `gh` (GitHub CLI)
- Токены:
  - `VERCEL_TOKEN` — в Vercel → Account → Tokens
  - (опц.) `GH_TOKEN` — если создаёте репозиторий через CLI

Установка CLI (macOS, пример):
```bash
brew install gh
# vercel без глобальной установки: npx -y vercel@latest <cmd>
```

---

## 3) Локальная проверка
```bash
pip install -r requirements.txt
uvicorn api.index:app --reload --port 8000
# http://localhost:8000/health
```

---

## 4) Создание репозитория (вариант через CLI)
```bash
git init
git add .
git commit -m "chore: initial FastAPI + Vercel setup"

gh auth login   # или экспорт GH_TOKEN
gh repo create <owner>/<repo> --public --source=. --remote=origin --push
```

Если глобальная установка `vercel` даёт EACCES, используйте `npx`.

---

## 5) Линк проекта к Vercel и первый деплой через CLI
```bash
export VERCEL_TOKEN=...  # токен Vercel в текущей сессии

npx -y vercel@latest link --project fastapi-vercel --yes --token=$VERCEL_TOKEN
npx -y vercel@latest pull --environment=production --yes --token=$VERCEL_TOKEN

# Вариант 1: облачный билд и деплой
npx -y vercel@latest --prod --yes --token=$VERCEL_TOKEN

# Вариант 2: prebuilt деплой
npx -y vercel@latest build --prod --token=$VERCEL_TOKEN
npx -y vercel@latest deploy --prebuilt --prod --token=$VERCEL_TOKEN
```

После `vercel pull` появится `.vercel/project.json` с `projectId` и `orgId`.

---

## 6) Автодеплой из Cursor через GitHub
1) Добавьте в репозиторий секреты (Settings → Secrets and variables → Actions):
   - `VERCEL_TOKEN`
   - `VERCEL_PROJECT_ID` (из `.vercel/project.json` → `projectId`)
   - `VERCEL_ORG_ID` (из `.vercel/project.json` → `orgId`)

   Через CLI:
   ```bash
   gh secret set VERCEL_TOKEN --body "$VERCEL_TOKEN"
   gh secret set VERCEL_PROJECT_ID --body prj_xxx
   gh secret set VERCEL_ORG_ID --body team_xxx
   ```

2) Убедитесь, что файл `.github/workflows/vercel-deploy.yml` в репозитории.

3) Коммит из Cursor → Push в `main` → GitHub Actions запустит деплой на Vercel.

Проверка статуса:
```bash
gh run list -L 3
gh run watch <run_id> -i 3
```

---

## 7) Частые ошибки и решения
- **Error: Function Runtimes must have a valid version, e.g. `now-php@1.0.0`.**
  - Причина: некорректный `vercel.json` (использован старый `functions.runtime`).
  - Решение: используйте блок `builds` с `@vercel/python`, как в примере выше.

- **`npm i -g vercel` → EACCES (permission denied).**
  - Причина: недостаточно прав на запись в глобальные директории `npm`.
  - Решение: используйте `npx -y vercel@latest <command>` или установите с `sudo`.

- **`gh repo create` просит авторизацию / нет `GH_TOKEN`.**
  - Решение: `gh auth login` или экспортируйте `GH_TOKEN` с правами `repo`.

- **Vercel CLI: нельзя привязать GitHub репозиторий к проекту.**
  - Решение: убедитесь, что репозиторий существует и дана авторизация Vercel к вашему GitHub. При необходимости привяжите репозиторий через Vercel UI (Project → Git Integration).

- **401 / страница `Authentication Required` при обращении к прод-URL.**
  - Причина: включён Deployment Protection.
  - Решения:
    - Временно отключить Protection (Project Settings → Deployment Protection → Production).
    - Использовать bypass-токен (`x-vercel-protection-bypass`) согласно доке Vercel (`https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation`).
    - Диагностировать через CLI: `npx vercel inspect <deployment> --logs --token=$VERCEL_TOKEN`.

- **HTTP-запросы из функции (например, `httpx`) падают по таймауту.**
  - Решение: увеличьте таймаут клиента, проверьте сеть/эндпоинт, обрабатывайте исключения (как в примере — 502 с деталями).

---

## 8) Быстрый цикл разработки
- В Cursor правите код → Commit → Push в `main` → Actions деплоит на Vercel.
- Для немедленного деплоя без пуша — используйте CLI из терминала:
  ```bash
  npx -y vercel@latest --prod --yes --token=$VERCEL_TOKEN
  ```

---

## 9) Полезные команды
```bash
# Логи деплоя/функций
npx -y vercel@latest inspect <deployment-url> --logs --token=$VERCEL_TOKEN

# Перевыкат последнего деплоя
npx -y vercel@latest redeploy <deployment-url> --token=$VERCEL_TOKEN

# Локальный запуск
uvicorn api.index:app --reload --port 8000
```

---

## 10) Безопасность
- Не коммитьте `.vercel/*` (кроме `project.json`, он безопасен; но лучше держать в `.gitignore`, Vercel CLI сам управляет).
- Храните токены только в GitHub Secrets и локальном окружении, не в коде.
- Для команд CLI всегда передавайте `--token=$VERCEL_TOKEN` в автоматизированных сценариях.


---
