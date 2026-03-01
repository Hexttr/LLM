const getBase = () =>
  (process.env.LITELLM_PROXY_URL || "http://localhost:4000").replace(/\/$/, "");
const getMasterKey = () => process.env.LITELLM_MASTER_KEY!;

export interface CreateKeyOptions {
  email?: string;
  /** Лимит бюджета в USD на ключ (например 0.5 для бесплатного тира) */
  maxBudget?: number;
  /** Запросов в минуту на ключ */
  rpmLimit?: number;
  /** Токенов в минуту на ключ */
  tpmLimit?: number;
  /** На какой период бюджет (например "30d", "1h") */
  budgetDuration?: string;
}

export async function createKey(userId: string, options: CreateKeyOptions = {}): Promise<string> {
  const body: Record<string, unknown> = { user_id: userId };
  if (options.email) body.metadata = { user: options.email, user_email: options.email };
  if (options.maxBudget != null) body.max_budget = options.maxBudget;
  if (options.rpmLimit != null) body.rpm_limit = options.rpmLimit;
  if (options.tpmLimit != null) body.tpm_limit = options.tpmLimit;
  if (options.budgetDuration) body.budget_duration = options.budgetDuration;

  const res = await fetch(`${getBase()}/key/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getMasterKey()}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LiteLLM key/generate failed: ${res.status} ${err}`);
  }
  const data = (await res.json()) as { key?: string };
  if (!data.key) throw new Error("LiteLLM did not return key");
  return data.key;
}

export async function getModelInfo(): Promise<{ model_name: string }[]> {
  const res = await fetch(`${getBase()}/model/info`, {
    headers: { Authorization: `Bearer ${getMasterKey()}` },
  });
  if (!res.ok) throw new Error(`LiteLLM model/info failed: ${res.status}`);
  const data = (await res.json()) as { data?: { model_name: string }[] };
  return data.data ?? [];
}

export async function getUserInfo(userId: string): Promise<{
  spend?: number;
  keys?: { key?: string; spend?: number }[];
}> {
  const url = new URL(`${getBase()}/user/info`);
  url.searchParams.set("user_id", userId);
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${getMasterKey()}` },
  });
  if (!res.ok) {
    if (res.status === 404) return {};
    throw new Error(`LiteLLM user/info failed: ${res.status}`);
  }
  return (await res.json()) as { spend?: number; keys?: { key?: string; spend?: number }[] };
}

/** Вызов chat/completions от имени пользователя (с его API-ключом) */
export async function chatWithUserKey(apiKey: string, body: { model: string; messages: { role: string; content: string }[] }) {
  const res = await fetch(`${getBase()}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LiteLLM chat failed: ${res.status} ${err}`);
  }
  return res.json() as Promise<{ choices?: { message?: { content?: string } }[] }>;
}
