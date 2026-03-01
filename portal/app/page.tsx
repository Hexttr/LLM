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
import Image from "next/image";
import { Navbar } from "@/components/Navbar";

interface ModelItem {
  name: string;
  provider?: string;
  description?: string;
  /** Ключ модели для API (для перехода в чат) */
  modelId?: string;
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
  { accent: string; bg: string; border: string; badge: string; desc: string; image: string }
> = {
  free: {
    accent: "#059669",
    bg: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.04) 100%)",
    border: "#10b981",
    badge: "Самые доступные модели",
    desc: "Для теста, обучения и лёгких задач. Лимиты по запросам в минуту.",
    image: "/images/catalog-free.png",
  },
  daily: {
    accent: "#1d4ed8",
    bg: "linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(29, 78, 216, 0.04) 100%)",
    border: "#2563eb",
    badge: "Умеренные траты",
    desc: "Умеренная цена, баланс качества и скорости для рутины и поддержки.",
    image: "/images/catalog-daily.png",
  },
  top: {
    accent: "#6d28d9",
    bg: "linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(109, 40, 217, 0.04) 100%)",
    border: "#7c3aed",
    badge: "Максимальное качество",
    desc: "Максимальное качество: сложные рассуждения, код, длинный контекст.",
    image: "/images/catalog-top.png",
  },
};

function ModelCard({
  item,
  accentColor,
}: {
  item: ModelItem;
  accentColor: string;
}) {
  const href = `/chat?model=${encodeURIComponent(item.modelId ?? item.name)}`;
  return (
    <Link href={href} style={{ display: "block" }}>
      <Box
        p={4}
        borderRadius="12px"
        border="1px solid #e5e7eb"
        bg="#ffffff"
        boxShadow="0 1px 3px rgba(0,0,0,0.04)"
        transition="all 0.2s ease"
        _hover={{
          borderColor: accentColor,
          boxShadow: `0 6px 16px ${accentColor}25`,
          transform: "translateY(-2px)",
        }}
        cursor="pointer"
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
        <Text fontSize="xs" color={accentColor} mt={2} fontWeight="500">
          Открыть в чате →
        </Text>
      </Box>
    </Link>
  );
}

function TierCard({
  tier,
  isSelected,
  onSelect,
}: {
  tier: TierData;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const meta = TIER_META[tier.id] ?? TIER_META.daily;

  return (
    <Box
      as="button"
      type="button"
      width="100%"
      textAlign="left"
      onClick={onSelect}
      cursor="pointer"
      borderRadius="16px"
      overflow="hidden"
      bg="#ffffff"
      boxShadow={isSelected ? "0 12px 40px rgba(0,0,0,0.12)" : "0 2px 12px rgba(0,0,0,0.06)"}
      border="2px solid"
      borderColor={isSelected ? meta.border : "#e5e7eb"}
      transition="box-shadow 0.25s ease, border-color 0.25s ease, transform 0.2s ease"
      _hover={{ borderColor: meta.border }}
      _focusVisible={{ outline: "2px solid", outlineColor: meta.accent, outlineOffset: "2px" }}
      flex="1"
      minW={0}
      sx={{
        background: isSelected ? meta.bg : "#ffffff",
      }}
    >
      <Box position="relative" w="100%" h="120px" bg={meta.bg} overflow="hidden">
        <Image
          src={meta.image}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          style={{ objectFit: "cover", objectPosition: "center" }}
        />
      </Box>
      <Box px={5} py={4}>
        <Heading size="md" color="#111827" fontSize="1.15rem" fontWeight="800" mb={2}>
          {tier.title}
        </Heading>
        <Box
          display="inline-block"
          px={2.5}
          py={1}
          borderRadius="8px"
          fontSize="xs"
          fontWeight="600"
          color={meta.accent}
          bg={`${meta.accent}18`}
          mb={2}
        >
          {meta.badge}
        </Box>
        <Text color="#4b5563" fontSize="xs" lineHeight="1.5" noOfLines={2}>
          {meta.desc}
        </Text>
      </Box>
    </Box>
  );
}

export default function Home() {
  const [tiers, setTiers] = useState<TierData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);

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

  const selectedTier = selectedTierId ? tiers.find((t) => t.id === selectedTierId) : null;

  return (
    <Box minH="100vh" w="100%" bg="#fafbfc">
      <Navbar />

      {/* Hero */}
      <Box
        w="100%"
        className="hero-animated-bg"
        position="relative"
        borderBottom="1px solid rgba(226, 232, 240, 0.8)"
        pt={{ base: 12, md: 16 }}
        pb={{ base: 14, md: 20 }}
      >
        <Container maxW="1200px" w="100%" mx="auto" px={4}>
          <Box textAlign="center" maxW="640px" mx="auto">
            {/* Пилл: Без VPN · Рублёвый счёт · Старт за 5 минут */}
            <Flex
              justify="center"
              align="center"
              gap={2}
              mb={6}
            >
              <Box
                display="inline-flex"
                alignItems="center"
                gap={2}
                px={4}
                py={2}
                borderRadius="full"
                bg="rgba(37, 99, 235, 0.12)"
                color="#1d4ed8"
                fontSize="sm"
                fontWeight="600"
              >
                <Box as="span" fontSize="16px" lineHeight={1} aria-hidden>
                  ✦
                </Box>
                <Text as="span">Без VPN · Рублёвый счёт · Старт за 5 минут</Text>
              </Box>
            </Flex>

            {/* Заголовок: Все модели ИИ / В одном месте */}
            <Heading
              size="2xl"
              fontSize={{ base: "2rem", md: "2.75rem" }}
              fontWeight="800"
              letterSpacing="-0.03em"
              lineHeight="1.2"
              mb={4}
            >
              <Text as="span" color="#0f172a" display="block">
                Все модели ИИ
              </Text>
              <Text as="span" color="#2563eb" display="block">
                В одном месте
              </Text>
            </Heading>

            <Text fontSize="lg" color="#475569" lineHeight="1.6" mb={8} fontWeight="500">
              Единый доступ к GPT, Claude, Gemini, Llama, Mixtral и другим моделям. Общий рублёвый счёт и прозрачная тарификация.
            </Text>

            {/* Кнопки */}
            <Flex gap={3} justify="center" flexWrap="wrap" mb={12}>
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
                  Начать бесплатно →
                </Button>
              </Link>
              <Link href="#catalog">
                <Button
                  size="lg"
                  variant="outline"
                  height="48px"
                  px={8}
                  fontSize="16px"
                  fontWeight="600"
                  borderRadius="10px"
                  borderWidth="2px"
                  borderColor="#e2e8f0"
                  color="#334155"
                  bg="white"
                  _hover={{ bg: "#f8fafc", borderColor: "#cbd5e1" }}
                >
                  Посмотреть тарифы
                </Button>
              </Link>
            </Flex>

            {/* Статистика */}
            <Flex justify="center" gap={{ base: 8, md: 12 }} flexWrap="wrap">
              <Box textAlign="center">
                <Text fontSize="2xl" fontWeight="800" color="#0f172a" lineHeight="1.2">
                  30+
                </Text>
                <Text fontSize="sm" color="#64748b" fontWeight="500">
                  моделей
                </Text>
              </Box>
              <Box textAlign="center">
                <Text fontSize="2xl" fontWeight="800" color="#0f172a" lineHeight="1.2">
                  5 сек
                </Text>
                <Text fontSize="sm" color="#64748b" fontWeight="500">
                  на старт
                </Text>
              </Box>
              <Box textAlign="center">
                <Text fontSize="2xl" fontWeight="800" color="#0f172a" lineHeight="1.2">
                  0 ₽
                </Text>
                <Text fontSize="sm" color="#64748b" fontWeight="500">
                  бесплатный тир
                </Text>
              </Box>
            </Flex>
          </Box>
        </Container>
      </Box>

      {/* Каталог моделей */}
      <Box id="catalog">
        <Container maxW="1200px" w="100%" mx="auto" py={{ base: 12, md: 16 }} px={4}>
          <Heading
            size="lg"
            textAlign="center"
            color="#0f172a"
            fontSize="1.625rem"
            fontWeight="800"
            letterSpacing="-0.02em"
            mb={2}
          >
            Каталог моделей
          </Heading>
        <Text textAlign="center" color="#64748b" fontSize="sm" mb={10}>
          Выберите категорию — ниже отобразятся модели. Клик по модели откроет чат.
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
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={6} mb={10}>
              {tiers.map((tier) => (
                <TierCard
                  key={tier.id}
                  tier={tier}
                  isSelected={selectedTierId === tier.id}
                  onSelect={() => setSelectedTierId((prev) => (prev === tier.id ? null : tier.id))}
                />
              ))}
            </SimpleGrid>

            {selectedTier && (
              <Box
                borderRadius="20px"
                border="1px solid #e5e7eb"
                bg="#ffffff"
                overflow="hidden"
                boxShadow="0 4px 24px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)"
              >
                <Box px={6} py={5}>
                  <Flex align="center" gap={2} mb={4}>
                    <Box
                      w="4px"
                      h="24px"
                      borderRadius="full"
                      bg={TIER_META[selectedTier.id]?.border ?? "#2563eb"}
                    />
                    <Heading size="md" color="#111827" fontSize="1.15rem" fontWeight="700">
                      Модели: {selectedTier.title}
                    </Heading>
                  </Flex>
                  <SimpleGrid columns={{ base: 1, lg: 2 }} gap={8}>
                    <Box>
                      <Flex align="center" gap={2} mb={4}>
                        <Box w="4px" h="20px" borderRadius="full" bg="#2563eb" />
                        <Text fontWeight="700" color="#374151" fontSize="sm">
                          Текстовые модели
                        </Text>
                      </Flex>
                      <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
                        {selectedTier.textModels.map((m) => (
                          <ModelCard
                            key={m.name}
                            item={m}
                            accentColor={TIER_META[selectedTier.id]?.accent ?? "#2563eb"}
                          />
                        ))}
                      </SimpleGrid>
                    </Box>
                    <Box>
                      <Flex align="center" gap={2} mb={4}>
                        <Box w="4px" h="20px" borderRadius="full" bg="#f59e0b" />
                        <Text fontWeight="700" color="#374151" fontSize="sm">
                          Генерация изображений
                        </Text>
                      </Flex>
                      <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
                        {selectedTier.imageModels.map((m) => (
                          <ModelCard
                            key={m.name}
                            item={m}
                            accentColor={TIER_META[selectedTier.id]?.accent ?? "#2563eb"}
                          />
                        ))}
                      </SimpleGrid>
                    </Box>
                  </SimpleGrid>
                </Box>
              </Box>
            )}

            {!selectedTier && (
              <Box
                textAlign="center"
                py={12}
                px={6}
                borderRadius="16px"
                border="1px dashed #e2e8f0"
                bg="#f8fafc"
              >
                <Text color="#94a3b8" fontSize="sm" mb={1}>
                  Выберите категорию выше
                </Text>
                <Text color="#cbd5e1" fontSize="xs">
                  Модели появятся здесь — клик откроет чат с выбранной моделью
                </Text>
              </Box>
            )}
          </>
        )}

        <Box mt={16} pt={8} borderTop="1px solid #e2e8f0" textAlign="center">
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

      {/* Почему 21day.club? */}
      <Box w="100%" py={{ base: 14, md: 20 }} px={4} bg="#f8fafc">
        <Container maxW="1200px" w="100%" mx="auto">
          <Heading
            textAlign="center"
            fontSize={{ base: "1.75rem", md: "2rem" }}
            fontWeight="800"
            color="#0f172a"
            mb={2}
          >
            Почему 21day.club?
          </Heading>
          <Text textAlign="center" color="#64748b" fontSize="lg" mb={10}>
            Единая платформа для работы со всеми моделями ИИ.
          </Text>
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={6}>
            {[
              { icon: "◉", title: "Без VPN", desc: "Прямой доступ ко всем моделям из России. Никаких прокси и обходов." },
              { icon: "▣", title: "Рублёвый счёт", desc: "Оплата в рублях. Единый баланс для всех провайдеров и моделей." },
              { icon: "↻", title: "Мгновенный старт", desc: "Регистрация за 30 секунд. Начните с бесплатных моделей прямо сейчас." },
              { icon: "◆", title: "Безопасность", desc: "Ваши данные не сохраняются. Прозрачная политика и шифрование." },
            ].map((item) => (
              <Box
                key={item.title}
                p={6}
                borderRadius="12px"
                bg="white"
                border="1px solid #e2e8f0"
                boxShadow="0 1px 3px rgba(0,0,0,0.04)"
              >
                <Flex
                  w="48px"
                  h="48px"
                  borderRadius="10px"
                  bg="rgba(37, 99, 235, 0.12)"
                  border="1px solid rgba(37, 99, 235, 0.25)"
                  align="center"
                  justify="center"
                  mb={4}
                  fontSize="24px"
                  color="#1d4ed8"
                >
                  {item.icon}
                </Flex>
                <Heading size="sm" color="#0f172a" fontSize="1.1rem" fontWeight="700" mb={2}>
                  {item.title}
                </Heading>
                <Text color="#64748b" fontSize="sm" lineHeight="1.5">
                  {item.desc}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* Готовы начать? */}
      <Box w="100%" py={{ base: 14, md: 20 }} px={4}>
        <Container maxW="1200px" w="100%" mx="auto">
          <Box
            p={{ base: 8, md: 12 }}
            borderRadius="16px"
            bg="white"
            border="1px solid #e2e8f0"
            boxShadow="0 4px 24px rgba(0,0,0,0.06)"
            textAlign="center"
          >
            <Heading fontSize={{ base: "1.5rem", md: "1.75rem" }} fontWeight="800" color="#0f172a" mb={3}>
              Готовы начать?
            </Heading>
            <Text color="#64748b" fontSize="lg" lineHeight="1.6" mb={8} maxW="520px" mx="auto">
              Создайте аккаунт за 30 секунд и получите доступ ко всем бесплатным моделям прямо сейчас.
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
                  Начать бесплатно →
                </Button>
              </Link>
              <Link href="#">
                <Button
                  size="lg"
                  variant="outline"
                  height="48px"
                  px={8}
                  fontSize="16px"
                  fontWeight="600"
                  borderRadius="10px"
                  borderWidth="2px"
                  borderColor="#e2e8f0"
                  color="#334155"
                  bg="white"
                  _hover={{ bg: "#f8fafc", borderColor: "#cbd5e1" }}
                >
                  Связаться с нами
                </Button>
              </Link>
            </Flex>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        as="footer"
        w="100%"
        py={8}
        px={4}
        bg="#f1f5f9"
        borderTop="1px solid #e2e8f0"
      >
        <Container maxW="1200px" w="100%" mx="auto">
          <Flex
            direction={{ base: "column", md: "row" }}
            align={{ base: "center", md: "center" }}
            justify="space-between"
            gap={6}
          >
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Flex
                w="40px"
                h="40px"
                borderRadius="full"
                bg="#2563eb"
                align="center"
                justify="center"
                color="white"
                fontSize="18px"
                fontWeight="800"
              >
                S
              </Flex>
              <Box>
                <Text fontWeight="800" fontSize="1.15rem" color="#0f172a">
                  21day
                </Text>
                <Text fontSize="0.9rem" color="#64748b" fontWeight="500">
                  club
                </Text>
              </Box>
            </Link>
            <Flex gap={8} flexWrap="wrap" justify="center">
              <Link href="#catalog" style={{ color: "#475569", fontWeight: "500", fontSize: "15px" }}>
                Каталог
              </Link>
              <Link href="#catalog" style={{ color: "#475569", fontWeight: "500", fontSize: "15px" }}>
                Тарифы
              </Link>
              <Link href="#" style={{ color: "#475569", fontWeight: "500", fontSize: "15px" }}>
                Документация
              </Link>
              <Link href="#" style={{ color: "#475569", fontWeight: "500", fontSize: "15px" }}>
                Поддержка
              </Link>
            </Flex>
            <Text color="#94a3b8" fontSize="14px">
              © 2026 21day.club
            </Text>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
}
