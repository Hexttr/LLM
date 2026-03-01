# Список API для подключения всех моделей

По текущему `config.yaml` и каталогу `portal/data/model-tiers.json` ниже перечислены провайдеры и переменные окружения. Добавьте нужные ключи в `.env` в корне проекта и при необходимости раскомментируйте/добавьте модели в `config.yaml`.

---

## Уже подключены в config.yaml

| Провайдер | Переменная в .env | Где взять ключ | Модели в каталоге |
|-----------|-------------------|----------------|--------------------|
| **Groq** | `GROQ_API_KEY` | https://console.groq.com (бесплатный tier) | Llama 3.1 8B/70B, Mixtral 8x7B, Gemma 2 |

---

## Нужно зарегистрировать и добавить в .env

### Текстовые модели (чат)

| № | Провайдер | Переменная в .env | Где зарегистрироваться | Модели из каталога |
|---|------------|-------------------|------------------------|--------------------|
| 1 | **OpenAI** | `OPENAI_API_KEY` | https://platform.openai.com/api-keys | GPT-4o mini, GPT-4.1-mini, GPT-4.1, GPT-5, o3/o4 |
| 2 | **Anthropic** | `ANTHROPIC_API_KEY` | https://console.anthropic.com | Claude Haiku 4.5, Claude Sonnet 4.x/4.6, Claude Opus 4.5/4.6 |
| 3 | **Google (Gemini)** | `GEMINI_API_KEY` или `GOOGLE_API_KEY` | https://aistudio.google.com/apikey | Gemini 2.0 Flash, 2.5 Flash-Lite, 2.5 Flash, 2.5 Pro, Gemini 3.x Pro |
| 4 | **DeepSeek** | `DEEPSEEK_API_KEY` | https://platform.deepseek.com | DeepSeek V3, R1 |
| 5 | **Mistral** | `MISTRAL_API_KEY` | https://console.mistral.ai | Mistral Medium, Large |
| 6 | **Together** | `TOGETHER_API_KEY` | https://api.together.xyz | Llama 3.1 70B и др. |
| 7 | **Fireworks** | `FIREWORKS_API_KEY` | https://fireworks.ai | Llama 3.1 70B и др. |
| 8 | **Cloudflare Workers AI** | `CLOUDFLARE_API_KEY` + Account ID | https://dash.cloudflare.com (Workers AI) | Llama 3.x, Mistral 7B, Qwen |
| 9 | **Hugging Face** | `HF_TOKEN` | https://huggingface.co/settings/tokens | Модели из каталога HF (инференс через Inference API) |

### Генерация изображений

| № | Провайдер | Переменная в .env | Где зарегистрироваться | Модели из каталога |
|---|------------|-------------------|------------------------|--------------------|
| 10 | **OpenAI** | `OPENAI_API_KEY` (тот же) | см. выше | DALL·E 2, DALL·E 3, GPT Image 1 |
| 11 | **Google** | `GOOGLE_API_KEY` | https://aistudio.google.com или Google Cloud | Imagen 3 |
| 12 | **Replicate** | `REPLICATE_API_TOKEN` | https://replicate.com/account/api-tokens | FLUX Schnell, FLUX Pro/Dev |
| 13 | **Fal** | `FAL_KEY` | https://fal.ai/dashboard/keys | FLUX Schnell, FLUX Pro/Dev |
| 14 | **Recraft** | `RECRAFT_API_KEY` | https://recraft.ai | Recraft v3 |

---

## Итоговый список переменных для .env

Скопируйте в `.env` и подставьте свои ключи:

```env
# Обязательно (уже есть)
LITELLM_MASTER_KEY=sk-...
LITELLM_SALT_KEY=sk-...

# Текстовые модели
GROQ_API_KEY=gsk_...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...              # или GOOGLE_API_KEY для Gemini/Imagen
DEEPSEEK_API_KEY=sk-...
MISTRAL_API_KEY=...
TOGETHER_API_KEY=...
FIREWORKS_API_KEY=...
CLOUDFLARE_API_KEY=...           # для Workers AI
HF_TOKEN=hf_...

# Изображения
REPLICATE_API_TOKEN=r8_...
FAL_KEY=...
RECRAFT_API_KEY=...
```

---

## Что сделать после добавления ключей

1. Добавить или раскомментировать нужные модели в `config.yaml` (формат см. в текущем config и в [документации LiteLLM](https://docs.litellm.ai/docs/proxy/configs)).
2. Перезапустить LiteLLM:  
   `docker compose up -d --force-recreate litellm`
3. Список моделей в чате портала подтягивается из LiteLLM (`/model/info`), поэтому после обновления config новые модели появятся автоматически.

Каталог в `portal/data/model-tiers.json` — это описание тарифов для лендинга; реально доступные модели определяются только тем, что включено в `config.yaml` и для чего заданы ключи в `.env`.
