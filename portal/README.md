# Портал — лендинг, регистрация, ЛК

Next.js + Chakra UI + TypeScript. Работает с LiteLLM Proxy на этом ПК.

## Требования

- Node.js 18+
- Запущенные Docker-контейнеры (LiteLLM + Postgres) из корня проекта: `docker compose up -d`
- При первом запуске — применить миграцию БД (см. ниже)

## Настройка

1. Скопировать переменные окружения:
   ```bash
   cp .env.local.example .env.local
   ```
2. В `.env.local` задать (или оставить по умолчанию для локального запуска):
   - `DATABASE_URL` — та же Postgres, что у LiteLLM
   - `JWT_SECRET` — любая строка для подписи JWT
   - `LITELLM_PROXY_URL` — http://localhost:4000
   - `LITELLM_MASTER_KEY` — мастер-ключ из корневого `.env`

3. Применить миграцию (таблица `users` в БД LiteLLM):
   ```bash
   npx prisma migrate deploy
   ```
   Если миграция ещё не применялась, один раз:
   ```bash
   npx prisma migrate dev --name init_users
   ```
   (при этом БД должна быть доступна: Docker с Postgres запущен.)

## Запуск

```bash
npm install
npm run dev
```

Портал: http://localhost:3000

- **/** — лендинг, список моделей из прокси
- **/register** — регистрация (сразу создаётся API-ключ в LiteLLM)
- **/login** — вход
- **/dashboard** — личный кабинет (ключ, использование)

## Сборка

```bash
npm run build
npm start
```
