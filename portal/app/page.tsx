"use client";

import { useEffect, useState, useRef } from "react";
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
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  const measure = () => {
    if (contentRef.current) setHeight(contentRef.current.scrollHeight);
  };

  useEffect(() => {
    if (!contentRef.current) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(contentRef.current);
    return () => ro.disconnect();
  }, [tier.textModels.length, tier.imageModels.length]);

  useEffect(() => {
    if (isOpen) {
      const t = requestAnimationFrame(() => {
        requestAnimationFrame(measure);
      });
      return () => cancelAnimationFrame(t);
    }
  }, [isOpen]);

  return (
    <Box
      borderRadius="16px"
      overflow="hidden"
      bg="#ffffff"
      boxShadow={isOpen ? "0 12px 40px rgba(0,0,0,0.1)" : "0 2px 12px rgba(0,0,0,0.06)"}
      border="2px solid"
      borderColor={isOpen ? meta.border : "#e5e7eb"}
      transition="box-shadow 0.35s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s ease, transform 0.2s ease"
      _hover={{ borderColor: isOpen ? meta.border : "#d1d5db" }}
      flex="1"
      minW={0}
      display="flex"
      flexDirection="column"
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
          borderBottom: "1px solid",
          borderBottomColor: isOpen ? "#e5e7eb" : "transparent",
        }}
      >
        <Box px={5} py={4}>
          <Flex align="center" justify="space-between" gap={3}>
            <Box flex={1} minW={0}>
              <Flex align="center" gap={2} flexWrap="wrap" mb={1}>
                <Heading size="md" color="#111827" fontSize="1.15rem" fontWeight="800">
                  {tier.title}
                </Heading>
                <Box
                  px={2}
                  py={0.5}
                  borderRadius="full"
                  fontSize="xs"
                  fontWeight="600"
                  color={meta.accent}
                  bg={`${meta.accent}20`}
                >
                  {meta.badge}
                </Box>
              </Flex>
              <Text color="#4b5563" fontSize="xs" lineHeight="1.45" noOfLines={2}>
                {meta.desc}
              </Text>
            </Box>
            <Box
              flexShrink={0}
              w="36px"
              h="36px"
              borderRadius="10px"
              bg="white"
              boxShadow="0 1px 4px rgba(0,0,0,0.08)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              transition="transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)"
              style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              <Box
                as="span"
                sx={{
                  display: "block",
                  width: "10px",
                  height: "10px",
                  borderRight: "2px solid #6b7280",
                  borderBottom: "2px solid #6b7280",
                  transform: "rotate(45deg) translateY(-1px)",
                }}
              />
            </Box>
          </Flex>
        </Box>
      </Box>

      <Box
        overflow="hidden"
        transition="max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
        style={{ maxHeight: isOpen ? height : 0 }}
      >
        <Box ref={contentRef} borderTop="1px solid #e5e7eb" bg="#fafbfc" px={5} pb={5} pt={4}>
          <Box mb={4}>
            <Flex align="center" gap={2} mb={3}>
              <Box w="3px" h="18px" borderRadius="full" bg="#2563eb" />
              <Text fontWeight="700" color="#374151" fontSize="xs">
                Текстовые модели
              </Text>
            </Flex>
            <SimpleGrid columns={1} gap={2}>
              {tier.textModels.map((m) => (
                <ModelCard key={m.name} item={m} accentColor={meta.accent} />
              ))}
            </SimpleGrid>
          </Box>
          <Box>
            <Flex align="center" gap={2} mb={3}>
              <Box w="3px" h="18px" borderRadius="full" bg="#f59e0b" />
              <Text fontWeight="700" color="#374151" fontSize="xs">
                Генерация изображений
              </Text>
            </Flex>
            <SimpleGrid columns={1} gap={2}>
              {tier.imageModels.map((m) => (
                <ModelCard key={m.name} item={m} accentColor={meta.accent} />
              ))}
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
          <SimpleGrid
            columns={{ base: 1, md: 3 }}
            gap={6}
            alignItems="stretch"
          >
            {tiers.map((tier) => (
              <TierSection
                key={tier.id}
                tier={tier}
                isOpen={openTierIds.has(tier.id)}
                onToggle={() => toggleTier(tier.id)}
              />
            ))}
          </SimpleGrid>
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
