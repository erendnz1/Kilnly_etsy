"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Package,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Store,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

type EtsyShop = {
  shop_id: number;
  shop_name: string;
  title: string | null;
  currency_code: string;
  listing_active_count: number;
  transaction_sold_count: number;
  review_count: number;
  num_favorers: number;
  url: string;
  icon_url_fullxfull: string | null;
  is_vacation: boolean;
};

type EtsyListingsResponse = {
  count: number;
  results: Array<{
    listing_id: number;
    title: string;
    state: string;
    quantity: number;
    price: {
      amount: number;
      divisor: number;
      currency_code: string;
    };
    url: string;
  }>;
};

export default function DashboardPage() {
  const locale = useLocale();
  const t = useTranslations("dashboard");

  const [shop, setShop] = useState<EtsyShop | null>(null);
  const [listingCount, setListingCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isConnectingEtsy, setIsConnectingEtsy] =
    useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [etsyError, setEtsyError] = useState("");

  async function loadDashboardData() {
    const token =
      localStorage.getItem("access_token");

    if (!token) {
      window.location.href = `/${locale}/login`;
      return;
    }

    setEtsyError("");

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [shopResponse, listingsResponse] =
        await Promise.all([
          fetch(`${API_URL}/etsy/shop`, {
            method: "GET",
            headers,
          }),

          fetch(
            `${API_URL}/etsy/listings?state=active`,
            {
              method: "GET",
              headers,
            }
          ),
        ]);

      if (
        shopResponse.status === 404 ||
        listingsResponse.status === 404
      ) {
        setShop(null);
        setListingCount(0);
        return;
      }

      if (!shopResponse.ok) {
        const data = await shopResponse.json();

        throw new Error(
          data.detail ||
          "Unable to load Etsy shop."
        );
      }

      if (!listingsResponse.ok) {
        const data = await listingsResponse.json();

        throw new Error(
          data.detail ||
          "Unable to load Etsy listings."
        );
      }

      const shopData: EtsyShop =
        await shopResponse.json();

      const listingsData: EtsyListingsResponse =
        await listingsResponse.json();

      setShop(shopData);
      setListingCount(
        listingsData.count ?? 0
      );
    } catch (error) {
      console.error(
        "Dashboard Etsy data error:",
        error
      );

      setEtsyError(
        error instanceof Error
          ? error.message
          : "Unable to load Etsy data."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function handleConnectEtsy() {
    const token =
      localStorage.getItem("access_token");

    if (!token) {
      window.location.href = `/${locale}/login`;
      return;
    }

    setIsConnectingEtsy(true);
    setEtsyError("");

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
          "Unable to connect your Etsy shop."
        );
      }

      if (!data.authorization_url) {
        throw new Error(
          "Etsy authorization URL is missing."
        );
      }

      window.location.href =
        data.authorization_url;
    } catch (error) {
      console.error(
        "Etsy connection error:",
        error
      );

      setEtsyError(
        error instanceof Error
          ? error.message
          : "Unable to connect your Etsy shop."
      );

      setIsConnectingEtsy(false);
    }
  }

  async function handleSyncListings() {
    const token =
      localStorage.getItem("access_token");

    if (!token) {
      window.location.href = `/${locale}/login`;
      return;
    }

    setIsSyncing(true);
    setEtsyError("");

    try {
      const response = await fetch(
        `${API_URL}/etsy/sync-listings`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Unable to synchronize Etsy listings."
        );
      }

      await loadDashboardData();
    } catch (error) {
      console.error(
        "Etsy sync error:",
        error
      );

      setEtsyError(
        error instanceof Error
          ? error.message
          : "Unable to synchronize Etsy listings."
      );
    } finally {
      setIsSyncing(false);
    }
  }

  const hasConnectedShop = Boolean(shop);

  return (
    <div className="min-h-screen">

      {/* HEADER */}
      <header
        className="
          flex items-center justify-between
          border-b border-[#dfe9e4]
          bg-white/80
          px-6 py-5
          backdrop-blur-xl
          lg:px-10
          dark:border-[#1f4738]
          dark:bg-[#0a1812]/80
        "
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4b9b83]">
            CraftPilot AI
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {t("greeting")}
          </h1>
        </div>

        <div
          className="
            flex h-10 w-10 items-center justify-center
            rounded-full
            border border-[#d8e7e1]
            bg-white
            text-sm font-semibold
            text-[#34745f]
            dark:border-[#29483d]
            dark:bg-[#12231c]
            dark:text-[#79c2a9]
          "
        >
          U
        </div>
      </header>

      <div className="px-6 py-8 lg:px-10 lg:py-10">

        {/* ERROR */}
        {etsyError && (
          <div
            className="
              mb-6
              rounded-2xl
              border border-[#f1c9c0]
              bg-[#fff4f1]
              px-4 py-3
              text-sm
              text-[#a64c3c]

              dark:border-[#5a2b22]
              dark:bg-[#281713]
              dark:text-[#e58b78]
            "
          >
            {etsyError}
          </div>
        )}

        {/* HERO */}
        <section
          className="
            relative overflow-hidden
            rounded-[28px]
            border border-[#cfe5dc]
            bg-gradient-to-br
            from-[#edf9f3]
            via-white
            to-[#e4f4ed]
            p-7
            shadow-[0_20px_60px_rgba(20,61,50,0.07)]
            lg:p-10
            dark:border-[#285140]
            dark:from-[#0d241a]
            dark:via-[#0b1b15]
            dark:to-[#102c20]
          "
        >
          <div
            className="
              pointer-events-none absolute
              -right-24 -top-24
              h-72 w-72
              rounded-full
              bg-[#9fd8c2]/30
              blur-3xl
              dark:bg-[#15966a]/10
            "
          />

          <div className="relative max-w-3xl">

            {/* CONNECTION STATUS */}
            {isLoading ? (
              <div
                className="
                  mb-5 inline-flex items-center gap-2
                  rounded-full
                  bg-white/80
                  px-3 py-1.5
                  text-xs font-medium
                  text-[#697671]
                  shadow-sm
                  dark:bg-[#19352a]
                  dark:text-[#9fb4ab]
                "
              >
                <span
                  className="
                    h-2.5 w-2.5
                    animate-pulse
                    rounded-full
                    bg-[#9ab8ad]
                  "
                />

                Loading Etsy data...
              </div>
            ) : hasConnectedShop ? (
              <div
                className="
                  mb-5 inline-flex items-center gap-2
                  rounded-full
                  bg-white/80
                  px-3 py-1.5
                  text-xs font-medium
                  text-[#34745f]
                  shadow-sm
                  dark:bg-[#19352a]
                  dark:text-[#79c2a9]
                "
              >
                <CheckCircle2 size={14} />

                Etsy connected · {shop?.shop_name}
              </div>
            ) : (
              <div
                className="
                  mb-5 inline-flex items-center gap-2
                  rounded-full
                  bg-white/80
                  px-3 py-1.5
                  text-xs font-medium
                  text-[#34745f]
                  shadow-sm
                  dark:bg-[#19352a]
                  dark:text-[#79c2a9]
                "
              >
                <Sparkles size={14} />

                {t("hero.badge")}
              </div>
            )}

            <h2 className="text-3xl font-semibold tracking-tight lg:text-4xl">
              {hasConnectedShop
                ? shop?.title ||
                `Welcome to ${shop?.shop_name}`
                : t("hero.title")}
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#697671] dark:text-[#9fb4ab]">
              {hasConnectedShop
                ? `Your Etsy shop ${shop?.shop_name} is connected. CraftPilot can now analyze your listings and store performance.`
                : t("hero.description")}
            </p>

            {!hasConnectedShop && (
              <button
                type="button"
                onClick={handleConnectEtsy}
                disabled={isConnectingEtsy}
                className="
                  mt-7 inline-flex items-center gap-2
                  rounded-full
                  bg-[#143d32]
                  px-5 py-3
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
                <Store size={17} />

                {isConnectingEtsy
                  ? "Connecting..."
                  : t("hero.connect")}

                {!isConnectingEtsy && (
                  <ArrowRight size={16} />
                )}
              </button>
            )}

            {hasConnectedShop && (
              <div className="mt-7 flex flex-wrap gap-3">

                <a
                  href={shop?.url}
                  target="_blank"
                  rel="noreferrer"
                  className="
                    inline-flex items-center gap-2
                    rounded-full
                    border border-[#cfe1d9]
                    bg-white
                    px-5 py-3
                    text-sm font-semibold
                    text-[#143d32]
                    transition

                    hover:-translate-y-0.5
                    hover:bg-[#f4faf7]

                    dark:border-[#29483d]
                    dark:bg-[#12231c]
                    dark:text-[#f1f7f4]
                    dark:hover:bg-[#17352a]
                  "
                >
                  <Store size={17} />

                  Open Etsy shop

                  <ArrowRight size={16} />
                </a>

                <button
                  type="button"
                  onClick={handleSyncListings}
                  disabled={isSyncing}
                  className="
                    inline-flex items-center gap-2
                    rounded-full
                    bg-[#143d32]
                    px-5 py-3
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
                  <RefreshCw
                    size={17}
                    className={
                      isSyncing
                        ? "animate-spin"
                        : ""
                    }
                  />

                  {isSyncing
                    ? "Syncing..."
                    : "Sync listings"}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* STATS */}
        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            icon={<ShoppingBag size={19} />}
            label={t("stats.sales")}
            value={
              shop
                ? shop.transaction_sold_count
                : 0
            }
          />

          <StatCard
            icon={<Package size={19} />}
            label={t("stats.orders")}
            value={shop ? shop.transaction_sold_count : 0}
          />

          <StatCard
            icon={<BarChart3 size={19} />}
            label={t("stats.revenue")}
            value="—"
          />

          <StatCard
            icon={<Sparkles size={19} />}
            label={t("stats.aiInsights")}
            value="—"
          />
        </section>

        {/* LOWER CONTENT */}
        <section className="mt-7 grid gap-6 xl:grid-cols-3">

          {/* PERFORMANCE */}
          <div
            className="
              rounded-[24px]
              border border-[#d8e7e1]
              bg-white
              p-6
              xl:col-span-2
              dark:border-[#29483d]
              dark:bg-[#0c1b15]
            "
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">
                  {t("performance.title")}
                </h3>

                <p className="mt-1 text-xs text-[#899690]">
                  {t("performance.description")}
                </p>
              </div>

              <BarChart3
                size={20}
                className="text-[#4b9b83]"
              />
            </div>

            {hasConnectedShop ? (
              <div className="mt-8 grid gap-4 sm:grid-cols-3">

                <MiniMetric
                  label="Active listings"
                  value={listingCount}
                />

                <MiniMetric
                  label="Favorites"
                  value={
                    shop?.num_favorers ?? 0
                  }
                />

                <MiniMetric
                  label="Reviews"
                  value={
                    shop?.review_count ?? 0
                  }
                />
              </div>
            ) : (
              <div
                className="
                  mt-8 flex min-h-[220px]
                  items-center justify-center
                  rounded-2xl
                  bg-[#f6faf8]
                  dark:bg-[#12231c]
                "
              >
                <div className="text-center">
                  <BarChart3
                    size={32}
                    className="
                      mx-auto
                      text-[#9ab8ad]
                    "
                  />

                  <p className="mt-3 text-sm font-medium">
                    {t("empty.title")}
                  </p>

                  <p className="mt-1 text-xs text-[#899690]">
                    {t("empty.description")}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* AI INSIGHTS */}
          <div
            className="
              rounded-[24px]
              border border-[#d8e7e1]
              bg-white
              p-6
              dark:border-[#29483d]
              dark:bg-[#0c1b15]
            "
          >
            <div className="flex items-center gap-2">
              <Sparkles
                size={19}
                className="text-[#4b9b83]"
              />

              <h3 className="font-semibold">
                {t("insights.title")}
              </h3>
            </div>

            <div
              className="
                mt-6 rounded-2xl
                bg-[#f4faf7]
                p-5
                dark:bg-[#12231c]
              "
            >
              {hasConnectedShop ? (
                <>
                  <p className="text-sm font-medium">
                    Ready for AI analysis
                  </p>

                  <p className="mt-2 text-xs leading-5 text-[#899690]">
                    Your {listingCount} active listing
                    {listingCount === 1 ? "" : "s"} can
                    now be analyzed for SEO, keywords
                    and listing quality.
                  </p>

                  <button
                    type="button"
                    className="
                      mt-4
                      rounded-xl
                      border border-[#cfe1d9]
                      bg-white
                      px-4 py-2
                      text-xs font-semibold
                      text-[#34745f]
                      transition

                      hover:bg-[#edf9f3]

                      dark:border-[#29483d]
                      dark:bg-[#17352a]
                      dark:text-[#79c2a9]
                    "
                  >
                    Analyze listings
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium">
                    {t("insights.emptyTitle")}
                  </p>

                  <p className="mt-2 text-xs leading-5 text-[#899690]">
                    {t(
                      "insights.emptyDescription"
                    )}
                  </p>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div
      className="
        rounded-[22px]
        border border-[#d8e7e1]
        bg-white
        p-5
        dark:border-[#29483d]
        dark:bg-[#0c1b15]
      "
    >
      <div className="flex items-center justify-between">
        <div className="text-[#4b9b83]">
          {icon}
        </div>

        <span className="text-xs text-[#9aa7a2]">
          —
        </span>
      </div>

      <p className="mt-5 text-xs text-[#899690]">
        {label}
      </p>

      <p className="mt-1 text-2xl font-semibold">
        {value}
      </p>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div
      className="
        rounded-2xl
        border border-[#d8e7e1]
        bg-[#f6faf8]
        p-5
        dark:border-[#29483d]
        dark:bg-[#12231c]
      "
    >
      <p className="text-xs text-[#899690]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold">
        {value}
      </p>
    </div>
  );
}