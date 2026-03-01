"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Spinner,
} from "@chakra-ui/react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";

interface ModelItem {
  name: string;
  provider?: string;
  description?: string;
}

interface TierData {
  id: string;
  title: string;
  subtitle: string;
  textModels: ModelItem[];
  imageModels: ModelItem[];
}

function ModelCard({ item }: { item: ModelItem }) {
  return (
    <Box
      p={3}
      borderRadius="10px"
      border="1px solid #e5e7eb"
      bg="#ffffff"
      transition="border-color 0.2s, box-shadow 0.2s"
      _hover={{ borderColor: "#93c5fd", boxShadow: "0 2px 8px rgba(37, 99, 235, 0.08)" }}
    >
      <Text fontWeight="600" color="#111827" fontSize="0.9375rem">
        {item.name}
      </Text>
      {item.provider && (
        <Text fontSize="xs" color="#6b7280" mt={0.5}>
          {item.provider}
        </Text>
      )}
      {item.description && (
        <Text fontSize="xs" color="#4b5563" mt={0.5} lineHeight="1.4">
          {item.description}
        </Text>
      )}
    </Box>
  );
}

const TIER_STYLE: Record<string, { border: string; bg: string; accent: string }> = {
  free: { border: "#10b981", bg: "rgba(16, 185, 129, 0.06)", accent: "#059669" },
  daily: { border: "#2563eb", bg: "rgba(37, 99, 235, 0.06)", accent: "#1d4ed8" },
  top: { border: "#7c3aed", bg: "rgba(124, 58, 237, 0.06)", accent: "#6d28d9" },
};

function TierSection({
  tier,
  isOpen,
  onToggle,
}: {
  tier: TierData;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const style = TIER_STYLE[tier.id] ?? TIER_STYLE.daily;

  return (
    <Box
      mb={4}
      borderRadius="14px"
      border="1px solid"
      borderColor={style.border}
      overflow="hidden"
      bg="#ffffff"
      boxShadow={isOpen ? "0 4px 20px rgba(0,0,0,0.06)" : "0 1px 3px rgba(0,0,0,0.04)"}
      transition="box-shadow 0.2s"
    >
      <Box
        as="button"
        type="button"
        width="100%"
        textAlign="left"
        onClick={onToggle}
        px={6}
        py={4}
        bg={style.bg}
        borderBottom={isOpen ? "1px solid" : "none"}
        borderColor="#e5e7eb"
        cursor="pointer"
        _hover={{ bg: "rgba(0,0,0,0.02)" }}
        _focusVisible={{ outline: "2px solid #2563eb", outlineOffset: "2px" }}
        transition="background 0.15s"
      >
        <Flex align="center" justify="space-between" gap={4}>
          <Box>
            <Heading size="md" color="#111827" fontSize="1.25rem" fontWeight="700">
              {tier.title}
            </Heading>
            <Text color="#6b7280" fontSize="sm" mt={1}>
              {tier.subtitle}
            </Text>
          </Box>
          <Box
            as="span"
            sx={{
              display: "inline-block",
              width: "20px",
              height: "20px",
              borderRight: "2px solid #9ca3af",
              borderBottom: "2px solid #9ca3af",
              transform: isOpen ? "rotate(-135deg)" : "rotate(45deg)",
              transition: "transform 0.25s ease",
            }}
          />
        </Flex>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateRows: isOpen ? "1fr" : "0fr",
          transition: "grid-template-rows 0.3s ease",
        }}
      >
        <Box overflow="hidden">
          <Box p={6} pt={5} borderTop="none">
            <SimpleGrid columns={{ base: 1, lg: 2 }} gap={8}>
              <Box>
                <Flex align="center" gap={2} mb={4}>
                  <Box w="4px" h="20px" borderRadius="full" bg="#2563eb" />
                  <Text fontWeight="600" color="#374151" fontSize="0.9375rem">
                    Текстовые модели
                  </Text>
                </Flex>
                <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3}>
                  {tier.textModels.map((m) => (
                    <ModelCard key={m.name} item={m} />
                  ))}
                </SimpleGrid>
              </Box>
              <Box>
                <Flex align="center" gap={2} mb={4}>
                  <Box w="4px" h="20px" borderRadius="full" bg="#f59e0b" />
                  <Text fontWeight="600" color="#374151" fontSize="0.9375rem">
                    Генерация изображений
                  </Text>
                </Flex>
                <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3}>
                  {tier.imageModels.map((m) => (
                    <ModelCard key={m.name} item={m} />
                  ))}
                </SimpleGrid>
              </Box>
            </SimpleGrid>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default function Home() {
  const [tiers, setTiers] = useState<TierData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openTierIds, setOpenTierIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/model-tiers")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((data) => setTiers(Array.isArray(data) ? data : []))
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, []);

  const toggleTier = (id: string) => {
    setOpenTierIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Box minH="100vh" w="100%" bg="#fafbfc">
      <Navbar />

      {/* Hero */}
      <Box
        w="100%"
        bg="linear-gradient(180deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)"
        borderBottom="1px solid #e2e8f0"
        pt={{ base: 10, md: 14 }}
        pb={{ base: 12, md: 16 }}
      >
        <Container maxW="1200px" w="100%" mx="auto" px={4}>
          <Box textAlign="center" maxW="640px" mx="auto">
            <Heading
              size="2xl"
              color="#0f172a"
              fontSize={{ base: "1.75rem", md: "2.25rem" }}
              fontWeight="800"
              letterSpacing="-0.025em"
              lineHeight="1.2"
              mb={4}
            >
              Единый API для языковых моделей и генерации изображений
            </Heading>
            <Text fontSize="lg" color="#475569" lineHeight="1.65" mb={8}>
              Один ключ — доступ к бесплатным и премиум моделям. Регистрируйтесь, получайте API-ключ и подключайте
              чат и генерацию картинок в свои приложения.
            </Text>
            <Flex gap={3} justify="center" flexWrap="wrap">
              <Link href="/register">
                <Button
                  size="lg"
                  height="48px"
                  px={8}
                  fontSize="16px"
                  fontWeight="600"
                  borderRadius="10px"
                  bg="#2563eb"
                  color="white"
                  _hover={{ bg: "#1d4ed8" }}
                  boxShadow="0 2px 8px rgba(37, 99, 235, 0.35)"
                >
                  Начать бесплатно
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  height="48px"
                  px={8}
                  fontSize="16px"
                  fontWeight="600"
                  borderRadius="10px"
                  borderWidth="2px"
                  borderColor="#cbd5e1"
                  color="#334155"
                  _hover={{ bg: "#f1f5f9", borderColor: "#94a3b8" }}
                >
                  Войти
                </Button>
              </Link>
            </Flex>
          </Box>
        </Container>
      </Box>

      {/* Каталог моделей */}
      <Container maxW="1200px" w="100%" mx="auto" py={{ base: 10, md: 14 }} px={4}>
        <Heading
          size="lg"
          textAlign="center"
          color="#0f172a"
          fontSize="1.5rem"
          fontWeight="700"
          mb={2}
        >
          Каталог моделей
        </Heading>
        <Text textAlign="center" color="#64748b" fontSize="sm" mb={10}>
          Три уровня доступа — клик по заголовку, чтобы раскрыть список
        </Text>

        {loading && (
          <Flex justify="center" py={12}>
            <Spinner size="lg" color="blue.500" />
          </Flex>
        )}
        {error && (
          <Text textAlign="center" color="red.500" py={8}>
            {error}
          </Text>
        )}
        {!loading && !error && tiers.length > 0 && (
          <>
            {tiers.map((tier) => (
              <TierSection
                key={tier.id}
                tier={tier}
                isOpen={openTierIds.has(tier.id)}
                onToggle={() => toggleTier(tier.id)}
              />
            ))}
          </>
        )}

        <Box mt={14} textAlign="center">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              color="#2563eb"
              fontWeight="600"
              fontSize="15px"
              _hover={{ bg: "rgba(37, 99, 235, 0.08)" }}
            >
              Перейти в личный кабинет →
            </Button>
          </Link>
        </Box>
      </Container>
    </Box>
  );
}
