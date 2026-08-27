"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

import ThemeToggle from "@/app/ThemeToggle";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function VerifyEmailPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("auth.verification");
  const searchParams = useSearchParams();
const verificationStarted = useRef(false);
  const [status, setStatus] = useState<
    "waiting" | "success" | "error"
  >("waiting");

  const [message, setMessage] = useState(
    t("message")
  );

 useEffect(() => {
  if (verificationStarted.current) {
    return;
  }

  verificationStarted.current = true;

  const token = searchParams.get("token");

  if (!token) {
    setStatus("waiting");
    setMessage(t("message"));
    return;
  }

  async function verifyEmail(verificationToken: string) {
    try {
      const response = await fetch(
        `${API_URL}/auth/verify-email?token=${encodeURIComponent(
          verificationToken
        )}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
  data.detail || t("verificationFailed")
);
      }

      setStatus("success");
      setMessage(
        t("successMessage")
      );

      setTimeout(() => {
        router.push(`/${locale}/login`);
      }, 1800);
    } catch (error) {
      console.error("Email verification error:", error);

      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : t("verificationFailed")
      );
    }
  }

  verifyEmail(token);
}, [locale, router, searchParams, t]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f4faf7] px-6 py-10 dark:bg-[#06110d]">

      {/* HOME */}
      <div className="absolute left-6 top-6 z-20">
        <Link
          href={`/${locale}`}
          className="
            inline-flex items-center gap-2
            rounded-full
            border border-[#dfe9e4]
            bg-white/90
            px-4 py-2.5
            text-sm font-medium
            text-[#46534f]
            shadow-sm
            backdrop-blur
            transition duration-300

            hover:-translate-y-0.5
            hover:bg-white
            hover:text-[#143d32]

            dark:border-[#29483d]
            dark:bg-[#0c1b15]/90
            dark:text-[#c7d8d1]
            dark:hover:bg-[#12271e]
            dark:hover:text-[#79c2a9]
          "
        >
          ← CraftPilot
        </Link>
      </div>

      {/* THEME */}
      <div className="absolute right-6 top-6 z-20">
        <ThemeToggle />
      </div>

      {/* TOP GLOW */}
      <div
        className="
          pointer-events-none absolute
          left-1/2 top-[-180px]
          h-[500px] w-[800px]
          -translate-x-1/2
          rounded-full
          bg-[#bfe9d8]/45
          blur-[120px]
          dark:bg-[#0d6b4d]/25
        "
      />

      {/* CENTER GLOW */}
      <div
        className="
          pointer-events-none absolute
          left-1/2 top-1/2
          h-[400px] w-[680px]
          -translate-x-1/2 -translate-y-1/2
          rounded-full
          bg-[#d8f1e8]/35
          blur-[110px]
          dark:bg-[#0b5a41]/15
        "
      />

      {/* CARD */}
      <div className="relative z-10 w-full max-w-md">

        <div
          className="
            pointer-events-none absolute
            -inset-4
            rounded-[36px]
            bg-[#9fd8c2]/20
            blur-3xl
            dark:bg-[#15966a]/10
          "
        />

        <div
          className="
            relative overflow-hidden
            rounded-[30px]
            border border-[#d8e7e1]
            bg-white/95
            p-8
            text-center
            shadow-[0_25px_80px_rgba(20,61,50,0.11)]
            backdrop-blur-xl

            dark:border-[#1f4738]
            dark:bg-[#0c1b15]/95
            dark:shadow-[0_25px_80px_rgba(0,0,0,0.55)]
          "
        >

          {/* CARD GLOW */}
          <div
            className="
              pointer-events-none absolute
              -right-20 -top-20
              h-44 w-44
              rounded-full
              bg-[#bfe9d8]/25
              blur-3xl
              dark:bg-[#15966a]/15
            "
          />

          {/* ICON */}
          <div
            className={`
              relative mx-auto flex h-16 w-16
              items-center justify-center
              rounded-2xl
              text-xl
              font-semibold
              ${
                status === "success"
                  ? "bg-[#e7f4ee] text-[#34745f] dark:bg-[#193b30] dark:text-[#79c2a9]"
                  : status === "error"
                    ? "bg-[#fff0ed] text-[#c55b47] dark:bg-[#281713] dark:text-[#e58b78]"
                    : "bg-[#143d32] text-white dark:bg-[#15966a]"
              }
            `}
          >
            {status === "success"
              ? "✓"
              : status === "error"
                ? "!"
                : "✉"}
          </div>

          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#4b9b83]">
            CraftPilot AI
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#143d32] dark:text-[#f1f7f4]">
  {status === "success"
    ? t("emailVerified")
    : status === "error"
      ? t("verificationFailed")
      : t("checkEmail")}
</h1>

          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#697671] dark:text-[#9fb4ab]">
            {message}
          </p>

          {status === "waiting" && (
            <div className="mt-7 rounded-2xl bg-[#f4faf7] p-4 text-left dark:bg-[#12271e]">
              <p className="text-sm font-medium text-[#46534f] dark:text-[#d4e5de]">
                {t("nextSteps")}
              </p>

              <p className="mt-2 text-xs leading-5 text-[#7a8782] dark:text-[#839a90]">
                {t("nextStepsDescription")}
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="mt-7 rounded-2xl bg-[#f2faf6] px-4 py-3 text-sm text-[#34745f] dark:bg-[#19352a] dark:text-[#79c2a9]">
              {t("redirecting")}
            </div>
          )}

          {status === "error" && (
            <Link
              href={`/${locale}/login`}
              className="
                mt-7 inline-flex
                rounded-full
                bg-[#143d32]
                px-6 py-3.5
                text-sm font-semibold
                text-white
                transition

                hover:-translate-y-0.5
                hover:bg-[#1c5143]

                dark:bg-[#15966a]
                dark:hover:bg-[#1caf7c]
              "
            >
              {t("backToLogin")}
            </Link>
          )}

        </div>
      </div>

    </main>
  );
}