"use client";

import { useEffect, useState, useRef } from "react";
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Button,
  Textarea,
} from "@chakra-ui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";

const STORAGE_KEY = "portal_chat_dialogs";
const MAX_SAVED = 30;

interface Model {
  model_name: string;
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
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [savedDialogs, setSavedDialogs] = useState<SavedDialog[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSavedDialogs(loadSavedDialogs());
  }, []);

  useEffect(() => {
    fetch("/api/models")
      .then((r) => r.json())
      .then((d) => {
        const list = d.models ?? [];
        setModels(list);
        if (list.length > 0 && !selectedModel) setSelectedModel(list[0].model_name);
      })
      .catch(() => setModels([]))
      .finally(() => setLoadingModels(false));
  }, []);

  useEffect(() => {
    if (models.length > 0 && !selectedModel) setSelectedModel(models[0].model_name);
  }, [models, selectedModel]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || !selectedModel) return;

    const userMessage: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const historyPlusNew = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          model: selectedModel,
          messages: historyPlusNew,
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

  const checkAuth = async () => {
    const res = await fetch("/api/me", { credentials: "include" });
    const data = await res.json();
    if (!res.ok || !data.user) router.push("/login");
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <Box minH="100vh" bg="#f7fafc" display="flex" flexDirection="column">
      <Navbar />
      <Container maxW="800px" py={{ base: 4, md: 6 }} px={4} flex="1" display="flex" flexDirection="column" maxH="calc(100vh - 56px)">
        <Flex justify="space-between" align="center" mb={4} flexShrink={0} flexWrap="wrap" gap={2}>
          <Heading size="lg" color="#1a202c" fontSize="1.25rem">
            Чат с моделью
          </Heading>
          <Flex gap={2}>
            <Button
              size="sm"
              variant="outline"
              borderColor="#cbd5e0"
              onClick={() => setShowHistory((v) => !v)}
            >
              {showHistory ? "Скрыть историю" : "Сохранённые диалоги"}
              {savedDialogs.length > 0 && ` (${savedDialogs.length})`}
            </Button>
            <Button
              size="sm"
              variant="outline"
              borderColor="#cbd5e0"
              onClick={clearChat}
              disabled={messages.length === 0}
            >
              Новый диалог
            </Button>
            <Link href="/dashboard">
              <Button size="sm" variant="outline" borderColor="#cbd5e0">
                В кабинет
              </Button>
            </Link>
          </Flex>
        </Flex>

        {showHistory && savedDialogs.length > 0 && (
          <Box
            mb={4}
            p={4}
            borderRadius="12px"
            border="1px solid #e2e8f0"
            bg="white"
            maxH="200px"
            overflowY="auto"
          >
            <Text fontSize="12px" fontWeight="600" color="#718096" mb={2}>
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
                  _hover={{ bg: "#edf2f7" }}
                  cursor="pointer"
                  onClick={() => loadDialog(d)}
                >
                  <Box flex={1} minW={0}>
                    <Text fontSize="14px" fontWeight="500" noOfLines={1}>
                      {d.title}
                    </Text>
                    <Text fontSize="11px" color="#718096">
                      {d.model} · {formatDate(d.savedAt)}
                    </Text>
                  </Box>
                  <Button
                    size="xs"
                    variant="ghost"
                    color="#718096"
                    onClick={(e) => removeSaved(d.id, e)}
                    title="Удалить"
                  >
                    ×
                  </Button>
                </Flex>
              ))}
            </Flex>
          </Box>
        )}

        <Box
          className="portal-card"
          flex="1"
          display="flex"
          flexDirection="column"
          minH={0}
          border="1px solid #e2e8f0"
          borderRadius="12px"
          bg="white"
          boxShadow="0 1px 3px rgba(0,0,0,0.06)"
        >
          <Flex p={4} borderBottom="1px solid #e2e8f0" gap={3} align="center" flexShrink={0}>
            <Text fontSize="14px" fontWeight="600" color="#2d3748">
              Модель:
            </Text>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="portal-input"
              style={{ width: "auto", minWidth: "180px", cursor: "pointer" }}
            >
              {models.map((m) => (
                <option key={m.model_name} value={m.model_name}>
                  {m.model_name}
                </option>
              ))}
            </select>
          </Flex>

          <Box flex="1" overflowY="auto" p={4} display="flex" flexDirection="column" gap={4}>
            {messages.length === 0 && (
              <Text color="#718096" fontSize="14px" textAlign="center" py={8}>
                Напишите сообщение — диалог сохраняет контекст. При «Новый диалог» текущий чат попадёт в сохранённые.
              </Text>
            )}
            {messages.map((msg, i) => (
              <Box
                key={i}
                alignSelf={msg.role === "user" ? "flex-end" : "flex-start"}
                maxW="85%"
                px={4}
                py={3}
                borderRadius="12px"
                bg={msg.role === "user" ? "#3182ce" : "#edf2f7"}
                color={msg.role === "user" ? "white" : "#1a202c"}
                fontSize="15px"
                lineHeight="1.6"
                whiteSpace="pre-wrap"
              >
                <Text fontSize="11px" fontWeight="600" opacity={0.8} mb={1}>
                  {msg.role === "user" ? "Вы" : "Модель"}
                </Text>
                {msg.content}
              </Box>
            ))}
            {loading && (
              <Box alignSelf="flex-start" px={4} py={2} borderRadius="12px" bg="#edf2f7" color="#718096" fontSize="14px">
                Печатает...
              </Box>
            )}
            <div ref={bottomRef} />
          </Box>

          <Box p={4} borderTop="1px solid #e2e8f0" flexShrink={0}>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Сообщение... (Enter — отправить, Shift+Enter — новая строка)"
              minH="80px"
              mb={3}
              border="1px solid #cbd5e0"
              borderRadius="8px"
              padding="12px"
              fontSize="16px"
              _focus={{ borderColor: "#3182ce", boxShadow: "0 0 0 2px rgba(49, 130, 206, 0.4)" }}
            />
            <Button
              onClick={send}
              colorScheme="blue"
              size="lg"
              loading={loading}
              disabled={!input.trim() || !selectedModel}
              borderRadius="8px"
              fontWeight="600"
            >
              Отправить
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
