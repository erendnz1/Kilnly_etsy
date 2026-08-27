"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import ThemeToggle from "@/app/ThemeToggle";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const t = useTranslations("auth.forgotPassword");

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/auth/forgot-password?email=${encodeURIComponent(
          email
        )}&locale=${locale}`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || t("error")
        );
      }

      setStatus("success");
      setMessage(t("success"));
    } catch (error) {
      console.error("Forgot password error:", error);

      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : t("error")
      );
    }
  }

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
            className="
              relative mx-auto flex h-16 w-16
              items-center justify-center
              rounded-2xl
              bg-[#143d32]
              text-xl
              text-white
              dark:bg-[#15966a]
            "
          >
            ↻
          </div>

          <p className="mt-5 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[#4b9b83]">
            CraftPilot AI
          </p>

          <h1 className="mt-3 text-center text-3xl font-semibold tracking-tight text-[#143d32] dark:text-[#f1f7f4]">
            {t("title")}
          </h1>

          <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-6 text-[#697671] dark:text-[#9fb4ab]">
            {t("description")}
          </p>

          {status !== "success" ? (
            <form
              onSubmit={handleSubmit}
              className="relative mt-7"
            >
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-[#46534f] dark:text-[#d4e5de]"
              >
                {t("email")}
              </label>

              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder={t("emailPlaceholder")}
                className="
                  w-full rounded-2xl
                  border border-[#d8e7e1]
                  bg-[#f8fbf9]
                  px-4 py-3.5
                  text-sm text-[#143d32]
                  outline-none
                  transition

                  placeholder:text-[#9aa7a2]
                  focus:border-[#4b9b83]
                  focus:ring-4
                  focus:ring-[#bfe9d8]/40

                  dark:border-[#29483d]
                  dark:bg-[#12231c]
                  dark:text-[#f1f7f4]
                  dark:placeholder:text-[#70877d]
                  dark:focus:border-[#4b9b83]
                  dark:focus:ring-[#15966a]/15
                "
              />

              {status === "error" && (
                <p className="mt-3 text-sm text-[#c55b47] dark:text-[#e58b78]">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="
                  mt-5 w-full
                  rounded-full
                  bg-[#143d32]
                  px-6 py-3.5
                  text-sm font-semibold
                  text-white
                  transition

                  hover:-translate-y-0.5
                  hover:bg-[#1c5143]
                  disabled:cursor-not-allowed
                  disabled:opacity-60

                  dark:bg-[#15966a]
                  dark:hover:bg-[#1caf7c]
                "
              >
                {status === "loading"
                  ? t("sending")
                  : t("sendResetLink")}
              </button>
            </form>
          ) : (
            <div
              className="
                relative mt-7
                rounded-2xl
                bg-[#f2faf6]
                px-5 py-4
                text-center
                text-sm leading-6
                text-[#34745f]

                dark:bg-[#19352a]
                dark:text-[#79c2a9]
              "
            >
              {message}
            </div>
          )}

          <div className="relative mt-6 text-center">
            <Link
              href={`/${locale}/login`}
              className="
                text-sm font-medium
                text-[#34745f]
                transition
                hover:text-[#143d32]

                dark:text-[#79c2a9]
                dark:hover:text-[#a5dbc5]
              "
            >
              ← {t("backToLogin")}
            </Link>
          </div>

        </div>
      </div>

    </main>
  );
}