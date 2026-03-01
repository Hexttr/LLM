import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

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
    <html lang="ru" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem("portal-theme");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t);})();`,
          }}
        />
      </head>
      <body style={{ fontFamily: "var(--font-inter), var(--font-sans)" }} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
