# Как пользоваться API (для зарегистрированных пользователей)

## 1. Получить ключ

1. Войдите на портал: http://localhost:3000 (или ваш домен).
2. Откройте **Личный кабинет** (Dashboard).
3. Скопируйте **API-ключ** (кнопка «Копировать»).

Этот ключ нужен для всех запросов к прокси.

---

## 2. Базовый URL прокси

- **Локально:** `http://localhost:4000`
- **На VPS:** ваш домен прокси, например `https://api.ваш-сервис.ru`

Все запросы идут на этот адрес с заголовком:

```
Authorization: Bearer ВАШ_КЛЮЧ
```

---

## 3. Модели Groq (бесплатный tier)

Доступные имена моделей в запросах:

| model в запросе   | Описание                    |
|-------------------|-----------------------------|
| `groq-llama`      | Llama 3.1 8B (быстрая)      |
| `groq-llama-70b`  | Llama 3.1 70B (мощнее)      |

---

## 4. Пример: чат (curl)

```bash
curl -X POST "http://localhost:4000/chat/completions" ^
  -H "Authorization: Bearer ВАШ_КЛЮЧ_ИЗ_КАБИНЕТА" ^
  -H "Content-Type: application/json" ^
  -d "{\"model\": \"groq-llama\", \"messages\": [{\"role\": \"user\", \"content\": \"Привет, как дела?\"}]}"
```

В ответе будет поле `choices[0].message.content` с текстом от модели.

---

## 5. Пример: Python

```python
import requests

url = "http://localhost:4000/chat/completions"
headers = {
    "Authorization": "Bearer ВАШ_КЛЮЧ_ИЗ_КАБИНЕТА",
    "Content-Type": "application/json"
}
data = {
    "model": "groq-llama",
    "messages": [{"role": "user", "content": "Напиши короткое стихотворение"}]
}

r = requests.post(url, json=data, headers=headers)
print(r.json()["choices"][0]["message"]["content"])
```

---

## 6. Совместимость с OpenAI SDK

Прокси совместим с API OpenAI. Можно указать базовый URL прокси и использовать свой ключ:

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:4000/v1",  # без /v1 для некоторых SDK
    api_key="ВАШ_КЛЮЧ_ИЗ_КАБИНЕТА"
)

response = client.chat.completions.create(
    model="groq-llama",
    messages=[{"role": "user", "content": "Привет!"}]
)
print(response.choices[0].message.content)
```

---

## 7. Другие модели

В личном кабинете и на лендинге отображается актуальный список моделей. Имя из списка подставляйте в поле `model` в запросе.
