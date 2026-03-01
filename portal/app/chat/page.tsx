"use client";

import { useEffect, useState } from "react";
import { Box, Container, Flex, Heading, Text, Button, Textarea } from "@chakra-ui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";

interface Model {
  model_name: string;
}

export default function ChatPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
  const [response, setResponse] = useState("");
  const router = useRouter();

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

  const send = async () => {
    const text = input.trim();
    if (!text || !selectedModel) return;
    setLoading(true);
    setResponse("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: "user", content: text }],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResponse(`Ошибка: ${data.error ?? res.status}`);
        return;
      }
      const content = data.choices?.[0]?.message?.content ?? "(нет ответа)";
      setResponse(content);
    } catch (e) {
      setResponse(`Ошибка: ${e instanceof Error ? e.message : "Сеть"}`);
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = async () => {
    const res = await fetch("/api/me", { credentials: "include" });
    if (!res.ok || !(await res.json()).user) router.push("/login");
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <Box minH="100vh" bg="#f7fafc">
      <Navbar />
      <Container maxW="800px" py={{ base: 6, md: 8 }} px={4}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg" color="#1a202c">
            Попробовать модель
          </Heading>
          <Link href="/dashboard">
            <Button size="sm" variant="outline" borderColor="#cbd5e0">
              В кабинет
            </Button>
          </Link>
        </Flex>

        <Box
          className="portal-card"
          p={6}
          border="1px solid #e2e8f0"
          borderRadius="12px"
          bg="white"
          boxShadow="0 1px 3px rgba(0,0,0,0.06)"
        >
          <Text mb={2} fontSize="14px" fontWeight="600" color="#2d3748">
            Модель
          </Text>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="portal-input"
            style={{ marginBottom: "1.25rem", cursor: "pointer" }}
          >
            {models.map((m) => (
              <option key={m.model_name} value={m.model_name}>
                {m.model_name}
              </option>
            ))}
          </select>

          <Text mb={2} fontSize="14px" fontWeight="600" color="#2d3748">
            Сообщение
          </Text>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Введите запрос..."
            minH="120px"
            mb={4}
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
            mb={6}
            borderRadius="8px"
            fontWeight="600"
          >
            Отправить
          </Button>

          {response && (
            <>
              <Text mb={2} fontSize="14px" fontWeight="600" color="#2d3748">
                Ответ
              </Text>
              <Box
                p={4}
                borderRadius="8px"
                bg="#f7fafc"
                border="1px solid #e2e8f0"
                whiteSpace="pre-wrap"
                fontSize="15px"
                color="#1a202c"
                lineHeight="1.6"
              >
                {response}
              </Box>
            </>
          )}
        </Box>
      </Container>
    </Box>
  );
}
