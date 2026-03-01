"use client";

import { useEffect, useState } from "react";
import { Box, Container, Flex, Heading, Text, Button, SimpleGrid, Spinner } from "@chakra-ui/react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";

interface Model {
  model_name: string;
}

export default function Home() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/models")
      .then((r) => r.json())
      .then((d) => setModels(d.models ?? []))
      .catch(() => setModels([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box minH="100vh" bg="#f7fafc">
      <Navbar />
      <Container maxW="1200px" py={{ base: 8, md: 12 }} px={4}>
        {/* Hero */}
        <Box
          textAlign="center"
          mb={{ base: 12, md: 16 }}
          py={{ base: 8, md: 12 }}
          px={4}
          borderRadius="12px"
          bg="white"
          border="1px solid #e2e8f0"
          boxShadow="0 1px 3px rgba(0,0,0,0.06)"
        >
          <Heading size="2xl" mb={4} color="#1a202c" fontSize={{ base: "1.5rem", md: "2rem" }} lineHeight="1.3">
            Единый API для языковых моделей
          </Heading>
          <Text fontSize="lg" color="#4a5568" maxW="560px" mx="auto" mb={8} lineHeight="1.6">
            Один ключ — доступ к разным LLM. Регистрируйтесь и получайте API-ключ
            для интеграции в свои приложения.
          </Text>
          <Flex gap={4} justify="center" flexWrap="wrap">
            <Link href="/register">
              <Button colorScheme="blue" size="lg" height="48px" px={8} fontSize="16px" fontWeight="600" borderRadius="8px">
                Начать
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" height="48px" px={8} fontSize="16px" borderRadius="8px" borderWidth="2px" borderColor="#3182ce" color="#3182ce">
                Войти
              </Button>
            </Link>
          </Flex>
        </Box>

        {/* Модели */}
        <Heading size="lg" mb={6} textAlign="center" color="#1a202c" fontSize="1.25rem">
          Доступные модели
        </Heading>
        {loading ? (
          <Flex justify="center" py={8}>
            <Spinner size="lg" color="blue.500" />
          </Flex>
        ) : models.length === 0 ? (
          <Text textAlign="center" color="#718096" py={8}>
            Список моделей загружается или пока пуст.
          </Text>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={5}>
            {models.map((m) => (
              <Box
                key={m.model_name}
                className="portal-card"
                p={5}
                borderRadius="12px"
                border="1px solid #e2e8f0"
                bg="white"
                boxShadow="0 1px 3px rgba(0,0,0,0.06)"
              >
                <Text fontWeight="600" color="#1a202c" fontSize="1rem">
                  {m.model_name}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        )}

        <Box mt={16} textAlign="center">
          <Link href="/dashboard" style={{ color: "#3182ce", fontWeight: 600, fontSize: "15px" }}>
            Перейти в личный кабинет →
          </Link>
        </Box>
      </Container>
    </Box>
  );
}
