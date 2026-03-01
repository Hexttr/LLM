# LLM — сервис доступа к LLM на базе LiteLLM Proxy

Единый API для доступа к разным языковым моделям с виртуальными ключами, лимитами и учётом использования. Подробная архитектура и рекомендации — в [ARCHITECTURE_AND_RECOMMENDATIONS.md](ARCHITECTURE_AND_RECOMMENDATIONS.md).

## Требования

- [Docker](https://docs.docker.com/get-docker/) и Docker Compose
- (Опционально) Ключи API провайдеров (OpenAI, Anthropic и т.д.) для реальных моделей

## Быстрый старт на этом ПК

1. **Клонировать и перейти в каталог**
   ```bash
   cd LM
   ```

2. **Создать `.env` из примера и задать мастер-ключ**
   ```bash
   cp .env.example .env
   # Отредактируйте .env: задайте LITELLM_MASTER_KEY (и при необходимости ключи провайдеров)
   ```

3. **Запустить сервисы**
   ```bash
   docker compose up -d
   ```

4. **Проверить работу**
   - Прокси: http://localhost:4000  
   - Документация API: http://localhost:4000/docs  
   - Health: http://localhost:4000/health/liveliness  

5. **Создать ключ для клиента** (с мастер-ключом из `.env`)
   ```bash
   curl -X POST "http://localhost:4000/key/generate" \
     -H "Authorization: Bearer sk-your-master-key-change-me" \
     -H "Content-Type: application/json" \
     -d "{}"
   ```

6. **Запрос к модели** (подставьте выданный ключ и имя модели из `config.yaml`)
   ```bash
   curl -X POST "http://localhost:4000/chat/completions" \
     -H "Authorization: Bearer <ваш-ключ>" \
     -H "Content-Type: application/json" \
     -d '{"model": "echo", "messages": [{"role": "user", "content": "Hello"}]}'
   ```

## Портал (лендинг + регистрация + ЛК)

В каталоге `portal/` — Next.js приложение: лендинг со списком моделей, регистрация, вход, личный кабинет (API-ключ, использование).

**Запуск портала (после того как Docker с LiteLLM и Postgres уже запущен):**

```bash
cd portal
cp .env.local.example .env.local   # при необходимости отредактировать
npx prisma migrate deploy          # один раз: создать таблицу users в БД
npm install
npm run dev
```

Портал: http://localhost:3000. Подробнее — [portal/README.md](portal/README.md).

## Структура проекта

| Файл / каталог | Назначение |
|----------------|------------|
| `config.yaml` | Модели, лимиты и настройки LiteLLM Proxy |
| `docker-compose.yml` | LiteLLM + Postgres для локального запуска |
| `.env.example` | Шаблон переменных окружения (копировать в `.env`) |
| `portal/` | Next.js портал: лендинг, регистрация, ЛК |
| `ARCHITECTURE_AND_RECOMMENDATIONS.md` | Архитектура, сравнение с OpenRouter, хостинг |
| `PLAN.md` | План реализации портала |

## Добавление моделей

Отредактируйте `config.yaml`: в `model_list` добавьте блок с `model_name` и `litellm_params` (модель провайдера и `api_key` из окружения). Примеры закомментированы в конфиге. После изменений перезапустите:

```bash
docker compose up -d --force-recreate litellm
```

## Остановка

```bash
docker compose down
```

Данные Postgres сохраняются в volume `postgres_data`.
