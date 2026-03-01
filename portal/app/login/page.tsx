"use client";

import { useState } from "react";
import { Box, Container, Heading, Field, Input, Button, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Ошибка" });
        return;
      }
      setMessage({ type: "success", text: "Вход выполнен" });
      // Даём браузеру время установить cookie перед переходом
      await new Promise((r) => setTimeout(r, 100));
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
            Вход
          </Heading>
          <Text mb={6} fontSize="sm" color="#718096">
            Введите email и пароль от аккаунта
          </Text>
          <Box as="form" onSubmit={submit}>
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
              <Field.Label className="portal-label">Пароль</Field.Label>
              <Input
                className="portal-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
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
              size="lg"
              height="48px"
              fontSize="16px"
              fontWeight="600"
              borderRadius="8px"
            >
              Войти
            </Button>
            <Text mt={5} textAlign="center" fontSize="14px" color="#4a5568">
              Нет аккаунта?{" "}
              <Link href="/register" style={{ color: "#3182ce", fontWeight: 600 }}>
                Регистрация
              </Link>
            </Text>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
