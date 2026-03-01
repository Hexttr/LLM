# План реализации портала

## 1. Структура проекта

```
LM/
├── config.yaml              # LiteLLM (уже есть)
├── docker-compose.yml       # LiteLLM + Postgres (уже есть)
├── .env                     # мастер-ключ, соль (уже есть)
├── ARCHITECTURE_AND_RECOMMENDATIONS.md
├── FRONTEND_ARCHITECTURE.md
├── PLAN.md                  # этот файл
│
└── portal/                  # Next.js приложение
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx              # лендинг
    │   │   ├── register/page.tsx
    │   │   ├── login/page.tsx
    │   │   ├── dashboard/
    │   │   │   └── page.tsx           # ЛК (ключ, баланс, использование)
    │   │   └── api/
    │   │       ├── auth/
    │   │       │   ├── register/route.ts
    │   │       │   └── login/route.ts
    │   │       ├── models/route.ts    # список моделей из LiteLLM
    │   │       ├── me/route.ts        # текущий пользователь + ключ
    │   │       └── usage/route.ts     # использование по user_id из LiteLLM
    │   ├── components/
    │   │   ├── Layout/
    │   │   ├── landing/
    │   │   └── dashboard/
    │   ├── lib/
    │   │   ├── db.ts                  # Prisma client
    │   │   ├── litellm.ts             # вызовы к прокси
    │   │   ├── auth.ts                # JWT, хэш пароля
    │   │   └── env.ts
    │   └── providers.tsx             # Chakra UI
    ├── prisma/
    │   ├── schema.prisma
    │   └── migrations/
    ├── package.json
    ├── .env.local.example
    └── next.config.ts
```

---

## 2. База данных (та же Postgres, что у LiteLLM)

Подключение: `postgresql://llmproxy:dbpassword9090@localhost:5432/litellm` (с этого ПК к Docker).

### Таблица портала: `users`

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID, PK | Идентификатор; передаём в LiteLLM как `user_id` при создании ключа |
| email | string, unique | Email для входа |
| password_hash | string | bcrypt-хэш пароля |
| api_key | string, nullable | Ключ из LiteLLM (показываем в ЛК); заполняется при регистрации |
| created_at | datetime | Дата регистрации |

Миграция Prisma создаёт только эту таблицу (схема в отдельном schema без конфликта с таблицами LiteLLM).

---

## 3. API-эндпоинты

| Метод | Путь | Описание | Авторизация |
|-------|------|----------|-------------|
| POST | /api/auth/register | Регистрация: создание user в БД, вызов LiteLLM `/key/generate` с `user_id`, сохранение ключа в user | — |
| POST | /api/auth/login | Вход: проверка пароля, выдача JWT (в cookie или теле ответа) | — |
| GET | /api/models | Список моделей: проксируем `GET /model/info` от LiteLLM | — (публично для лендинга) |
| GET | /api/me | Текущий пользователь (email, id) и API-ключ для ЛК | JWT |
| GET | /api/usage | Использование (spend, данные по ключу): проксируем LiteLLM `GET /user/info?user_id=<id>` | JWT |

---

## 4. Страницы и сценарии

| Страница | Маршрут | Содержание |
|----------|---------|------------|
| Лендинг | / | Hero, блок «Модели» (данные из /api/models), CTA «Регистрация» / «Войти» |
| Регистрация | /register | Форма: email, пароль; отправка в /api/auth/register; редирект в /dashboard |
| Вход | /login | Форма: email, пароль; отправка в /api/auth/login; редирект в /dashboard |
| Личный кабинет | /dashboard | Защищённая страница: отображение API-ключа (копирование), баланс/использование из /api/usage |

Защита /dashboard: проверка JWT (middleware или getServerSideProps/серверный компонент); при отсутствии — редирект на /login.

---

## 5. Технологии

- **Next.js 14+** (App Router), **TypeScript**
- **Chakra UI** — компоненты и тема
- **Prisma** — клиент БД, миграции (одна БД с LiteLLM)
- **JWT** — сессия (библиотека: `jose` или `jsonwebtoken`)
- **bcrypt** — хэш паролей
- **Переменные окружения** — `DATABASE_URL`, `LITELLM_PROXY_URL` (http://localhost:4000), `LITELLM_MASTER_KEY`, `JWT_SECRET`

---

## 6. Порядок реализации

1. **План и структура** — PLAN.md, создание `portal/` с Next.js + Chakra UI + TS.
2. **БД** — Prisma schema, миграция `users`, подключение к существующей Postgres.
3. **Либы** — `lib/db.ts`, `lib/litellm.ts` (fetch к прокси), `lib/auth.ts` (JWT, bcrypt), `lib/env.ts`.
4. **API** — register, login, models, me, usage.
5. **Страницы** — layout (ChakraProvider, навбар), лендинг, register, login, dashboard (защита + ключ + usage).

После этого: тест на одном ПК (Docker + `npm run dev` в portal/). Тарифы и оплата — после переезда на VPS и подключения LLM.
