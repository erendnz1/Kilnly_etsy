import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";

const locales = ["en", "tr"];

export const metadata: Metadata = {
  title: "CraftPilot AI",
  description: "AI-powered Etsy growth platform",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
  <NextIntlClientProvider messages={messages}>
    {children}
  </NextIntlClientProvider>
);
}