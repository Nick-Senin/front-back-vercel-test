## React + Vite → Vercel: автодеплой из GitHub

Ниже — пошаговая инструкция, как с нуля создать фронтенд на React + Vite, развернуть на Vercel и включить автодеплой при каждом пуше в `main`.

### 1) Структура проекта
- `frontend/` — проект Vite (React + TS)
- `frontend/vercel.json` — конфигурация сборки/роутов для Vercel (static build)
- `.github/workflows/vercel-deploy.yml` — GitHub Actions для деплоя

Минимальный набор файлов:

```json
// frontend/package.json (фрагмент)
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "vercel-build": "npm run build"
  }
}
```

```json
// frontend/vercel.json
{
  "builds": [
    { "src": "package.json", "use": "@vercel/static-build", "config": { "distDir": "dist" } }
  ],
  "routes": [
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

```yaml
# .github/workflows/vercel-deploy.yml (для фронтенда в подкаталоге frontend)
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
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Vercel CLI
        run: npm i -g vercel@latest

      - name: Pull Vercel env
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

      - name: Install deps
        run: npm ci

      - name: Build
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

### 2) Предусловия
- Аккаунты: GitHub, Vercel
- Локально: `git`, `node/npm`, `gh` (GitHub CLI)
- Токены:
  - `VERCEL_TOKEN` — Vercel → Account → Tokens

Установка CLI (macOS, пример):
```bash
brew install gh
# vercel без глобальной установки: npx -y vercel@latest <cmd>
```

---

### 3) Создание фронтенда
```bash
mkdir -p frontend
cd frontend
npm create vite@latest . -- --template react-ts
npm install

# локальная разработка
npm run dev

# локальная сборка
npm run build
```

---

### 4) Репозиторий GitHub
```bash
git init
git add .
git commit -m "chore: init react+vite frontend"

gh auth login
gh repo create <owner>/<repo> --public --source=. --remote=origin --push
```

---

### 5) Привязка к Vercel (CLI) и получение ID
```bash
export VERCEL_TOKEN=...  # токен Vercel в текущей сессии

# в каталоге frontend
cd frontend
npx -y vercel@latest link --project frontend --yes --token=$VERCEL_TOKEN
npx -y vercel@latest pull --environment=production --yes --token=$VERCEL_TOKEN

# считать идентификаторы
PROJECT_ID=$(node -p "require('./.vercel/project.json').projectId")
ORG_ID=$(node -p "require('./.vercel/project.json').orgId")
```

---

### 6) GitHub Secrets для автодеплоя
```bash
cd ..  # в корень репозитория
gh secret set VERCEL_TOKEN --body "$VERCEL_TOKEN"
gh secret set VERCEL_PROJECT_ID --body "$PROJECT_ID"
gh secret set VERCEL_ORG_ID --body "$ORG_ID"
```
После этого каждый пуш в `main` будет запускать workflow и деплоить на Vercel.

Запуск вручную:
```bash
gh workflow run vercel-deploy.yml
gh run list -L 3
gh run watch <run_id> -i 3
```

---

### 7) Постоянная подгрузка VERCEL_TOKEN (без ввода каждый раз)
- Вход в CLI (сохраняет сессию):
```bash
npx -y vercel@latest login
```

- Глобально для неинтерактивных шеллов (zsh):
```bash
echo 'export VERCEL_TOKEN=...' >> ~/.zshenv
exec zsh -l
```

- Только в каталоге проекта (direnv):
```bash
brew install direnv
echo 'eval "$(direnv hook zsh)"' >> ~/.zshrc && source ~/.zshrc
echo 'export VERCEL_TOKEN=...' > <корень-репо>/.envrc
direnv allow <корень-репо>
```

---

### 8) Частые ошибки и решения (frontend)
- Пустая страница, ошибка MIME: «Expected a JavaScript module script...» — добавьте в `frontend/vercel.json` правило `{"handle":"filesystem"}` перед SPA-фоллбеком на `/index.html` (см. пример выше).
- 401 / страница `Authentication Required` — см. раздел про Deployment Protection выше.
- `npm i -g vercel` → EACCES — используйте `npx -y vercel@latest <cmd>`.

---

### 9) Быстрый цикл разработки
- Правки → Commit → Push в `main` — GitHub Actions запускает деплой на Vercel.
- Для немедленного деплоя из терминала:
```bash
cd frontend
npx -y vercel@latest --prod --yes --token=$VERCEL_TOKEN
```