"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Button,
  Textarea,
  Spinner,
} from "@chakra-ui/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";

const EXAMPLE_PROMPTS = [
  "Объясни простыми словами, как работает API",
  "Напиши короткий пример кода на TypeScript",
  "Какие есть способы оптимизировать запросы к БД?",
];

const STORAGE_KEY = "portal_chat_dialogs";
const MAX_SAVED = 30;
const FOLDER_CONTEXT_MAX_CHARS = 35_000;
const TEXT_EXTENSIONS = new Set([
  ".txt", ".md", ".json", ".ts", ".tsx", ".js", ".jsx", ".css", ".html", ".xml",
  ".py", ".rb", ".go", ".rs", ".java", ".kt", ".c", ".cpp", ".h", ".cs", ".yaml", ".yml", ".env", ".sh", ".bat",
]);

interface Model {
  model_name: string;
}

interface FileContext {
  name: string;
  content: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface SavedDialog {
  id: string;
  title: string;
  model: string;
  messages: ChatMessage[];
  savedAt: number;
}

function loadSavedDialogs(): SavedDialog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDialogsToStorage(dialogs: SavedDialog[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dialogs.slice(-MAX_SAVED)));
  } catch {
    // localStorage full or disabled
  }
}

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modelFromUrl = searchParams.get("model");
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [savedDialogs, setSavedDialogs] = useState<SavedDialog[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [folderFiles, setFolderFiles] = useState<FileContext[]>([]);
  const [folderName, setFolderName] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setSavedDialogs(loadSavedDialogs());
  }, []);


  useEffect(() => {
    fetch("/api/models")
      .then((r) => r.json())
      .then((d) => {
        const list = d.models ?? [];
        setModels(list);
        const toSelect =
          modelFromUrl && list.some((m) => m.model_name === modelFromUrl)
            ? modelFromUrl
            : list.length > 0
              ? list[0].model_name
              : "";
        if (toSelect) setSelectedModel(toSelect);
      })
      .catch(() => setModels([]))
      .finally(() => setLoadingModels(false));
  }, [modelFromUrl]);

  useEffect(() => {
    if (models.length > 0 && !selectedModel) setSelectedModel(models[0].model_name);
  }, [models, selectedModel]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const buildFolderContext = (): string => {
    if (folderFiles.length === 0) return "";
    let out = "Контекст из выбранной папки (файлы для справки):\n\n";
    let total = out.length;
    for (const f of folderFiles) {
      const block = `--- ${f.name} ---\n${f.content}\n\n`;
      if (total + block.length > FOLDER_CONTEXT_MAX_CHARS) break;
      out += block;
      total += block.length;
    }
    return out;
  };

  const send = async () => {
    const text = input.trim();
    if (!text || !selectedModel) return;

    const contextBlock = buildFolderContext();
    const userContent = contextBlock ? `${contextBlock}\n--- Вопрос пользователя ---\n\n${text}` : text;

    const userMessage: ChatMessage = { role: "user", content: userContent };
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    try {
      const historyForApi = messages.map((m) => ({ role: m.role, content: m.content }));
      historyForApi.push({ role: "user", content: userContent });

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          model: selectedModel,
          messages: historyForApi,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Ошибка: ${data.error ?? res.status}` },
        ]);
        return;
      }

      const content = data.choices?.[0]?.message?.content ?? "(нет ответа)";
      setMessages((prev) => [...prev, { role: "assistant", content }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Ошибка: ${e instanceof Error ? e.message : "Сеть"}` },
      ]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  const clearChat = () => {
    if (messages.length > 0) {
      const firstUser = messages.find((m) => m.role === "user");
      const title = firstUser
        ? firstUser.content.slice(0, 40) + (firstUser.content.length > 40 ? "…" : "")
        : "Диалог";
      const newSaved: SavedDialog = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        title,
        model: selectedModel,
        messages: [...messages],
        savedAt: Date.now(),
      };
      const next = [...savedDialogs, newSaved];
      setSavedDialogs(next);
      saveDialogsToStorage(next);
    }
    setMessages([]);
  };

  const loadDialog = (d: SavedDialog) => {
    setMessages(d.messages);
    setSelectedModel(d.model);
    setShowHistory(false);
  };

  const removeSaved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = savedDialogs.filter((x) => x.id !== id);
    setSavedDialogs(next);
    saveDialogsToStorage(next);
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const readFileAsText = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result ?? ""));
      r.onerror = () => reject(new Error("Не удалось прочитать файл"));
      r.readAsText(file, "utf-8");
    });

  const onFolderSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const list: FileContext[] = [];
    let totalChars = 0;
    const basePath = files[0]?.webkitRelativePath?.split("/")[0] ?? "Папка";
    setFolderName(basePath);
    for (let i = 0; i < files.length && totalChars < FOLDER_CONTEXT_MAX_CHARS; i++) {
      const file = files[i];
      const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
      if (!TEXT_EXTENSIONS.has(ext) && ext !== "") continue;
      try {
        const content = await readFileAsText(file);
        const name = file.webkitRelativePath || file.name;
        list.push({ name, content });
        totalChars += content.length;
      } catch {
        // skip unreadable
      }
    }
    setFolderFiles(list);
    e.target.value = "";
  };

  const clearFolder = () => {
    setFolderFiles([]);
    setFolderName(null);
  };

  const openFolderPicker = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.setAttribute("webkitdirectory", "");
    input.style.display = "none";
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files?.length) onFolderSelected({ target: { files } } as React.ChangeEvent<HTMLInputElement>);
      input.remove();
    };
    document.body.appendChild(input);
    input.click();
    // Если пользователь закрыл диалог без выбора, убираем input
    setTimeout(() => input.remove(), 1000);
  };

  const checkAuth = useCallback(async () => {
    const res = await fetch("/api/me", { credentials: "include" });
    const data = await res.json();
    if (!res.ok || !data.user) {
      router.push("/login");
      return;
    }
    setAuthChecked(true);
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (!authChecked) {
    return (
      <Box minH="100vh" display="flex" flexDirection="column" bg="var(--page-bg)">
        <Navbar />
        <Flex flex="1" align="center" justify="center">
          <Spinner size="xl" color="blue.500" />
        </Flex>
      </Box>
    );
  }

  return (
    <Box
      minH="100vh"
      display="flex"
      flexDirection="column"
      bg="var(--chat-page-bg)"
      transition="background-color 0.2s ease"
    >
      <Navbar />

      <Box flex="1" display="flex" flexDirection="column" alignItems="center" w="100%" py={{ base: 4, md: 8 }} px={4}>
        <Container
          maxW="720px"
          w="100%"
          mx="auto"
          flex="1"
          display="flex"
          flexDirection="column"
          maxH="calc(100vh - 72px)"
          px={{ base: 3, md: 6 }}
        >
          {/* Заголовок и действия */}
          <Flex justify="space-between" align="center" mb={4} flexShrink={0} flexWrap="wrap" gap={3}>
            <Heading
              size="lg"
              fontSize={{ base: "1.25rem", md: "1.5rem" }}
              fontWeight="700"
              color="var(--chat-heading-color)"
              letterSpacing="-0.02em"
            >
              Чат с моделью
            </Heading>
            <Flex gap={2} flexWrap="wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowHistory((v) => !v)}
                sx={{
                  borderColor: "var(--chat-card-border)",
                  color: "var(--foreground-muted)",
                  _hover: { bg: "var(--chat-history-item-hover)", borderColor: "var(--chat-model-label)" },
                }}
              >
                {showHistory ? "Скрыть историю" : "История"}
                {savedDialogs.length > 0 && ` (${savedDialogs.length})`}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={clearChat}
                disabled={messages.length === 0}
                sx={{
                  borderColor: "var(--chat-card-border)",
                  color: "var(--foreground-muted)",
                  _hover: { bg: "var(--chat-history-item-hover)", borderColor: "var(--chat-model-label)" },
                }}
              >
                Новый диалог
              </Button>
              <Link href="/dashboard">
                <Button
                  size="sm"
                  variant="outline"
                  sx={{
                    borderColor: "var(--chat-card-border)",
                    color: "var(--foreground-muted)",
                    _hover: { bg: "var(--chat-history-item-hover)", borderColor: "var(--chat-model-label)" },
                  }}
                >
                  В кабинет
                </Button>
              </Link>
            </Flex>
          </Flex>

          {/* Блок сохранённых диалогов */}
          {showHistory && (
            <Box
              mb={4}
              p={4}
              borderRadius="12px"
              bg="var(--chat-history-bg)"
              border="1px solid var(--chat-history-border)"
              maxH="200px"
              overflowY="auto"
              transition="background-color 0.2s ease, border-color 0.2s ease"
            >
              {savedDialogs.length === 0 ? (
                <Text fontSize="sm" color="var(--chat-empty-text)">
                  Нет сохранённых диалогов. Начните чат и нажмите «Новый диалог» — текущий диалог сохранится здесь.
                </Text>
              ) : (
                <>
                  <Text fontSize="12px" fontWeight="600" color="var(--chat-empty-text)" mb={2}>
                    Нажмите на диалог, чтобы открыть
                  </Text>
                  <Flex flexDirection="column" gap={1}>
                    {[...savedDialogs].reverse().map((d) => (
                      <Flex
                        key={d.id}
                        align="center"
                        justify="space-between"
                        py={2}
                        px={3}
                        borderRadius="8px"
                        cursor="pointer"
                        onClick={() => loadDialog(d)}
                        sx={{ _hover: { bg: "var(--chat-history-item-hover)" } }}
                      >
                        <Box flex={1} minW={0}>
                          <Text fontSize="14px" fontWeight="500" noOfLines={1} color="var(--foreground)">
                            {d.title}
                          </Text>
                          <Text fontSize="11px" color="var(--foreground-subtle)">
                            {d.model} · {formatDate(d.savedAt)}
                          </Text>
                        </Box>
                        <Button
                          size="xs"
                          variant="ghost"
                          color="var(--foreground-subtle)"
                          onClick={(e) => removeSaved(d.id, e)}
                          title="Удалить"
                        >
                          ×
                        </Button>
                      </Flex>
                    ))}
                  </Flex>
                </>
              )}
            </Box>
          )}

          {/* Карточка чата */}
          <Box
            flex="1"
            display="flex"
            flexDirection="column"
            minH={0}
            borderRadius="16px"
            bg="var(--chat-card-bg)"
            border="1px solid var(--chat-card-border)"
            boxShadow="var(--chat-card-shadow)"
            overflow="hidden"
            transition="background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease"
          >
            {/* Выбор модели и папки */}
            <Flex
              p={4}
              borderBottom="1px solid var(--chat-card-border)"
              gap={4}
              align="center"
              flexShrink={0}
              flexWrap="wrap"
            >
              <Text fontSize="14px" fontWeight="600" color="var(--chat-model-label)">
                Модель
              </Text>
              {loadingModels ? (
                <Spinner size="sm" color="blue.500" />
              ) : (
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  aria-label="Выберите модель"
                  style={{
                    minWidth: "200px",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--chat-input-border)",
                    background: "var(--chat-input-bg)",
                    color: "var(--foreground)",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  {models.map((m) => (
                    <option key={m.model_name} value={m.model_name}>
                      {m.model_name}
                    </option>
                  ))}
                </select>
              )}
              <Box flex="1" minW={0} />
              {folderFiles.length === 0 ? (
                <Flex align="center" gap={2} flexWrap="wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={openFolderPicker}
                    sx={{
                      borderColor: "var(--chat-card-border)",
                      color: "var(--foreground-muted)",
                      _hover: { bg: "var(--chat-history-item-hover)", borderColor: "var(--chat-model-label)" },
                    }}
                  >
                    Выбрать папку для контекста
                  </Button>
                  <Text fontSize="11px" color="var(--foreground-subtle)" whiteSpace="nowrap" title="В диалоге выберите папку (не файл) и нажмите «Открыть»">
                    (папку → «Открыть»)
                  </Text>
                </Flex>
              ) : (
                <Flex align="center" gap={2} flexWrap="wrap">
                  <Text fontSize="13px" color="var(--foreground-muted)">
                    Папка: {folderName}, {folderFiles.length} файлов
                  </Text>
                  <Button size="xs" variant="ghost" color="var(--foreground-subtle)" onClick={clearFolder}>
                    Очистить
                  </Button>
                </Flex>
              )}
            </Flex>

            {/* Лента сообщений */}
            <Box
              flex="1"
              overflowY="auto"
              p={5}
              display="flex"
              flexDirection="column"
              gap={4}
            >
              {messages.length === 0 && !loading && (
                <Flex flexDirection="column" align="center" justify="center" py={12} textAlign="center">
                  <Text color="var(--chat-empty-text)" fontSize="15px" mb={5} maxW="340px" lineHeight="1.6">
                    Напишите сообщение — диалог сохраняет контекст. При «Новый диалог» текущий чат попадёт в сохранённые.
                  </Text>
                  <Flex flexWrap="wrap" gap={2} justify="center">
                    {EXAMPLE_PROMPTS.map((prompt) => (
                      <Button
                        key={prompt}
                        size="sm"
                        variant="outline"
                        onClick={() => setInput(prompt)}
                        sx={{
                          bg: "var(--chat-prompt-btn-bg)",
                          borderColor: "var(--chat-prompt-btn-border)",
                          color: "var(--chat-prompt-btn-color)",
                          fontWeight: "500",
                          fontSize: "13px",
                          _hover: {
                            bg: "var(--chat-prompt-btn-hover-bg)",
                            borderColor: "var(--chat-model-label)",
                          },
                        }}
                      >
                        {prompt}
                      </Button>
                    ))}
                  </Flex>
                </Flex>
              )}

              {messages.map((msg, i) => {
                const isError = msg.role === "assistant" && msg.content.startsWith("Ошибка:");
                const isUser = msg.role === "user";
                return (
                  <Box
                    key={i}
                    alignSelf={isUser ? "flex-end" : "flex-start"}
                    maxW="88%"
                    px={4}
                    py={3}
                    borderRadius="14px"
                    fontSize="15px"
                    lineHeight="1.6"
                    whiteSpace="pre-wrap"
                    border="1px solid"
                    boxShadow="0 1px 3px rgba(0,0,0,0.08)"
                    style={{
                      backgroundColor: isUser
                        ? "var(--chat-bubble-user-bg)"
                        : isError
                          ? "var(--chat-bubble-error-bg)"
                          : "var(--chat-bubble-assistant-bg)",
                      color: isUser
                        ? "var(--chat-bubble-user-color)"
                        : isError
                          ? "var(--chat-bubble-error-color)"
                          : "var(--chat-bubble-assistant-color)",
                      borderColor: isError
                        ? "var(--chat-bubble-error-border)"
                        : isUser
                          ? "var(--chat-bubble-user-border)"
                          : "var(--chat-bubble-assistant-border)",
                    }}
                  >
                    <Text fontSize="11px" fontWeight="600" opacity={0.9} mb={1.5}>
                      {isUser ? "Вы" : "Модель"}
                    </Text>
                    {msg.content}
                  </Box>
                );
              })}

              {loading && (
                <Flex
                  alignSelf="flex-start"
                  align="center"
                  gap={2}
                  px={4}
                  py={3}
                  borderRadius="14px"
                  bg="var(--chat-loading-bg)"
                  color="var(--chat-loading-color)"
                  fontSize="14px"
                >
                  <Spinner size="sm" color="blue.500" />
                  <Text as="span">Модель печатает</Text>
                </Flex>
              )}
              <div ref={bottomRef} />
            </Box>

            {/* Поле ввода */}
            <Box
              p={4}
              borderTop="1px solid var(--chat-card-border)"
              flexShrink={0}
              bg="var(--chat-card-bg)"
              transition="background-color 0.2s ease, border-color 0.2s ease"
            >
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Сообщение... (Enter — отправить, Shift+Enter — новая строка)"
                minH="96px"
                mb={3}
                borderRadius="12px"
                padding="14px 18px"
                fontSize="16px"
                resize="none"
                aria-label="Введите сообщение"
                sx={{
                  bg: "var(--chat-input-bg)",
                  border: "1px solid var(--chat-input-border)",
                  color: "var(--foreground)",
                  _placeholder: { color: "var(--chat-input-placeholder)" },
                  _focus: {
                    borderColor: "var(--input-focus-border)",
                    boxShadow: "0 0 0 3px var(--input-focus-ring)",
                  },
                }}
              />
              <Button
                onClick={send}
                colorScheme="blue"
                size="lg"
                loading={loading}
                disabled={!input.trim() || !selectedModel}
                borderRadius="10px"
                fontWeight="600"
                fontSize="15px"
                px={8}
              >
                Отправить
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
