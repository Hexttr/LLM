"use client";

import { useEffect, useState } from "react";
import { Box, Flex, Button, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setIsLoggedIn(Boolean(data?.user)))
      .catch(() => setIsLoggedIn(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setIsLoggedIn(false);
    router.push("/");
    router.refresh();
  };

  return (
    <Box
      as="header"
      borderBottom="1px solid #e8ecf1"
      bg="rgba(255,255,255,0.92)"
      backdropFilter="saturate(180%) blur(12px)"
      position="sticky"
      top={0}
      zIndex={50}
    >
      <Flex maxW="1200px" mx="auto" px={{ base: 4, md: 6 }} py={3} align="center" justify="space-between" gap={4}>
        <Link href="/" style={{ display: "block" }}>
          <Box lineHeight="1.15" letterSpacing="-0.03em">
            <Text as="span" fontWeight="800" fontSize={{ base: "1.35rem", md: "1.5rem" }} color="#111827">
              21day
            </Text>
            <Text as="span" display="block" fontWeight="600" fontSize={{ base: "0.95rem", md: "1.05rem" }} color="#6b7280">
              club
            </Text>
          </Box>
        </Link>

        <Flex align="center" gap={2} flexWrap="wrap" justify="flex-end">
          <Link href="/chat">
            <Button
              size="sm"
              variant="ghost"
              color="#4b5563"
              fontWeight="500"
              borderRadius="8px"
              _hover={{ bg: "#f3f4f6", color: "#111827" }}
              px={4}
            >
              Попробовать
            </Button>
          </Link>

          {isLoggedIn === false && (
            <>
              <Link href="/login">
                <Button
                  size="sm"
                  variant="outline"
                  borderColor="#d1d5db"
                  color="#374151"
                  fontWeight="600"
                  borderRadius="8px"
                  _hover={{ bg: "#f9fafb", borderColor: "#9ca3af" }}
                  px={4}
                >
                  Вход
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="sm"
                  colorPalette="blue"
                  fontWeight="600"
                  borderRadius="8px"
                  bg="#2563eb"
                  color="white"
                  _hover={{ bg: "#1d4ed8" }}
                  px={5}
                >
                  Регистрация
                </Button>
              </Link>
            </>
          )}

          {isLoggedIn === true && (
            <>
              <Link href="/dashboard">
                <Button
                  size="sm"
                  colorPalette="blue"
                  variant="outline"
                  borderColor="#2563eb"
                  color="#2563eb"
                  fontWeight="600"
                  borderRadius="8px"
                  _hover={{ bg: "#eff6ff" }}
                  px={4}
                >
                  Кабинет
                </Button>
              </Link>
              <Button
                  size="sm"
                  variant="ghost"
                  color="#6b7280"
                  fontWeight="500"
                  borderRadius="8px"
                  _hover={{ bg: "#f3f4f6", color: "#374151" }}
                  px={4}
                  onClick={handleLogout}
                >
                  Выйти
                </Button>
            </>
          )}
        </Flex>
      </Flex>
    </Box>
  );
}
