"use client";

import { FormEvent, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

import ThemeToggle from "@/app/ThemeToggle";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function ResetPasswordPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("auth.resetPassword");
  const searchParams = useSearchParams();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const [message, setMessage] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!token) {
      setStatus("error");
      setMessage(t("invalidToken"));
      return;
    }

    if (password.length < 8) {
      setStatus("error");
      setMessage(t("passwordTooShort"));
      return;
    }

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage(t("passwordMismatch"));
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            new_password: password,
          }),
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

      setTimeout(() => {
        router.push(`/${locale}/login`);
      }, 1800);
    } catch (error) {
      console.error("Reset password error:", error);

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
            🔑
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

          {status === "success" ? (
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

              <p className="mt-1 text-xs">
                {t("redirecting")}
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="relative mt-7 space-y-4"
            >

              {/* PASSWORD */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-[#46534f] dark:text-[#d4e5de]"
                >
                  {t("newPassword")}
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    required
                    minLength={8}
                    maxLength={100}
                    autoComplete="new-password"
                    placeholder={t("passwordPlaceholder")}
                    className="
                      w-full rounded-2xl
                      border border-[#d8e7e1]
                      bg-[#f8fbf9]
                      px-4 py-3.5 pr-12
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
                    "
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current
                      )
                    }
                    className="
                      absolute right-3 top-1/2
                      flex h-8 w-8
                      -translate-y-1/2
                      items-center justify-center
                      rounded-lg
                      text-[#7d8c85]
                      transition
                      hover:bg-[#eef6f2]
                      hover:text-[#143d32]

                      dark:text-[#718b81]
                      dark:hover:bg-[#17352a]
                      dark:hover:text-[#79c2a9]
                    "
                    aria-label={
                      showPassword
                        ? t("hidePassword")
                        : t("showPassword")
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </div>

              {/* CONFIRM PASSWORD */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-[#46534f] dark:text-[#d4e5de]"
                >
                  {t("confirmPassword")}
                </label>

                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value
                      )
                    }
                    required
                    minLength={8}
                    maxLength={100}
                    autoComplete="new-password"
                    placeholder={t(
                      "confirmPasswordPlaceholder"
                    )}
                    className="
                      w-full rounded-2xl
                      border border-[#d8e7e1]
                      bg-[#f8fbf9]
                      px-4 py-3.5 pr-12
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
                    "
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (current) => !current
                      )
                    }
                    className="
                      absolute right-3 top-1/2
                      flex h-8 w-8
                      -translate-y-1/2
                      items-center justify-center
                      rounded-lg
                      text-[#7d8c85]
                      transition
                      hover:bg-[#eef6f2]
                      hover:text-[#143d32]

                      dark:text-[#718b81]
                      dark:hover:bg-[#17352a]
                      dark:hover:text-[#79c2a9]
                    "
                    aria-label={
                      showConfirmPassword
                        ? t("hidePassword")
                        : t("showPassword")
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </div>

              {/* ERROR */}
              {status === "error" && (
                <div
                  className="
                    rounded-2xl
                    border border-[#f2d7d1]
                    bg-[#fff3f0]
                    px-4 py-3
                    text-sm text-[#bd5b4a]

                    dark:border-[#59312a]
                    dark:bg-[#281713]
                    dark:text-[#e58b78]
                  "
                >
                  {message}
                </div>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={status === "loading"}
                className="
                  group
                  relative w-full
                  overflow-hidden
                  rounded-full
                  bg-[#143d32]
                  px-6 py-3.5
                  text-sm font-semibold
                  text-white
                  shadow-[0_10px_28px_rgba(20,61,50,0.14)]
                  transition duration-300

                  hover:-translate-y-0.5
                  hover:bg-[#1c5143]

                  disabled:cursor-not-allowed
                  disabled:opacity-60

                  dark:bg-[#15966a]
                  dark:hover:bg-[#1caf7c]
                "
              >
                <span className="relative z-10">
                  {status === "loading"
                    ? t("resetting")
                    : t("resetPassword")}
                </span>
              </button>
            </form>
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