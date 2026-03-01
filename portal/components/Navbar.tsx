"use client";

import { Box, Flex, Button } from "@chakra-ui/react";
import Link from "next/link";

export function Navbar() {
  return (
    <Box as="header" borderBottom="1px solid #e2e8f0" bg="#ffffff" boxShadow="0 1px 2px rgba(0,0,0,0.04)">
      <Flex
        maxW="1200px"
        mx="auto"
        px={4}
        py={3}
        align="center"
        justify="space-between"
      >
        <Link href="/" style={{ fontWeight: 700, fontSize: "1.125rem", color: "#1a202c" }}>
          LLM API
        </Link>
        <Flex gap={2}>
          <Link href="/chat">
            <Button variant="ghost" size="sm" color="#4a5568">
              Попробовать
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost" size="sm" color="#4a5568">
              Вход
            </Button>
          </Link>
          <Link href="/register">
            <Button colorScheme="blue" size="sm" borderRadius="8px" fontWeight="600">
              Регистрация
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="sm" borderColor="#cbd5e0" color="#4a5568" borderRadius="8px">
              Кабинет
            </Button>
          </Link>
        </Flex>
      </Flex>
    </Box>
  );
}
