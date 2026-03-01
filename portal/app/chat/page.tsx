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
import { useTheme } from "@/lib/theme-context";

const iconSize = 18;
const iconStyle = { width: iconSize, height: iconSize, flexShrink: 0 };

function IconHistory() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={iconStyle}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}
function IconNew() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={iconStyle}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function IconPaperclip() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={iconStyle}>
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

const SUGGESTION_CARDS = [
  { icon: "💡", title: "Объяснение", prompt: "Объясни простыми словами, как работает API" },
  { icon: "</>", title: "Код", prompt: "Напиши короткий пример кода на TypeScript" },
  { icon: "🗄", title: "Оптимизация", prompt: "Как оптимизировать запросы к БД?" },
  { icon: "📄", title: "Краткое содержание", prompt: "Выдели главное в этом тексте" },
  { icon: "🌐", title: "Перевод", prompt: "Переведи этот текст на английский" },
];

const STORAGE_KEY = "portal_chat_dialogs";
const MAX_SAVED = 30;
const ATTACHED_MAX_CHARS = 35_000;
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
  const [attachedFiles, setAttachedFiles] = useState<FileContext[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { theme, setTheme } = useTheme();
  const [modelSelectOpen, setModelSelectOpen] = useState(false);

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

  const buildAttachedContext = (): string => {
    if (attachedFiles.length === 0) return "";
    let out = "Контекст из прикреплённых файлов:\n\n";
    let total = out.length;
    for (const f of attachedFiles) {
      const block = `--- ${f.name} ---\n${f.content}\n\n`;
      if (total + block.length > ATTACHED_MAX_CHARS) break;
      out += block;
      total += block.length;
    }
    return out;
  };

  const send = async () => {
    const text = input.trim();
    if (!text || !selectedModel) return;

    const contextBlock = buildAttachedContext();
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
      setAttachedFiles([]);
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

  const processDroppedFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const list: FileContext[] = [];
    let totalChars = 0;
    for (let i = 0; i < files.length && totalChars < ATTACHED_MAX_CHARS; i++) {
      const file = files[i];
      const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
      if (!TEXT_EXTENSIONS.has(ext) && ext !== "") continue;
      try {
        const content = await readFileAsText(file);
        list.push({ name: file.name, content });
        totalChars += content.length;
      } catch {
        // skip unreadable
      }
    }
    setAttachedFiles((prev) => (list.length ? [...prev, ...list] : prev));
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    processDroppedFiles(e.dataTransfer.files);
  };

  const clearAttached = () => setAttachedFiles([]);

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

  const displayModelName = selectedModel ? (selectedModel.replace(/^groq-/, "").replace(/-/g, " ") || selectedModel) : "";
  const providerLabel = selectedModel?.startsWith("groq") ? "Groq" : "Модель";

  return (
    <Box
      minH="100vh"
      display="flex"
      flexDirection="column"
      bg="var(--chat-page-bg)"
      transition="background-color 0.2s ease"
    >
      <Navbar />

      {/* Вторичная шапка: ⚡ 21day.club Чат | ссылки */}
      <Box borderBottom="1px solid var(--chat-card-border)" bg="var(--chat-card-bg)" py={2.5} px={4} flexShrink={0}>
        <Flex maxW="900px" mx="auto" justify="space-between" align="center" flexWrap="wrap" gap={3}>
          <Flex align="center" gap={2}>
            <Box as="span" fontSize="18px" color="#2563eb">⚡</Box>
            <Text fontWeight="600" fontSize="15px" color="var(--foreground)">21day.club Чат</Text>
          </Flex>
          <Flex align="center" gap={4} color="var(--foreground-muted)" fontSize="14px">
            <Box
              as="button"
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              display="inline-flex"
              alignItems="center"
              gap={1.5}
              sx={{ _hover: { color: "var(--foreground)" } }}
            >
              <IconHistory />
              <span>История{savedDialogs.length > 0 ? ` ${savedDialogs.length}` : ""}</span>
            </Box>
            <Box
              as="button"
              type="button"
              onClick={clearChat}
              display="inline-flex"
              alignItems="center"
              gap={1.5}
              sx={{ _hover: { color: "var(--foreground)" } }}
            >
              <IconNew />
              <span>Новый диалог</span>
            </Box>
            <Box
              as="button"
              type="button"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              aria-label={theme === "light" ? "Тёмная тема" : "Светлая тема"}
              sx={{ _hover: { color: "var(--foreground)" } }}
            >
              ★
            </Box>
            <Link href="/dashboard" style={{ color: "inherit" }}>
              <Box as="span" sx={{ _hover: { color: "var(--foreground)" } }}>В кабинет</Box>
            </Link>
          </Flex>
        </Flex>
      </Box>

      <Box flex="1" display="flex" flexDirection="column" alignItems="center" w="100%" py={4} px={4}>
        <Container
          maxW="720px"
          w="100%"
          mx="auto"
          flex="1"
          display="flex"
          flexDirection="column"
          maxH="calc(100vh - 140px)"
          px={{ base: 3, md: 6 }}
        >

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

          {/* Одна панель чата: фон #F7FAFC, внутри — селектор, подсказка, контент, ввод */}
          <Box
            flex="1"
            display="flex"
            flexDirection="column"
            minH={0}
            borderRadius="16px"
            bg="var(--chat-panel-bg)"
            border="1px solid var(--chat-card-border)"
            boxShadow="var(--chat-card-shadow)"
            overflow="hidden"
            transition="background-color 0.2s ease, border-color 0.2s ease"
            position="relative"
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            {/* Селектор модели — белая карточка вверху панели */}
            <Box p={4} flexShrink={0} position="relative">
              {loadingModels ? (
                <Flex align="center" gap={2}>
                  <Spinner size="sm" color="blue.500" />
                  <Text fontSize="14px" color="var(--foreground-muted)">Загрузка моделей...</Text>
                </Flex>
              ) : (
                <>
                  <Flex
                    align="center"
                    gap={3}
                    p={3}
                    borderRadius="12px"
                    border="1px solid var(--chat-card-border)"
                    bg="var(--chat-card-bg)"
                    cursor="pointer"
                    onClick={() => setModelSelectOpen((o) => !o)}
                    sx={{ _hover: { borderColor: "#2563eb" } }}
                  >
                    <Box as="span" fontSize="20px" color="#2563eb">⚡</Box>
                    <Box flex={1} minW={0}>
                      <Text fontWeight="600" fontSize="16px" color="var(--foreground)" noOfLines={1}>
                        {displayModelName || "Выберите модель"}
                      </Text>
                      <Text fontSize="13px" color="var(--foreground-muted)">{providerLabel}</Text>
                    </Box>
                    <Box as="span" fontSize="12px" color="var(--foreground-muted)" transform={modelSelectOpen ? "rotate(180deg)" : undefined} transition="transform 0.2s">▼</Box>
                  </Flex>
                  {modelSelectOpen && (
                    <>
                      <Box position="fixed" inset={0} zIndex={9} onClick={() => setModelSelectOpen(false)} />
                      <Box
                        position="absolute"
                        top="100%"
                        left={4}
                        right={4}
                        mt={1}
                        py={1}
                        borderRadius="8px"
                        bg="var(--chat-card-bg)"
                        border="1px solid var(--chat-card-border)"
                        boxShadow="lg"
                        zIndex={10}
                        maxH="240px"
                        overflowY="auto"
                      >
                        {models.map((m) => (
                          <Box
                            key={m.model_name}
                            px={3}
                            py={2}
                            cursor="pointer"
                            onClick={() => {
                              setSelectedModel(m.model_name);
                              setModelSelectOpen(false);
                            }}
                            sx={{ _hover: { bg: "var(--chat-history-item-hover)" } }}
                          >
                            <Text fontSize="14px" fontWeight="500" color="var(--foreground)">{m.model_name}</Text>
                          </Box>
                        ))}
                      </Box>
                    </>
                  )}
                </>
              )}
              {attachedFiles.length > 0 && (
                <Flex align="center" gap={2} mt={2} flexWrap="wrap">
                  <Text fontSize="13px" color="var(--foreground-muted)">
                    Прикреплено: {attachedFiles.map((f) => f.name).join(", ")}
                  </Text>
                  <Button size="xs" variant="ghost" color="var(--foreground-subtle)" onClick={clearAttached}>
                    Убрать
                  </Button>
                </Flex>
              )}
            </Box>

            {/* Подсказка про drag-and-drop — по центру под селектором */}
            <Text textAlign="center" fontSize="13px" color="var(--foreground-subtle)" py={1} flexShrink={0}>
              Можно перетащить файлы в чат — их содержимое будет отправлено с сообщением.
            </Text>
            {isDragOver && (
              <Box
                position="absolute"
                inset={0}
                zIndex={10}
                bg="var(--input-focus-ring)"
                border="2px dashed var(--input-focus-border)"
                borderRadius="16px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                pointerEvents="none"
              >
                <Text fontWeight="600" color="var(--foreground)" fontSize="lg">
                  Отпустите файлы для прикрепления
                </Text>
              </Box>
            )}

            {/* Лента сообщений */}
            <Box
              flex="1"
              overflowY="auto"
              p={5}
              display="flex"
              flexDirection="column"
              gap={4}
            >
              {messages.length > 0 && (
                <Text fontSize="13px" color="var(--foreground-muted)" mb={1}>
                  {messages.length} {messages.length === 1 ? "сообщение" : messages.length < 5 ? "сообщения" : "сообщений"}
                </Text>
              )}

              {messages.length === 0 && !loading && (
                <Flex flexDirection="column" align="center" justify="center" py={8} textAlign="center">
                  <Flex
                    align="center"
                    justify="center"
                    w="72px"
                    h="72px"
                    borderRadius="full"
                    bg="rgba(37, 99, 235, 0.12)"
                    border="1px solid rgba(37, 99, 235, 0.25)"
                    mb={4}
                  >
                    <Box as="span" fontSize="36px" color="#2563eb" lineHeight={1}>
                      💬
                    </Box>
                  </Flex>
                  <Heading size="lg" color="var(--foreground)" mb={2} fontWeight="700" fontSize="1.5rem">
                    Начните разговор.
                  </Heading>
                  <Text color="var(--foreground)" fontSize="15px" mb={1} maxW="400px" lineHeight="1.5">
                    Напишите сообщение — диалог сохраняет контекст.
                  </Text>
                  <Text color="var(--foreground-subtle)" fontSize="14px" mb={6} maxW="400px" lineHeight="1.5">
                    Можно перетащить файлы в чат — их содержимое будет отправлено с сообщением.
                  </Text>
                  <Box
                    display="grid"
                    gridTemplateColumns={{ base: "1fr", md: "1fr 1fr" }}
                    gap={3}
                    w="100%"
                    maxW="560px"
                    mx="auto"
                    textAlign="left"
                  >
                    {SUGGESTION_CARDS.map((card, idx) => (
                      <Box
                        key={card.title}
                        as="button"
                        type="button"
                        onClick={() => setInput(card.prompt)}
                        textAlign="left"
                        p={4}
                        borderRadius="12px"
                        border="1px solid var(--chat-card-border)"
                        bg="var(--chat-card-bg)"
                        cursor="pointer"
                        transition="all 0.2s"
                        sx={{
                          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                          _hover: {
                            borderColor: "#2563eb",
                            bg: "var(--chat-prompt-btn-hover-bg)",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                          },
                        }}
                      >
                        <Flex align="flex-start" gap={3}>
                          <Box fontSize="20px" color="var(--foreground-muted)" lineHeight={1} mt="2px">
                            {card.icon}
                          </Box>
                          <Box flex={1} minW={0}>
                            <Text fontWeight="600" fontSize="14px" color="var(--foreground)" mb={1.5}>
                              {card.title}
                            </Text>
                            <Text fontSize="13px" color="var(--foreground-muted)" lineHeight="1.4">
                              {card.prompt}
                            </Text>
                          </Box>
                        </Flex>
                      </Box>
                    ))}
                  </Box>
                </Flex>
              )}

              {messages.map((msg, i) => {
                const isError = msg.role === "assistant" && msg.content.startsWith("Ошибка:");
                const isUser = msg.role === "user";
                return (
                  <Flex
                    key={i}
                    align="flex-end"
                    gap={2}
                    flexDirection={isUser ? "row-reverse" : "row"}
                    alignSelf={isUser ? "flex-end" : "flex-start"}
                    maxW="88%"
                  >
                    <Box
                      flex={1}
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
                      {msg.content}
                    </Box>
                    <Box
                      flexShrink={0}
                      w={8}
                      h={8}
                      borderRadius="full"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize="14px"
                      bg={isUser ? "var(--chat-bubble-user-bg)" : "transparent"}
                      color={isUser ? "#fff" : "#2563eb"}
                    >
                      {isUser ? "👤" : "⚡"}
                    </Box>
                  </Flex>
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

            {/* Поле ввода: скрепка | поле | круглая кнопка отправки */}
            <Box
              p={4}
              borderTop="1px solid var(--chat-card-border)"
              flexShrink={0}
              bg="var(--chat-card-bg)"
              transition="background-color 0.2s ease, border-color 0.2s ease"
            >
              <Flex align="flex-end" gap={2} mb={2}>
                <Box
                  flexShrink={0}
                  color="var(--foreground-muted)"
                  title="Прикрепить файл"
                  display="flex"
                  alignItems="center"
                  sx={{ _hover: { color: "var(--foreground)" } }}
                >
                  <IconPaperclip />
                </Box>
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
                  placeholder="Напишите сообщение... (Enter — отправить, Shift+Enter — новая строка)"
                  minH="48px"
                  maxH="160px"
                  borderRadius="12px"
                  padding="12px 16px"
                  fontSize="15px"
                  resize="none"
                  flex={1}
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
                  size="lg"
                  loading={loading}
                  disabled={!input.trim() || !selectedModel}
                  w="48px"
                  h="48px"
                  minW="48px"
                  borderRadius="full"
                  bg="#2563eb"
                  color="white"
                  flexShrink={0}
                  fontSize="18px"
                  sx={{ _hover: { bg: "#1d4ed8" } }}
                  aria-label="Отправить"
                >
                  ✈️
                </Button>
              </Flex>
              <Text fontSize="12px" color="var(--foreground-subtle)" textAlign="center">
                Enter — отправить, Shift+Enter — новая строка
              </Text>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
