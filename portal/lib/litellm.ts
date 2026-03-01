const getBase = () =>
  (process.env.LITELLM_PROXY_URL || "http://localhost:4000").replace(/\/$/, "");
const getMasterKey = () => process.env.LITELLM_MASTER_KEY!;

export async function createKey(userId: string, email?: string): Promise<string> {
  const body: { user_id: string; metadata?: Record<string, string> } = { user_id: userId };
  if (email) body.metadata = { user: email, user_email: email };
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
