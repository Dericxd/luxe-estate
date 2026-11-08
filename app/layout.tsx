import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";
import { getServerDictionary } from "./i18n/dictionaries";
import { LanguageProvider } from "./i18n/LanguageContext";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getServerDictionary();
  return {
    title: dict.metadata.title,
    description: dict.metadata.description,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale, dict } = await getServerDictionary();

  return (
    <html lang={locale} className="antialiased selection:bg-mosque selection:text-white" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-background-light dark:bg-background-dark text-nordic-dark dark:text-white font-display transition-colors duration-300">
        <ThemeProvider>
          <LanguageProvider initialLocale={locale} initialDictionary={dict}>
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
