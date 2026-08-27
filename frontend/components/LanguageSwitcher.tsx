"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function LanguageSwitcher() {
  const pathname = usePathname();

  const isTurkish = pathname.startsWith("/tr");
  const currentLocale = isTurkish ? "tr" : "en";
  const nextLocale = isTurkish ? "en" : "tr";

  const newPath =
    pathname.replace(/^\/(tr|en)/, `/${nextLocale}`) ||
    `/${nextLocale}`;

  return (
    <Link
      href={newPath}
      className="flex items-center gap-2 rounded-full border border-[#dfe9e4] bg-white px-3.5 py-2 text-sm font-medium text-[#143d32] transition hover:border-[#bcd3ca] hover:bg-[#f4faf7]"
    >
      <span>🌐</span>
      <span>{currentLocale.toUpperCase()}</span>
      <span className="text-xs">⌄</span>
    </Link>
  );
}