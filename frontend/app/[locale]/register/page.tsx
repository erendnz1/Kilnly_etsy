"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import ThemeToggle from "@/app/ThemeToggle";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function RegisterPage() {
  const router = useRouter();
const locale = useLocale();
const t = useTranslations("auth.register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
  email: email.trim(),
  password,
  locale,
}),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || t("registrationFailed"));
        return;
      }

      router.push(`/${locale}/verify-email`);
    } catch (error) {
      console.error("Register error:", error);

      setError(t("backendError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f4faf7] px-6 py-10 dark:bg-[#06110d]">
    <div className="absolute left-6 top-6 z-20">
  <button
    type="button"
    onClick={() => router.push(`/${locale}`)}
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
    <ArrowLeft size={16} strokeWidth={1.8} />
    CraftPilot
  </button>
</div>
      {/* THEME TOGGLE */}
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

      {/* LEFT GLOW */}
      <div
        className="
          pointer-events-none absolute
          -left-40 bottom-[-120px]
          h-[380px] w-[380px]
          rounded-full
          bg-[#bfe9d8]/25
          blur-[100px]
          dark:bg-[#15966a]/10
        "
      />

      {/* RIGHT GLOW */}
      <div
        className="
          pointer-events-none absolute
          -right-40 top-[25%]
          h-[340px] w-[340px]
          rounded-full
          bg-[#bfe9d8]/20
          blur-[100px]
          dark:bg-[#15966a]/10
        "
      />

      {/* SUBTLE ARC */}
      <div
        className="
          pointer-events-none absolute
          left-1/2 top-[9%]
          h-[700px] w-[1080px]
          -translate-x-1/2
          rounded-[50%]
          border-t border-[#9acdb8]/15
          dark:border-[#2fbd8a]/10
        "
      />

      {/* REGISTER CARD */}
      <div className="relative z-10 w-full max-w-md">

        {/* CARD GLOW */}
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
            p-7
            shadow-[0_25px_80px_rgba(20,61,50,0.11)]
            backdrop-blur-xl

            dark:border-[#1f4738]
            dark:bg-[#0c1b15]/95
            dark:shadow-[0_25px_80px_rgba(0,0,0,0.55)]

            sm:p-8
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

          {/* BRAND */}
          <div className="relative text-center">

            <div
              className="
                mx-auto flex h-13 w-13
                items-center justify-center
                rounded-2xl
                bg-[#143d32]
                text-lg font-bold text-white
                shadow-[0_10px_26px_rgba(20,61,50,0.16)]

                dark:bg-[#15966a]
                dark:shadow-[0_0_26px_rgba(21,150,106,0.22)]
              "
            >
              C
            </div>

            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#4b9b83]">
              CraftPilot AI
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#143d32] dark:text-[#f1f7f4]">
              {t("title")}
            </h1>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#697671] dark:text-[#9fb4ab]">
              {t("description")}
            </p>

          </div>

          {/* FORM */}
          <form
            onSubmit={handleSubmit}
            className="relative mt-7 space-y-4"
          >

            {/* EMAIL */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-[#46534f] dark:text-[#c7d8d1]"
              >
                {t("email")}
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder={t("emailPlaceholder")}
                className="
                  w-full rounded-2xl
                  border border-[#dce8e3]
                  bg-[#fbfdfc]
                  px-4 py-3.5
                  text-sm text-[#18221e]
                  outline-none
                  transition duration-300

                  placeholder:text-[#9aa6a1]

                  focus:border-[#55a98d]
                  focus:ring-4
                  focus:ring-[#55a98d]/10

                  dark:border-[#29483d]
                  dark:bg-[#0c2119]
                  dark:text-[#eef8f3]
                  dark:placeholder:text-[#688379]

                  dark:focus:border-[#3f9c78]
                  dark:focus:ring-[#15966a]/10
                "
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-[#46534f] dark:text-[#c7d8d1]"
              >
                {t("password")}
              </label>

              <div className="relative">

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder={t("passwordPlaceholder")}
                  className="
                    w-full rounded-2xl
                    border border-[#dce8e3]
                    bg-[#fbfdfc]
                    px-4 py-3.5 pr-12
                    text-sm text-[#18221e]
                    outline-none
                    transition duration-300

                    placeholder:text-[#9aa6a1]

                    focus:border-[#55a98d]
                    focus:ring-4
                    focus:ring-[#55a98d]/10

                    dark:border-[#29483d]
                    dark:bg-[#0c2119]
                    dark:text-[#eef8f3]
                    dark:placeholder:text-[#688379]

                    dark:focus:border-[#3f9c78]
                    dark:focus:ring-[#15966a]/10
                  "
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  aria-label={
  showPassword
    ? t("hidePassword")
    : t("showPassword")
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
                >
                  {showPassword ? (
                    <EyeOff size={17} strokeWidth={1.8} />
                  ) : (
                    <Eye size={17} strokeWidth={1.8} />
                  )}
                </button>

              </div>
            </div>

            {/* CONFIRM PASSWORD */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-[#46534f] dark:text-[#c7d8d1]"
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
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder={t("confirmPasswordPlaceholder")}
                  className="
                    w-full rounded-2xl
                    border border-[#dce8e3]
                    bg-[#fbfdfc]
                    px-4 py-3.5 pr-12
                    text-sm text-[#18221e]
                    outline-none
                    transition duration-300

                    placeholder:text-[#9aa6a1]

                    focus:border-[#55a98d]
                    focus:ring-4
                    focus:ring-[#55a98d]/10

                    dark:border-[#29483d]
                    dark:bg-[#0c2119]
                    dark:text-[#eef8f3]
                    dark:placeholder:text-[#688379]

                    dark:focus:border-[#3f9c78]
                    dark:focus:ring-[#15966a]/10
                  "
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (current) => !current
                    )
                  }
                  aria-label={
  showPassword
    ? t("hidePassword")
    : t("showPassword")
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
                >
                  {showConfirmPassword ? (
                    <EyeOff size={17} strokeWidth={1.8} />
                  ) : (
                    <Eye size={17} strokeWidth={1.8} />
                  )}
                </button>

              </div>
            </div>

            {/* ERROR */}
            {error && (
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
                {error}
              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="
                group
                relative w-full
                overflow-hidden
                rounded-full
                bg-[#143d32]
                px-6 py-3.5
                text-sm font-semibold text-white

                shadow-[0_10px_28px_rgba(20,61,50,0.14)]

                transition duration-300

                hover:-translate-y-0.5
                hover:bg-[#1c5143]
                hover:shadow-[0_15px_32px_rgba(20,61,50,0.20)]

                disabled:cursor-not-allowed
                disabled:opacity-60

                dark:bg-[#15966a]
                dark:shadow-[0_0_28px_rgba(21,150,106,0.20)]

                dark:hover:bg-[#1caf7c]
                dark:hover:shadow-[0_0_38px_rgba(34,197,139,0.26)]
              "
            >
              <span className="relative z-10">
                {loading
                  ? t("creatingAccount")
                  : t("createAccount")}
              </span>

              <span
                className="
                  pointer-events-none absolute
                  inset-0
                  bg-gradient-to-r
                  from-transparent
                  via-white/10
                  to-transparent
                  opacity-0
                  transition
                  duration-700
                  group-hover:translate-x-full
                  group-hover:opacity-100
                "
              />
            </button>

          </form>

          {/* DIVIDER */}
          <div className="relative my-6 flex items-center">

            <div className="h-px flex-1 bg-[#e5ece9] dark:bg-[#203a31]" />

            <span className="px-4 text-xs text-[#9aa6a1] dark:text-[#668177]">
              {t("alreadyHaveAccount")}
            </span>

            <div className="h-px flex-1 bg-[#e5ece9] dark:bg-[#203a31]" />

          </div>

          {/* LOGIN */}
          <button
            type="button"
            onClick={() => router.push(`/${locale}/login`)}
            className="
              w-full rounded-full
              border border-[#cfe0d9]
              bg-white
              px-6 py-3.5
              text-sm font-semibold
              text-[#143d32]

              transition duration-300

              hover:-translate-y-0.5
              hover:bg-[#f4f8f6]
              hover:border-[#b6d1c6]

              dark:border-[#315548]
              dark:bg-[#10241c]
              dark:text-[#bfe3d5]
              dark:hover:bg-[#17352a]
              dark:hover:border-[#3d725d]
            "
          >
            {t("signIn")}
          </button>

          {/* FOOTNOTE */}
          <p className="mt-5 text-center text-xs leading-5 text-[#929d99] dark:text-[#668177]">
            {t("terms")}
          </p>

        </div>
      </div>

    </main>
  );
}