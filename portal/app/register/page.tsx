"use client";

import { useState, useEffect } from "react";
import { Box, Container, Heading, Field, Input, Button, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";

const MIN_SECONDS_BEFORE_SUBMIT = 3;

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [canSubmit, setCanSubmit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => setCanSubmit(true), MIN_SECONDS_BEFORE_SUBMIT * 1000);
    return () => clearTimeout(t);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, website: honeypot, _ready: canSubmit ? "1" : "" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Ошибка" });
        return;
      }
      setMessage({ type: "success", text: "Регистрация успешна" });
      router.push("/dashboard");
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Ошибка сети" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg="#f7fafc">
      <Navbar />
      <Container maxW="md" py={{ base: 8, md: 12 }} px={4}>
        <Box className="portal-card" p={8} maxW="400px" mx="auto">
          <Heading size="lg" mb={2} color="#1a202c" fontSize="1.5rem">
            Регистрация
          </Heading>
          <Text mb={6} fontSize="sm" color="#718096">
            Создайте аккаунт и получите API-ключ для доступа к моделям
          </Text>
          <Box as="form" onSubmit={submit} position="relative">
          {/* Honeypot: скрыто от пользователя */}
          <Box
            position="absolute"
            left="-9999px"
            width="1px"
            height="1px"
            overflow="hidden"
            aria-hidden
          >
            <Field.Root>
              <Field.Label>Сайт (необязательно)</Field.Label>
              <Input
                tabIndex={-1}
                autoComplete="off"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </Field.Root>
          </Box>
          <Field.Root mb={5} required>
            <Field.Label className="portal-label">Email</Field.Label>
            <Input
              className="portal-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              border="1px solid #cbd5e0"
              bg="white"
              minHeight="44px"
              padding="10px 14px"
              fontSize="16px"
              _focus={{ borderColor: "#3182ce", boxShadow: "0 0 0 3px rgba(49, 130, 206, 0.4)" }}
            />
          </Field.Root>
          <Field.Root mb={6} required>
            <Field.Label className="portal-label">Пароль (не менее 8 символов)</Field.Label>
            <Input
              className="portal-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              minLength={8}
              border="1px solid #cbd5e0"
              bg="white"
              minHeight="44px"
              padding="10px 14px"
              fontSize="16px"
              _focus={{ borderColor: "#3182ce", boxShadow: "0 0 0 3px rgba(49, 130, 206, 0.4)" }}
            />
          </Field.Root>
          {message && (
            <Box
              mb={4}
              p={3}
              borderRadius="8px"
              border="1px solid"
              borderColor={message.type === "error" ? "red.200" : "green.200"}
              bg={message.type === "error" ? "#fff5f5" : "#f0fff4"}
              color={message.type === "error" ? "#c53030" : "#276749"}
              fontSize="14px"
            >
              {message.text}
            </Box>
          )}
          <Button
            type="submit"
            colorScheme="blue"
            width="full"
            loading={loading}
            disabled={!canSubmit}
            size="lg"
            height="48px"
            fontSize="16px"
            fontWeight="600"
            borderRadius="8px"
          >
            {canSubmit ? "Зарегистрироваться" : `Подождите ${MIN_SECONDS_BEFORE_SUBMIT} сек...`}
          </Button>
          <Text mt={5} textAlign="center" fontSize="14px" color="#4a5568">
            Уже есть аккаунт?{" "}
            <Link href="/login" style={{ color: "#3182ce", fontWeight: 600 }}>
              Войти
            </Link>
          </Text>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
