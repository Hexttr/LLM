"use client";

import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { ThemeProvider } from "@/lib/theme-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ChakraProvider value={defaultSystem}>{children}</ChakraProvider>
    </ThemeProvider>
  );
}
