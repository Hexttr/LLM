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

  const showLoggedOut = isLoggedIn !== true;

  return (
    <Box
      as="header"
      w="100%"
      borderBottom="1px solid var(--navbar-border)"
      bg="var(--navbar-bg)"
      backdropFilter="saturate(180%) blur(12px)"
      position="sticky"
      top={0}
      zIndex={50}
      transition="background-color 0.2s ease, border-color 0.2s ease"
    >
      <Flex maxW="1200px" w="100%" mx="auto" px={{ base: 4, md: 6 }} py={3} align="center" justify="space-between" gap={4}>
        <Link href="/" style={{ display: "inline-block" }}>
          <Box
            lineHeight="1.15"
            letterSpacing="-0.03em"
            minW="5.25rem"
            w="5.25rem"
            textAlign="left"
          >
            <Text as="span" display="block" fontWeight="800" fontSize={{ base: "1.35rem", md: "1.5rem" }} color="var(--navbar-logo)">
              21day
            </Text>
            <Text as="span" display="block" fontWeight="600" fontSize={{ base: "0.95rem", md: "1.05rem" }} color="var(--navbar-logo-sub)">
              club
            </Text>
          </Box>
        </Link>

        <Flex align="center" gap={2} flexWrap="wrap" justify="flex-end">
          {showLoggedOut && (
            <>
              <Link href="/login">
                <Button
                  size="sm"
                  variant="outline"
                  fontWeight="600"
                  borderRadius="8px"
                  px={4}
                  sx={{
                    borderColor: "var(--card-border)",
                    color: "var(--foreground-muted)",
                    _hover: { bg: "var(--card-bg)", borderColor: "var(--foreground-subtle)" },
                  }}
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

          {!showLoggedOut && (
            <>
              <Link href="/dashboard">
                <Button
                  size="sm"
                  colorPalette="blue"
                  variant="outline"
                  fontWeight="600"
                  borderRadius="8px"
                  px={4}
                  sx={{
                    borderColor: "#2563eb",
                    color: "#2563eb",
                    _hover: { bg: "rgba(37, 99, 235, 0.1)" },
                  }}
                >
                  Кабинет
                </Button>
              </Link>
              <Button
                size="sm"
                variant="ghost"
                fontWeight="500"
                borderRadius="8px"
                px={4}
                onClick={handleLogout}
                sx={{
                  color: "var(--foreground-muted)",
                  _hover: { bg: "var(--card-bg)", color: "var(--foreground)" },
                }}
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
