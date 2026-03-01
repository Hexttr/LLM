"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  Card,
  CardHeader,
  CardBody,
  Input,
  Spinner,
  Flex,
} from "@chakra-ui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { useTheme, type Theme } from "@/lib/theme-context";

interface Me {
  user: {
    id: string;
    email: string;
    apiKey: string | null;
    createdAt: string;
  };
}

interface Usage {
  spend: number;
  keys: { key?: string; spend?: number }[];
}

interface Limits {
  maxBudget: number | null;
  rpmLimit: number | null;
  tpmLimit: number | null;
  budgetDuration: string | null;
}

export default function DashboardPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [limits, setLimits] = useState<Limits | null>(null);
  const [loading, setLoading] = useState(true);
  const [copyOk, setCopyOk] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    Promise.all([
      fetch("/api/me", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/usage", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/limits", { credentials: "include" }).then((r) => r.json()),
    ]).then(([meData, usageData, limitsData]) => {
      if (meData.error && meData.error === "Unauthorized") {
        router.push("/login");
        return;
      }
      setMe(meData.user ? { user: meData.user } : null);
      setUsage(usageData.spend !== undefined ? usageData : null);
      setLimits(limitsData.error ? null : limitsData);
    }).catch(() => setMe(null)).finally(() => setLoading(false));
  }, [router]);

  const copyKey = () => {
    if (!me?.user?.apiKey) return;
    navigator.clipboard.writeText(me.user.apiKey);
    setCopyOk(true);
    setTimeout(() => setCopyOk(false), 2000);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <Box minH="100vh" bg="var(--page-bg)">
        <Navbar />
        <Flex justify="center" align="center" minH="50vh">
          <Spinner />
        </Flex>
      </Box>
    );
  }

  if (!me?.user) {
    return (
      <Box minH="100vh" bg="var(--page-bg)">
        <Navbar />
        <Container maxW="md" py={12}>
          <Text color="var(--foreground)">Требуется вход.</Text>
          <Link href="/login">
            <Button mt={4} colorScheme="blue">
              Войти
            </Button>
          </Link>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="var(--page-bg)">
      <Navbar />
      <Container maxW="800px" py={8}>
        <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={3}>
          <Heading size="lg" color="var(--foreground)">
            Личный кабинет
          </Heading>
          <Flex gap={2} align="center">
            <Text fontSize="sm" color="var(--foreground-muted)" fontWeight="500">
              Тема:
            </Text>
            <Button
              size="sm"
              variant={theme === "light" ? "solid" : "outline"}
              colorScheme="blue"
              onClick={() => setTheme("light" as Theme)}
              borderRadius="8px"
            >
              Светлая
            </Button>
            <Button
              size="sm"
              variant={theme === "dark" ? "solid" : "outline"}
              colorScheme="blue"
              onClick={() => setTheme("dark" as Theme)}
              borderRadius="8px"
            >
              Тёмная
            </Button>
            <Button size="sm" variant="outline" onClick={logout} borderRadius="8px" ml={2}>
              Выйти
            </Button>
          </Flex>
        </Flex>
        <Text color="var(--foreground-muted)" mb={4}>
          {me.user.email}
        </Text>
        <Link href="/chat" style={{ display: "inline-block", marginBottom: "1.5rem" }}>
          <Button colorScheme="blue" size="md" borderRadius="8px">
            Попробовать модель
          </Button>
        </Link>

        <Card.Root mb={6} bg="var(--card-bg)" borderColor="var(--card-border)">
          <Card.Header>
            <Heading size="md" color="var(--foreground)">API-ключ</Heading>
          </Card.Header>
          <Card.Body>
            <Text fontSize="sm" color="var(--foreground-muted)" mb={2}>
              Используйте этот ключ в заголовке Authorization: Bearer &lt;ключ&gt;
            </Text>
            <Flex gap={2}>
              <Input
                readOnly
                value={me.user.apiKey ?? "—"}
                fontFamily="mono"
                fontSize="sm"
                flex={1}
              />
              <Button
                size="sm"
                onClick={copyKey}
                disabled={!me.user.apiKey}
                colorScheme={copyOk ? "green" : "blue"}
              >
                {copyOk ? "Скопировано" : "Копировать"}
              </Button>
            </Flex>
          </Card.Body>
        </Card.Root>

        <Card.Root mb={6} bg="var(--card-bg)" borderColor="var(--card-border)">
          <Card.Header>
            <Heading size="md" color="var(--foreground)">Использование</Heading>
          </Card.Header>
          <Card.Body>
            <Text color="var(--foreground)">
              Расход (spend): <strong>${usage?.spend?.toFixed(6) ?? "0.000000"}</strong>
            </Text>
            {usage?.keys?.length ? (
              <Box mt={2}>
                <Text fontSize="sm" color="var(--foreground-muted)">
                  По ключам: {usage.keys.map((k) => `$${k.spend?.toFixed(6) ?? "0"}`).join(", ")}
                </Text>
              </Box>
            ) : null}
          </Card.Body>
        </Card.Root>

        {(limits?.rpmLimit != null || limits?.tpmLimit != null || limits?.maxBudget != null) && (
          <Card.Root bg="var(--card-bg)" borderColor="var(--card-border)">
            <Card.Header>
              <Heading size="md" color="var(--foreground)">Лимиты</Heading>
            </Card.Header>
            <Card.Body>
              <Box as="ul" listStyleType="none" p={0} m={0} color="var(--foreground)">
                {limits.rpmLimit != null && (
                  <Text as="li" mb={1}>
                    Запросов в минуту: <strong>{limits.rpmLimit}</strong>
                  </Text>
                )}
                {limits.tpmLimit != null && (
                  <Text as="li" mb={1}>
                    Токенов в минуту: <strong>{limits.tpmLimit.toLocaleString()}</strong>
                  </Text>
                )}
                {limits.maxBudget != null && (
                  <Text as="li" mb={1}>
                    Бюджет: <strong>${limits.maxBudget}</strong>
                    {limits.budgetDuration ? ` на ${limits.budgetDuration}` : ""}
                  </Text>
                )}
              </Box>
            </Card.Body>
          </Card.Root>
        )}
      </Container>
    </Box>
  );
}
