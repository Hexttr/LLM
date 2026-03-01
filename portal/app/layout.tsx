import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "21day club — единый API для языковых моделей",
  description: "Один ключ — доступ к бесплатным и премиум LLM, генерация изображений. Регистрируйтесь и подключайте модели в свои приложения.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
