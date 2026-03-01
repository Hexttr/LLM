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

const TIER_META: Record<
  string,
  { accent: string; bg: string; border: string; badge: string; desc: string }
> = {
  free: {
    accent: "#059669",
    bg: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.04) 100%)",
    border: "#10b981",
    badge: "Бесплатно",
    desc: "Для теста, обучения и лёгких задач. Лимиты по запросам в минуту.",
  },
  daily: {
    accent: "#1d4ed8",
    bg: "linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(29, 78, 216, 0.04) 100%)",
    border: "#2563eb",
    badge: "На каждый день",
    desc: "Умеренная цена, баланс качества и скорости для рутины и поддержки.",
  },
  top: {
    accent: "#6d28d9",
    bg: "linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(109, 40, 217, 0.04) 100%)",
    border: "#7c3aed",
    badge: "Топ",
    desc: "Максимальное качество: сложные рассуждения, код, длинный контекст.",
  },
};

function ModelCard({
  item,
  accentColor,
}: {
  item: ModelItem;
  accentColor: string;
}) {
  return (
    <Box
      p={4}
      borderRadius="12px"
      border="1px solid #e5e7eb"
      bg="#ffffff"
      boxShadow="0 1px 3px rgba(0,0,0,0.04)"
      transition="all 0.2s ease"
      _hover={{
        borderColor: accentColor,
        boxShadow: `0 4px 12px ${accentColor}20`,
        transform: "translateY(-1px)",
      }}
    >
      <Text fontWeight="700" color="#111827" fontSize="0.9375rem" lineHeight="1.3">
        {item.name}
      </Text>
      {item.provider && (
        <Box
          mt={2}
          display="inline-block"
          px={2}
          py={0.5}
          borderRadius="6px"
          bg="#f3f4f6"
          fontSize="xs"
          color="#6b7280"
          fontWeight="500"
        >
          {item.provider}
        </Box>
      )}
      {item.description && (
        <Text fontSize="xs" color="#4b5563" mt={2} lineHeight="1.45">
          {item.description}
        </Text>
      )}
    </Box>
  );
}

function TierSection({
  tier,
  isOpen,
  onToggle,
}: {
  tier: TierData;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const meta = TIER_META[tier.id] ?? TIER_META.daily;

  return (
    <Box
      mb={6}
      borderRadius="16px"
      overflow="hidden"
      bg="#ffffff"
      boxShadow={isOpen ? "0 8px 30px rgba(0,0,0,0.08)" : "0 2px 8px rgba(0,0,0,0.04)"}
      border="1px solid #e5e7eb"
      transition="box-shadow 0.25s ease, border-color 0.2s"
      _hover={{ borderColor: isOpen ? meta.border : "#d1d5db" }}
    >
      <Box
        as="button"
        type="button"
        width="100%"
        textAlign="left"
        onClick={onToggle}
        cursor="pointer"
        _focusVisible={{ outline: "2px solid", outlineColor: meta.accent, outlineOffset: "2px" }}
        transition="background 0.2s"
        sx={{
          background: meta.bg,
          borderLeft: "4px solid",
          borderLeftColor: meta.border,
        }}
      >
        <Box px={6} py={5}>
          <Flex align="flex-start" justify="space-between" gap={4} flexWrap="wrap">
            <Box flex={1} minW={0}>
              <Flex align="center" gap={3} mb={2}>
                <Heading size="md" color="#111827" fontSize="1.35rem" fontWeight="800">
                  {tier.title}
                </Heading>
                <Box
                  px={2.5}
                  py={0.5}
                  borderRadius="full"
                  fontSize="xs"
                  fontWeight="600"
                  color={meta.accent}
                  bg={`${meta.accent}18`}
                >
                  {meta.badge}
                </Box>
              </Flex>
              <Text color="#4b5563" fontSize="sm" lineHeight="1.5" maxW="560px">
                {meta.desc}
              </Text>
              <Text color="#6b7280" fontSize="xs" mt={1}>
                {tier.subtitle}
              </Text>
            </Box>
            <Flex
              align="center"
              justify="center"
              w="40px"
              h="40px"
              borderRadius="10px"
              bg="white"
              boxShadow="0 1px 3px rgba(0,0,0,0.08)"
              sx={{
                "& > span": {
                  display: "inline-block",
                  width: "10px",
                  height: "10px",
                  borderRight: "2px solid #6b7280",
                  borderBottom: "2px solid #6b7280",
                  transform: isOpen ? "rotate(-135deg) translateY(2px)" : "rotate(45deg)",
                  transition: "transform 0.25s ease",
                },
              }}
            >
              <span />
            </Flex>
          </Flex>
        </Box>
      </Box>

      {isOpen && (
        <Box borderTop="1px solid #e5e7eb" bg="#fafbfc" px={6} pb={6} pt={4}>
          <SimpleGrid columns={{ base: 1, lg: 2 }} gap={8} mt={2}>
            <Box>
              <Flex align="center" gap={2} mb={4}>
                <Box w="4px" h="22px" borderRadius="full" bg="#2563eb" />
                <Text fontWeight="700" color="#374151" fontSize="0.9375rem">
                  Текстовые модели
                </Text>
              </Flex>
              <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
                {tier.textModels.map((m) => (
                  <ModelCard key={m.name} item={m} accentColor={meta.accent} />
                ))}
              </SimpleGrid>
            </Box>
            <Box>
              <Flex align="center" gap={2} mb={4}>
                <Box w="4px" h="22px" borderRadius="full" bg="#f59e0b" />
                <Text fontWeight="700" color="#374151" fontSize="0.9375rem">
                  Генерация изображений
                </Text>
              </Flex>
              <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
                {tier.imageModels.map((m) => (
                  <ModelCard key={m.name} item={m} accentColor={meta.accent} />
                ))}
              </SimpleGrid>
            </Box>
          </SimpleGrid>
        </Box>
      )}
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
        className="hero-animated-bg"
        position="relative"
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
              Пользуйся всеми моделями ИИ без VPN
            </Heading>
            <Text fontSize="lg" color="#475569" lineHeight="1.65" mb={8}>
              Общий рублёвый счёт и старт за 5 минут.
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
          Нажмите на раздел, чтобы раскрыть и просмотреть все модели
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
