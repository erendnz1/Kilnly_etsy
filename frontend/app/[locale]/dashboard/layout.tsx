"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import {
  BarChart3,
  Bell,
  Calculator,
  LayoutDashboard,
  Menu,
  Package,
  Settings,
  Sparkles,
  Store,
  X,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

type CurrentUser = {
  id: number;
  email: string;
  created_at: string;
  is_email_verified: boolean;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("dashboard");

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
const [etsyShopName, setEtsyShopName] = useState<string | null>(null);
const [isCheckingEtsy, setIsCheckingEtsy] = useState(true);
  useEffect(() => {
    let mounted = true;

    async function checkAuthentication() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        router.replace(`/${locale}/login`);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          localStorage.removeItem("access_token");
          router.replace(`/${locale}/login`);
          return;
        }

        const data: CurrentUser = await response.json();

        if (!mounted) return;

        setUser(data);
        setIsCheckingAuth(false);
      } catch (error) {
        console.error(
          "Authentication check failed:",
          error
        );

        localStorage.removeItem("access_token");
        router.replace(`/${locale}/login`);
      }
    }

    checkAuthentication();

    return () => {
      mounted = false;
    };
  }, [locale, router]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen
      ? "hidden"
      : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);
   useEffect(() => {
    async function checkEtsyConnection() {
      const token =
        localStorage.getItem("access_token");

      if (!token) {
        setIsCheckingEtsy(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/etsy/shop`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          setEtsyShopName(null);
          return;
        }

        const data = await response.json();

        setEtsyShopName(
          data.shop_name || null
        );
      } catch (error) {
        console.error(
          "Etsy connection check failed:",
          error
        );

        setEtsyShopName(null);
      } finally {
        setIsCheckingEtsy(false);
      }
    }

    checkEtsyConnection();
  }, []);
  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4faf7] dark:bg-[#06110d]">
        <div className="flex flex-col items-center gap-4">
          <div
            className="
              h-10 w-10
              animate-spin
              rounded-full
              border-2
              border-[#d8e7e1]
              border-t-[#15966a]
              dark:border-[#29483d]
              dark:border-t-[#15966a]
            "
          />

          <p className="text-sm text-[#697671] dark:text-[#9fb4ab]">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  const navigation = [
    {
      href: `/${locale}/dashboard`,
      label: t("navigation.dashboard"),
      icon: LayoutDashboard,
    },
    {
      href: `/${locale}/dashboard/products`,
      label: t("navigation.products"),
      icon: Package,
    },
    {
  href: `/${locale}/dashboard/ai-product-analyzer`,
  label: t("navigation.aiProductAnalyzer"),
  icon: Sparkles,
},
    {
      href: `/${locale}/dashboard/analytics`,
      label: t("navigation.analytics"),
      icon: BarChart3,
    },
    {
      href: `/${locale}/dashboard/insights`,
      label: t("navigation.aiInsights"),
      icon: Sparkles,
    },
    {
  href: `/${locale}/dashboard/price-profit`,
  label: t("navigation.priceProfit"),
  icon: Calculator,
},
    {
      href: `/${locale}/dashboard/notifications`,
      label: t("navigation.notifications"),
      icon: Bell,
    },
    {
      href: `/${locale}/dashboard/settings`,
      label: t("navigation.settings"),
      icon: Settings,
    },
  ];

  const userInitial =
    user?.email?.charAt(0).toUpperCase() || "U";

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }
function handleLogout() {
  localStorage.removeItem("access_token");
  setUser(null);
  router.replace(`/${locale}/login`);
}
async function handleConnectEtsy() {
  const token =
    localStorage.getItem("access_token");

  if (!token) {
    router.replace(`/${locale}/login`);
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/etsy/connect-url`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
          "Unable to connect Etsy."
      );
    }

    window.location.href =
      data.authorization_url;
  } catch (error) {
    console.error(
      "Etsy connection error:",
      error
    );
  }
}
  function renderNavigation() {
    return (
      <div className="space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobileMenu}
              className="
                group flex items-center gap-3
                rounded-xl px-3 py-2.5
                text-sm font-medium
                text-[#65736e]
                transition
                hover:bg-[#f0f7f3]
                hover:text-[#143d32]

                dark:text-[#9fb4ab]
                dark:hover:bg-[#12271e]
                dark:hover:text-[#f1f7f4]
              "
            >
              <Icon
                size={18}
                strokeWidth={1.8}
                className="
                  transition
                  group-hover:text-[#15966a]
                "
              />

              {item.label}
            </Link>
          );
        })}
      </div>
    );
  }

  function renderStoreConnection() {
  const isConnected = Boolean(etsyShopName);

  if (isCheckingEtsy) {
    return (
      <div
        className="
          rounded-2xl
          border border-[#d8e7e1]
          bg-[#f4faf7]
          p-4
          dark:border-[#29483d]
          dark:bg-[#12231c]
        "
      >
        <div className="flex items-center gap-2">
          <Store
            size={16}
            className="text-[#4b9b83]"
          />

          <span className="text-xs font-semibold">
            Etsy
          </span>
        </div>

        <p className="mt-2 text-xs text-[#7a8782]">
          Checking connection...
        </p>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div
        className="
          rounded-2xl
          border border-[#cfe5dc]
          bg-[#f4faf7]
          p-4
          dark:border-[#29483d]
          dark:bg-[#12231c]
        "
      >
        <div className="flex items-center gap-2">
          <Store
            size={16}
            className="text-[#15966a]"
          />

          <span className="text-xs font-semibold">
            Etsy connected
          </span>
        </div>

        <p className="mt-2 truncate text-xs font-medium text-[#143d32] dark:text-[#f1f7f4]">
          {etsyShopName}
        </p>

        <p className="mt-1 text-xs text-[#7a8782] dark:text-[#839a90]">
          Your Etsy shop is connected.
        </p>
      </div>
    );
  }

  return (
    <div
      className="
        rounded-2xl
        border border-[#d8e7e1]
        bg-[#f4faf7]
        p-4
        dark:border-[#29483d]
        dark:bg-[#12231c]
      "
    >
      <div className="flex items-center gap-2">
        <Store
          size={16}
          className="text-[#4b9b83]"
        />

        <span className="text-xs font-semibold">
          {t("store.notConnected")}
        </span>
      </div>

      <p className="mt-2 text-xs leading-5 text-[#7a8782] dark:text-[#839a90]">
        {t("store.connectDescription")}
      </p>

      <button
        type="button"
        onClick={handleConnectEtsy}
        className="
          mt-3 w-full
          rounded-xl
          bg-[#143d32]
          px-3 py-2
          text-xs font-semibold
          text-white
          transition
          hover:bg-[#1c5143]

          dark:bg-[#15966a]
          dark:hover:bg-[#1caf7c]
        "
      >
        {t("store.connect")}
      </button>
    </div>
  );
}

  function renderUser() {
  return (
    <div className="space-y-3">

      <div className="flex items-center gap-3">
        <div
          className="
            flex h-9 w-9
            shrink-0
            items-center justify-center
            rounded-full
            bg-[#dff1e9]
            text-xs font-semibold
            text-[#34745f]
            dark:bg-[#193b30]
            dark:text-[#79c2a9]
          "
        >
          {userInitial}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {user?.email || t("user.account")}
          </p>

          <p className="text-xs text-[#899690]">
            {t("user.freePlan")}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="
          w-full
          rounded-xl
          border border-[#d8e7e1]
          bg-white
          px-3 py-2
          text-xs font-medium
          text-[#65736e]
          transition

          hover:border-[#c7ddd4]
          hover:bg-[#f4faf7]
          hover:text-[#143d32]

          dark:border-[#29483d]
          dark:bg-[#12231c]
          dark:text-[#9fb4ab]
          dark:hover:bg-[#17352a]
          dark:hover:text-[#f1f7f4]
        "
      >
        {t("user.logout")}
      </button>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-[#f4faf7] text-[#143d32] dark:bg-[#06110d] dark:text-[#f1f7f4]">

      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={closeMobileMenu}
          className="
            fixed inset-0 z-40
            bg-[#143d32]/20
            backdrop-blur-sm
            lg:hidden
          "
        />
      )}

      {/* DESKTOP SIDEBAR */}
      <aside
        className="
          fixed inset-y-0 left-0 z-40
          hidden w-64
          border-r border-[#dfe9e4]
          bg-white/95
          backdrop-blur-xl
          lg:flex lg:flex-col
          dark:border-[#1f4738]
          dark:bg-[#0a1812]/95
        "
      >
        {/* LOGO */}
        <div className="flex h-20 items-center px-6">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-3"
          >
            <div
              className="
                flex h-10 w-10
                items-center justify-center
                rounded-xl
                bg-[#143d32]
                text-sm font-bold text-white
                dark:bg-[#15966a]
              "
            >
              C
            </div>

            <div>
              <p className="text-sm font-semibold">
                CraftPilot
              </p>

              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#4b9b83]">
                AI
              </p>
            </div>
          </Link>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-4 py-5">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a9892]">
            {t("navigation.menu")}
          </p>

          {renderNavigation()}
        </nav>

        {/* STORE CONNECTION */}
        <div className="px-4 pb-4">
          {renderStoreConnection()}
        </div>

        {/* USER */}
        <div
          className="
            border-t border-[#dfe9e4]
            p-4
            dark:border-[#1f4738]
          "
        >
          {renderUser()}
        </div>
      </aside>

      {/* MOBILE SIDEBAR */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex w-[280px] flex-col
          border-r border-[#dfe9e4]
          bg-white
          shadow-[20px_0_60px_rgba(20,61,50,0.12)]
          transition-transform duration-300
          lg:hidden
          dark:border-[#1f4738]
          dark:bg-[#0a1812]
          dark:shadow-[20px_0_60px_rgba(0,0,0,0.45)]
          ${
            isMobileMenuOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        {/* MOBILE LOGO */}
        <div className="flex h-20 items-center justify-between px-5">
          <Link
            href={`/${locale}`}
            onClick={closeMobileMenu}
            className="flex items-center gap-3"
          >
            <div
              className="
                flex h-10 w-10
                items-center justify-center
                rounded-xl
                bg-[#143d32]
                text-sm font-bold text-white
                dark:bg-[#15966a]
              "
            >
              C
            </div>

            <div>
              <p className="text-sm font-semibold">
                CraftPilot
              </p>

              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#4b9b83]">
                AI
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={closeMobileMenu}
            aria-label="Close menu"
            className="
              flex h-10 w-10
              items-center justify-center
              rounded-xl
              text-[#65736e]
              transition
              hover:bg-[#f0f7f3]
              hover:text-[#143d32]

              dark:text-[#9fb4ab]
              dark:hover:bg-[#12271e]
              dark:hover:text-[#f1f7f4]
            "
          >
            <X size={20} />
          </button>
        </div>

        {/* MOBILE NAV */}
        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a9892]">
            {t("navigation.menu")}
          </p>

          {renderNavigation()}
        </nav>

        {/* MOBILE STORE */}
        <div className="px-4 pb-4">
          {renderStoreConnection()}
        </div>

        {/* MOBILE USER */}
        <div
          className="
            border-t border-[#dfe9e4]
            p-4
            dark:border-[#1f4738]
          "
        >
          {renderUser()}
        </div>
      </aside>

      {/* MAIN */}
      <main className="min-h-screen lg:pl-64">

        {/* MOBILE HEADER */}
        <div
          className="
            sticky top-0 z-30
            flex h-16
            items-center justify-between
            border-b border-[#dfe9e4]
            bg-white/90
            px-4
            backdrop-blur-xl
            lg:hidden
            dark:border-[#1f4738]
            dark:bg-[#0a1812]/90
          "
        >
          <button
            type="button"
            onClick={() =>
              setIsMobileMenuOpen(true)
            }
            aria-label="Open menu"
            className="
              flex h-10 w-10
              items-center justify-center
              rounded-xl
              border border-[#d8e7e1]
              bg-white
              text-[#143d32]
              transition
              hover:bg-[#f0f7f3]

              dark:border-[#29483d]
              dark:bg-[#12231c]
              dark:text-[#f1f7f4]
            "
          >
            <Menu size={20} />
          </button>

          <Link
            href={`/${locale}/dashboard`}
            className="flex items-center gap-2"
          >
            <div
              className="
                flex h-8 w-8
                items-center justify-center
                rounded-lg
                bg-[#143d32]
                text-xs font-bold text-white
                dark:bg-[#15966a]
              "
            >
              C
            </div>

            <span className="text-sm font-semibold">
              CraftPilot
            </span>
          </Link>

          <div
            className="
              flex h-9 w-9
              items-center justify-center
              rounded-full
              bg-[#dff1e9]
              text-xs font-semibold
              text-[#34745f]
              dark:bg-[#193b30]
              dark:text-[#79c2a9]
            "
          >
            {userInitial}
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}