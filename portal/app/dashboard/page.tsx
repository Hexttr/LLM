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

export default function DashboardPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [copyOk, setCopyOk] = useState(false);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetch("/api/me", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/usage", { credentials: "include" }).then((r) => r.json()),
    ]).then(([meData, usageData]) => {
      if (meData.error && meData.error === "Unauthorized") {
        router.push("/login");
        return;
      }
      setMe(meData.user ? { user: meData.user } : null);
      setUsage(usageData.spend !== undefined ? usageData : null);
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
      <Box minH="100vh" bg="gray.50">
        <Navbar />
        <Flex justify="center" align="center" minH="50vh">
          <Spinner />
        </Flex>
      </Box>
    );
  }

  if (!me?.user) {
    return (
      <Box minH="100vh" bg="gray.50">
        <Navbar />
        <Container maxW="md" py={12}>
          <Text>Требуется вход.</Text>
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
    <Box minH="100vh" bg="gray.50">
      <Navbar />
      <Container maxW="800px" py={8}>
        <Flex justify="space-between" align="center" mb={8}>
          <Heading size="lg">Личный кабинет</Heading>
          <Button size="sm" variant="outline" onClick={logout}>
            Выйти
          </Button>
        </Flex>
        <Text color="gray.600" mb={4}>
          {me.user.email}
        </Text>
        <Link href="/chat" style={{ display: "inline-block", marginBottom: "1.5rem" }}>
          <Button colorScheme="blue" size="md" borderRadius="8px">
            Попробовать модель
          </Button>
        </Link>

        <Card.Root mb={6}>
          <Card.Header>
            <Heading size="md">API-ключ</Heading>
          </Card.Header>
          <Card.Body>
            <Text fontSize="sm" color="gray.600" mb={2}>
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

        <Card.Root>
          <Card.Header>
            <Heading size="md">Использование</Heading>
          </Card.Header>
          <Card.Body>
            <Text>
              Расход (spend): <strong>${usage?.spend?.toFixed(6) ?? "0.000000"}</strong>
            </Text>
            {usage?.keys?.length ? (
              <Box mt={2}>
                <Text fontSize="sm" color="gray.600">
                  По ключам: {usage.keys.map((k) => `$${k.spend?.toFixed(6) ?? "0"}`).join(", ")}
                </Text>
              </Box>
            ) : null}
          </Card.Body>
        </Card.Root>
      </Container>
    </Box>
  );
}
