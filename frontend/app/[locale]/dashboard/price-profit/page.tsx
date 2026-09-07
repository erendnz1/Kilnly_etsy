"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Calculator,
  DollarSign,
  Package,
  Truck,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
  CircleDollarSign,
  Percent,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  Info,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

/* ============================================================
   TYPES
   ============================================================ */

type ProfitResult = {
  success: boolean;

  input: {
    product_cost_usd: number;
    selling_price_usd: number;
    buyer_shipping_usd: number;
    actual_shipping_cost_usd: number;
    usd_try_rate: number;
    source: string;
    destination: string;
    quantity: number;
    buyer_shipping_source: string;
    actual_shipping_source: string;
    currency_conversion: boolean;
    offsite_ads: boolean;
  };

  order: {
    item_price_usd: number;
    shipping_usd: number;
    order_total_usd: number;
  };

  etsy_fees: {
    transaction_fee_usd: number;
    payment_processing_usd: number;
    regulatory_fee_usd: number;
    listing_fee_usd: number;
    currency_conversion_usd: number;
    offsite_ads_usd: number;
    total_usd: number;
  };

  costs: {
    product_cost_usd: number;
    actual_shipping_usd: number;
    total_cost_before_etsy_fees_usd: number;
  };

  profit: {
    total_cost_usd: number;
    estimated_profit_usd: number;
    estimated_profit_try: number;
    profit_margin_percent: number;
  };

  pricing: {
    break_even_price_usd: number;
    recommended_low_usd: number;
    recommended_usd: number;
    recommended_high_usd: number;
  };
};

type BulkProduct = {
  id: number;
  listing_id: string;
  title: string;
  price: number;
  quantity: number;
  image_url: string | null;
  url: string | null;
  supplier_source: string | null;
  supplier_url: string | null;
};

type BulkAnalysis = {
  status: "profitable" | "below_break_even" | "needs_cost";
  needs_cost: boolean;
  needs_shipping: boolean;
  product: BulkProduct;
  message?: string;

  analysis?: {
    selling_price_usd: number;
    product_cost_usd: number;
    actual_shipping_cost_usd: number;
    estimated_profit_usd: number;
    estimated_profit_try: number;
    profit_margin_percent: number;
    break_even_price_usd: number;
    recommended_price_usd: number;
    etsy_fees_usd: number;
    buyer_shipping_usd: number;
    buyer_shipping_source: string;
    actual_shipping_source: string;
  };
};

type BulkResult = {
  success: boolean;

  summary: {
    total_products: number;
    analyzed_products: number;
    needs_cost: number;
    profitable_products: number;
    below_break_even: number;
    average_margin_percent: number;
    estimated_profit_usd: number;
    estimated_profit_try: number;
  };

  settings: {
    usd_try_rate: number;
    destination: string;
    currency_conversion: boolean;
    offsite_ads: boolean;
  };

  results: BulkAnalysis[];
};

/* ============================================================
   PAGE
   ============================================================ */

export default function PriceProfitPage() {
  const t = useTranslations("dashboard");

  /* ==========================================================
     MANUAL CALCULATOR STATE
     ========================================================== */

  const [productCost, setProductCost] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [usdTryRate, setUsdTryRate] = useState("48.30");

  const [source, setSource] = useState("turkey");
  const [destination, setDestination] = useState("usa");
  const [quantity, setQuantity] = useState("1");

  const [buyerShipping, setBuyerShipping] =
    useState("");

  const [actualShippingCost, setActualShippingCost] =
    useState("");

  const [useManualBuyerShipping, setUseManualBuyerShipping] =
    useState(false);

  const [currencyConversion, setCurrencyConversion] =
    useState(true);

  const [offsiteAds, setOffsiteAds] =
    useState(false);

  const [result, setResult] =
    useState<ProfitResult | null>(null);

  const [isCalculating, setIsCalculating] =
    useState(false);

  const [error, setError] = useState("");

  /* ==========================================================
     STORE ANALYSIS STATE
     ========================================================== */

  const [storeAnalysis, setStoreAnalysis] =
    useState<BulkResult | null>(null);

  const [isLoadingStore, setIsLoadingStore] =
    useState(false);

  const [storeError, setStoreError] =
    useState("");

  const [costModalItem, setCostModalItem] =
    useState<BulkAnalysis | null>(null);

  const [costValue, setCostValue] =
    useState("");

  const [actualShippingValue, setActualShippingValue] =
    useState("");

  const [supplierSource, setSupplierSource] =
    useState("turkey");

  const [supplierUrl, setSupplierUrl] =
    useState("");

  const [isSavingCost, setIsSavingCost] =
    useState(false);

  const [costError, setCostError] =
    useState("");

  /* ==========================================================
     SAVE PRODUCT COST
     ========================================================== */

  async function handleSaveCost() {
    if (!costModalItem) {
      return;
    }

    const token =
      localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    const productCostValue =
      Number(costValue);

    const actualShippingValueNumber =
      Number(actualShippingValue || 0);

    setCostError("");

    if (
      costValue === "" ||
      Number.isNaN(productCostValue) ||
      productCostValue < 0
    ) {
      setCostError(
        t("priceProfit.errors.invalidCost")
      );
      return;
    }

    if (
      Number.isNaN(actualShippingValueNumber) ||
      actualShippingValueNumber < 0
    ) {
      setCostError(
        t("priceProfit.errors.invalidShipping")
      );
      return;
    }

    setIsSavingCost(true);

    try {
      const response = await fetch(
        `${API_URL}/products/${costModalItem.product.listing_id}/cost`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify({
            product_cost_usd:
              productCostValue,
            actual_shipping_cost_usd:
              actualShippingValueNumber,
            supplier_source:
              supplierSource || null,
            supplier_url:
              supplierUrl.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            t("priceProfit.errors.saveCost")
        );
      }

      setCostModalItem(null);
      setCostValue("");
      setActualShippingValue("");
      setSupplierSource("turkey");
      setSupplierUrl("");
      setCostError("");

      await loadStoreAnalysis();
    } catch (error) {
      console.error(
        "Save product cost error:",
        error
      );

      setCostError(
        error instanceof Error
          ? error.message
          : t("priceProfit.errors.saveCost")
      );
    } finally {
      setIsSavingCost(false);
    }
  }

  /* ==========================================================
     STORE ANALYSIS
     ========================================================== */

  async function loadStoreAnalysis() {
    setStoreError("");
    setIsLoadingStore(true);

    const token =
      localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/products/bulk-price-profit`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            usd_try_rate:
              Number(usdTryRate) || 48.3,

            destination,

            currency_conversion:
              currencyConversion,

            offsite_ads:
              offsiteAds,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            t(
              "priceProfit.errors.calculate"
            )
        );
      }

      setStoreAnalysis(data);
    } catch (error) {
      console.error(
        "Store profit analysis error:",
        error
      );

      setStoreError(
        error instanceof Error
          ? error.message
          : t(
              "priceProfit.errors.calculate"
            )
      );
    } finally {
      setIsLoadingStore(false);
    }
  }

  /* ==========================================================
     LOAD STORE ANALYSIS ON PAGE LOAD
     ========================================================== */

  useEffect(() => {
    loadStoreAnalysis();
  }, []);

  /* ==========================================================
     MANUAL CALCULATOR
     ========================================================== */

  async function handleCalculate() {
    setError("");
    setResult(null);

    const token =
      localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    const productCostValue =
      Number(productCost);

    const sellingPriceValue =
      Number(sellingPrice);

    const usdTryRateValue =
      Number(usdTryRate);

    const quantityValue =
      Number(quantity);

    if (
      !productCost ||
      !sellingPrice ||
      !usdTryRate
    ) {
      setError(
        t("priceProfit.errors.required")
      );
      return;
    }

    if (
      productCostValue < 0 ||
      sellingPriceValue <= 0 ||
      usdTryRateValue <= 0 ||
      quantityValue < 1
    ) {
      setError(
        t("priceProfit.errors.invalid")
      );
      return;
    }

    if (
      buyerShipping !== "" &&
      Number(buyerShipping) < 0
    ) {
      setError(
        t("priceProfit.errors.shipping")
      );
      return;
    }

    if (
      actualShippingCost !== "" &&
      Number(actualShippingCost) < 0
    ) {
      setError(
        t("priceProfit.errors.shipping")
      );
      return;
    }

    setIsCalculating(true);

    try {
      const body: Record<string, unknown> = {
        product_cost_usd:
          productCostValue,

        selling_price_usd:
          sellingPriceValue,

        usd_try_rate:
          usdTryRateValue,

        source,

        destination,

        quantity:
          quantityValue,

        currency_conversion:
          currencyConversion,

        offsite_ads:
          offsiteAds,
      };

      if (
        useManualBuyerShipping &&
        buyerShipping !== ""
      ) {
        body.buyer_shipping_usd =
          Number(buyerShipping);
      }

      if (actualShippingCost !== "") {
        body.actual_shipping_cost_usd =
          Number(actualShippingCost);
      }

      const response = await fetch(
        `${API_URL}/products/price-profit`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            t("priceProfit.errors.calculate")
        );
      }

      setResult(data);
    } catch (error) {
      console.error(
        "Price profit error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : t(
              "priceProfit.errors.calculate"
            )
      );
    } finally {
      setIsCalculating(false);
    }
  }

  const profit =
    result?.profit.estimated_profit_usd ?? null;

  const margin =
    result?.profit.profit_margin_percent ?? null;

  const isProfitable =
    profit !== null && profit >= 0;

  function openCostModal(item: BulkAnalysis) {
    setCostModalItem(item);
    setCostValue(
      item.analysis?.product_cost_usd?.toString() ||
        ""
    );
    setActualShippingValue(
      item.analysis?.actual_shipping_cost_usd?.toString() ||
        ""
    );
    setSupplierSource(
      item.product.supplier_source ||
        "turkey"
    );
    setSupplierUrl(
      item.product.supplier_url ||
        ""
    );
    setCostError("");
  }

  function closeCostModal() {
    if (isSavingCost) {
      return;
    }

    setCostModalItem(null);
    setCostError("");
  }

  return (
    <div className="min-h-screen">

      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <header
        className="
          border-b border-[#dfe9e4]
          bg-white/80
          backdrop-blur-xl

          dark:border-[#1f4738]
          dark:bg-[#0a1812]/80
        "
      >
        <div
          className="
            flex items-center
            justify-between
            px-6 py-5
            lg:px-10
          "
        >
          <div>
            <div className="flex items-center gap-2">
              <div
                className="
                  flex h-9 w-9
                  items-center justify-center
                  rounded-xl
                  bg-[#143d32]
                  text-white

                  dark:bg-[#15966a]
                "
              >
                <Calculator size={18} />
              </div>

              <span
                className="
                  text-xs
                  font-bold
                  uppercase
                  tracking-[0.18em]
                  text-[#4b9b83]
                "
              >
                CraftPilot AI
              </span>
            </div>

            <h1
              className="
                mt-4
                text-2xl
                font-semibold
                tracking-tight
                lg:text-3xl
              "
            >
              {t("priceProfit.title")}
            </h1>

            <p
              className="
                mt-2
                max-w-xl
                text-sm
                leading-6
                text-[#899690]
              "
            >
              {t("priceProfit.description")}
            </p>
          </div>

          <div
            className="
              hidden
              items-center
              gap-2
              rounded-full
              border border-[#d8e7e1]
              bg-white
              px-4 py-2
              text-xs
              font-medium
              text-[#34745f]
              sm:flex

              dark:border-[#29483d]
              dark:bg-[#12231c]
              dark:text-[#79c2a9]
            "
          >
            <ShieldCheck size={15} />

            {t("priceProfit.safeEstimate")}
          </div>
        </div>
      </header>

      <main
        className="
          px-6 py-8
          lg:px-10 lg:py-10
        "
      >

        {/* ================================================== */}
        {/* GLOBAL ERROR */}
        {/* ================================================== */}

        {error && (
          <div
            className="
              mb-6
              flex items-start gap-3
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
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <span>{error}</span>
          </div>
        )}

        {/* ================================================== */}
        {/* STORE SUMMARY */}
        {/* ================================================== */}

        {storeAnalysis && (
          <section
            className="
              mb-6
              grid
              gap-4
              sm:grid-cols-2
              lg:grid-cols-3
              xl:grid-cols-6
            "
          >
            <SummaryCard
              icon={<Package size={18} />}
              label={t("priceProfit.totalProducts")}
              value={String(
                storeAnalysis.summary.total_products
              )}
            />

            <SummaryCard
              icon={<Calculator size={18} />}
              label={t("priceProfit.analyzed")}
              value={String(
                storeAnalysis.summary.analyzed_products
              )}
              highlight={
                storeAnalysis.summary.analyzed_products > 0
              }
            />

            <SummaryCard
              icon={<AlertTriangle size={18} />}
              label={t("priceProfit.needCost")}
              value={String(
                storeAnalysis.summary.needs_cost
              )}
            />

            <SummaryCard
              icon={<CheckCircle2 size={18} />}
              label={t("priceProfit.profitable")}
              value={String(
                storeAnalysis.summary.profitable_products
              )}
              highlight={
                storeAnalysis.summary.profitable_products > 0
              }
            />

            <SummaryCard
              icon={<Percent size={18} />}
              label={t("priceProfit.avgMargin")}
              value={`${storeAnalysis.summary.average_margin_percent.toFixed(2)}%`}
            />

            <SummaryCard
              icon={<TrendingUp size={18} />}
              label={t("priceProfit.estimatedProfit")}
              value={`$${storeAnalysis.summary.estimated_profit_usd.toFixed(2)}`}
              highlight={
                storeAnalysis.summary.estimated_profit_usd > 0
              }
            />
          </section>
        )}

        {/* ================================================== */}
        {/* MAIN GRID */}
        {/* ================================================== */}

        <div
          className="
            grid
            gap-6
            xl:grid-cols-[420px_minmax(0,1fr)]
          "
        >

          {/* ================================================= */}
          {/* LEFT - CALCULATOR */}
          {/* ================================================= */}

          <section
            className="
              overflow-hidden
              rounded-[28px]
              border border-[#d8e7e1]
              bg-white
              shadow-[0_20px_60px_rgba(20,61,50,0.06)]

              dark:border-[#29483d]
              dark:bg-[#0c1b15]
            "
          >

            <div
              className="
                border-b
                border-[#edf1ef]
                px-6 py-6

                dark:border-[#203b32]
              "
            >
              <div className="flex items-start justify-between">
                <div>
                  <p
                    className="
                      text-[11px]
                      font-bold
                      uppercase
                      tracking-[0.18em]
                      text-[#4b9b83]
                    "
                  >
                    {t("priceProfit.calculatorLabel")}
                  </p>

                  <h2
                    className="
                      mt-2
                      text-lg
                      font-semibold
                    "
                  >
                    {t("priceProfit.calculator")}
                  </h2>

                  <p
                    className="
                      mt-1
                      text-xs
                      leading-5
                      text-[#899690]
                    "
                  >
                    {t("priceProfit.calculatorDescription")}
                  </p>
                </div>

                <div
                  className="
                    flex h-10 w-10
                    items-center justify-center
                    rounded-xl
                    bg-[#edf9f3]
                    text-[#34745f]

                    dark:bg-[#17352a]
                    dark:text-[#79c2a9]
                  "
                >
                  <Calculator size={18} />
                </div>
              </div>
            </div>

            <div className="space-y-5 p-6">

              <InputField
                label={t("priceProfit.productCost")}
                icon={<Package size={16} />}
                value={productCost}
                onChange={setProductCost}
                placeholder="52.59"
              />

              <InputField
                label={t("priceProfit.sellingPrice")}
                icon={<DollarSign size={16} />}
                value={sellingPrice}
                onChange={setSellingPrice}
                placeholder="99.99"
              />

              <div
                className="
                  grid
                  gap-4
                  sm:grid-cols-2
                "
              >
                <SelectField
                  label={t("priceProfit.source")}
                  icon={<Package size={16} />}
                  value={source}
                  onChange={setSource}
                  options={[
                    {
                      value: "turkey",
                      label: t("priceProfit.sources.turkey"),
                    },
                    {
                      value: "aliexpress",
                      label: t("priceProfit.sources.aliexpress"),
                    },
                  ]}
                />

                <SelectField
                  label={t("priceProfit.destination")}
                  icon={<Truck size={16} />}
                  value={destination}
                  onChange={setDestination}
                  options={[
                    {
                      value: "usa",
                      label: t("priceProfit.destinations.usa"),
                    },
                    {
                      value: "canada",
                      label: t("priceProfit.destinations.canada"),
                    },
                    {
                      value: "other",
                      label: t("priceProfit.destinations.other"),
                    },
                  ]}
                />
              </div>

              <div
                className="
                  grid
                  gap-4
                  sm:grid-cols-2
                "
              >
                <InputField
                  label={t("priceProfit.quantity")}
                  icon={<Package size={16} />}
                  value={quantity}
                  onChange={setQuantity}
                  type="number"
                  placeholder="1"
                />

                <InputField
                  label={t("priceProfit.usdTryRate")}
                  icon={<DollarSign size={16} />}
                  value={usdTryRate}
                  onChange={setUsdTryRate}
                  type="number"
                  placeholder="48.30"
                />
              </div>

              <div
                className="
                  rounded-2xl
                  border
                  border-[#d8e7e1]
                  bg-[#f8fbf9]
                  p-4

                  dark:border-[#29483d]
                  dark:bg-[#12231c]
                "
              >
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Truck
                        size={16}
                        className="text-[#4b9b83]"
                      />

                      <span className="text-sm font-semibold">
                        {t("priceProfit.shipping")}
                      </span>
                    </div>

                    <p
                      className="
                        mt-1
                        text-[11px]
                        text-[#899690]
                      "
                    >
                      {t("priceProfit.shippingDescription")}
                    </p>
                  </div>

                  <Info
                    size={15}
                    className="text-[#9aa7a2]"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-medium">
                      {t("priceProfit.buyerShipping")}
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        setUseManualBuyerShipping(
                          !useManualBuyerShipping
                        )
                      }
                      className="
                        text-[11px]
                        font-semibold
                        text-[#34745f]
                        hover:underline

                        dark:text-[#79c2a9]
                      "
                    >
                      {useManualBuyerShipping
                        ? t("priceProfit.useProfile")
                        : t("priceProfit.useManual")}
                    </button>
                  </div>

                  {useManualBuyerShipping ? (
                    <MoneyInput
                      value={buyerShipping}
                      onChange={setBuyerShipping}
                      placeholder="8.90"
                    />
                  ) : (
                    <div
                      className="
                        flex
                        items-center
                        justify-between
                        rounded-xl
                        border
                        border-[#d8e7e1]
                        bg-white
                        px-4 py-3

                        dark:border-[#29483d]
                        dark:bg-[#0c1b15]
                      "
                    >
                      <span className="text-sm">
                        {t("priceProfit.shippingAuto")}
                      </span>

                      <span
                        className="
                          text-xs
                          font-semibold
                          text-[#34745f]

                          dark:text-[#79c2a9]
                        "
                      >
                        {t("priceProfit.profileLabel")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <label
                    className="
                      mb-2 block
                      text-xs
                      font-medium
                    "
                  >
                    {t("priceProfit.actualShippingCost")}
                  </label>

                  <MoneyInput
                    value={actualShippingCost}
                    onChange={setActualShippingCost}
                    placeholder="0.00"
                  />

                  <p
                    className="
                      mt-2
                      text-[10px]
                      leading-4
                      text-[#9aa7a2]
                    "
                  >
                    {t("priceProfit.actualShippingDescription")}
                  </p>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles
                    size={15}
                    className="text-[#4b9b83]"
                  />

                  <p
                    className="
                      text-xs
                      font-bold
                      uppercase
                      tracking-[0.14em]
                      text-[#697671]
                    "
                  >
                    {t("priceProfit.options")}
                  </p>
                </div>

                <div
                  className="
                    divide-y
                    divide-[#edf1ef]
                    rounded-2xl
                    border
                    border-[#d8e7e1]
                    bg-white
                    px-4

                    dark:divide-[#203b32]
                    dark:border-[#29483d]
                    dark:bg-[#12231c]
                  "
                >
                  <Toggle
                    label={t("priceProfit.currencyConversion")}
                    checked={currencyConversion}
                    onChange={setCurrencyConversion}
                  />

                  <Toggle
                    label={t("priceProfit.offsiteAds")}
                    checked={offsiteAds}
                    onChange={setOffsiteAds}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleCalculate}
                disabled={isCalculating}
                className="
                  group
                  flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-2xl
                  bg-[#143d32]
                  px-5 py-4
                  text-sm
                  font-semibold
                  text-white
                  shadow-[0_12px_30px_rgba(20,61,50,0.18)]
                  transition

                  hover:-translate-y-0.5
                  hover:bg-[#1c5143]
                  hover:shadow-[0_16px_35px_rgba(20,61,50,0.24)]

                  disabled:cursor-not-allowed
                  disabled:opacity-60

                  dark:bg-[#15966a]
                  dark:hover:bg-[#1caf7c]
                "
              >
                {isCalculating ? (
                  <>
                    <RefreshCw
                      size={17}
                      className="animate-spin"
                    />

                    {t("priceProfit.calculating")}
                  </>
                ) : (
                  <>
                    <Calculator size={17} />

                    {t("priceProfit.calculate")}

                    <ArrowUpRight
                      size={16}
                      className="
                        transition
                        group-hover:translate-x-0.5
                        group-hover:-translate-y-0.5
                      "
                    />
                  </>
                )}
              </button>
            </div>
          </section>

          {/* ================================================= */}
          {/* RIGHT - STORE ANALYSIS */}
          {/* ================================================= */}

          <section
            className="
              min-w-0
              rounded-[28px]
              border
              border-[#d8e7e1]
              bg-white
              p-6
              shadow-[0_20px_60px_rgba(20,61,50,0.05)]
              lg:p-8

              dark:border-[#29483d]
              dark:bg-[#0c1b15]
            "
          >

            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <p
                  className="
                    text-[11px]
                    font-bold
                    uppercase
                    tracking-[0.18em]
                    text-[#4b9b83]
                  "
                >
                  {t("priceProfit.analysisLabel")}
                </p>

                <h2
                  className="
                    mt-2
                    text-xl
                    font-semibold
                  "
                >
                  {t("priceProfit.storeAnalysis")}
                </h2>

                <p
                  className="
                    mt-1
                    text-sm
                    text-[#899690]
                  "
                >
                  {t("priceProfit.storeAnalysisDescription")}
                </p>
              </div>

              <button
                type="button"
                onClick={loadStoreAnalysis}
                disabled={isLoadingStore}
                className="
                  flex
                  shrink-0
                  items-center
                  gap-2
                  rounded-xl
                  border
                  border-[#d8e7e1]
                  bg-white
                  px-3 py-2
                  text-xs
                  font-semibold
                  text-[#34745f]
                  transition

                  hover:bg-[#f4faf7]

                  disabled:cursor-not-allowed
                  disabled:opacity-60

                  dark:border-[#29483d]
                  dark:bg-[#12231c]
                  dark:text-[#79c2a9]
                  dark:hover:bg-[#17352a]
                "
              >
                <RefreshCw
                  size={14}
                  className={
                    isLoadingStore
                      ? "animate-spin"
                      : ""
                  }
                />

                {t("priceProfit.refresh")}
              </button>
            </div>

            {storeError && (
              <div
                className="
                  mb-5
                  flex
                  items-start
                  gap-3
                  rounded-2xl
                  border
                  border-[#f1c9c0]
                  bg-[#fff4f1]
                  px-4 py-3
                  text-sm
                  text-[#a64c3c]

                  dark:border-[#5a2b22]
                  dark:bg-[#281713]
                  dark:text-[#e58b78]
                "
              >
                <AlertCircle
                  size={17}
                  className="mt-0.5 shrink-0"
                />

                <span>{storeError}</span>
              </div>
            )}

            {isLoadingStore && !storeAnalysis ? (
              <StoreAnalysisLoading />
            ) : storeAnalysis ? (
              <div className="space-y-5">

                {/* ANALYSIS INFO */}

                <div
                  className="
                    flex
                    flex-wrap
                    items-center
                    justify-between
                    gap-3
                    rounded-2xl
                    border
                    border-[#d8e7e1]
                    bg-[#f8fbf9]
                    px-4 py-3

                    dark:border-[#29483d]
                    dark:bg-[#12231c]
                  "
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck
                      size={16}
                      className="text-[#4b9b83]"
                    />

                    <span className="text-xs text-[#697671]">
                      {t("priceProfit.usdTryLabel")}
                    </span>

                    <span className="text-xs font-bold">
                      {storeAnalysis.settings.usd_try_rate.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Truck
                      size={15}
                      className="text-[#4b9b83]"
                    />

                    <span className="text-xs text-[#697671]">
                      {t("priceProfit.destinationLabel")}
                    </span>

                    <span className="text-xs font-bold uppercase">
                      {storeAnalysis.settings.destination}
                    </span>
                  </div>

                  <div className="text-xs text-[#899690]">
                    {t("priceProfit.feeAwareEstimate")}
                  </div>
                </div>

                {/* PRODUCT LIST */}

                <div>
                  <div
                    className="
                      mb-3
                      flex
                      items-center
                      justify-between
                    "
                  >
                    <h3
                      className="
                        text-xs
                        font-bold
                        uppercase
                        tracking-[0.14em]
                        text-[#899690]
                      "
                    >
                      {t("priceProfit.yourProducts")}
                    </h3>

                    <span
                      className="
                        rounded-full
                        bg-[#edf9f3]
                        px-3 py-1
                        text-[10px]
                        font-bold
                        text-[#34745f]

                        dark:bg-[#17352a]
                        dark:text-[#79c2a9]
                      "
                    >
                      {t("priceProfit.productsCount", {
                        count:
                          storeAnalysis.summary.total_products,
                      })}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {storeAnalysis.results.map(
                      (item) => (
                        <StoreProductCard
                          key={
                            item.product.listing_id
                          }
                          item={item}
                          onAddCost={openCostModal}
                        />
                      )
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <EmptyStoreAnalysis />
            )}

          </section>
        </div>

        {/* ================================================== */}
        {/* MANUAL RESULT */}
        {/* ================================================== */}

        {result && (
          <section
            className="
              mt-6
              rounded-[28px]
              border
              border-[#d8e7e1]
              bg-white
              p-6
              shadow-[0_20px_60px_rgba(20,61,50,0.05)]
              lg:p-8

              dark:border-[#29483d]
              dark:bg-[#0c1b15]
            "
          >
            <div className="mb-7 flex items-start justify-between">
              <div>
                <p
                  className="
                    text-[11px]
                    font-bold
                    uppercase
                    tracking-[0.18em]
                    text-[#4b9b83]
                  "
                >
                  {t("priceProfit.manualCalculation")}
                </p>

                <h2
                  className="
                    mt-2
                    text-xl
                    font-semibold
                  "
                >
                  {t("priceProfit.results")}
                </h2>
              </div>

              <div
                className={`
                  flex
                  items-center
                  gap-2
                  rounded-full
                  px-3 py-1.5
                  text-xs
                  font-semibold

                  ${
                    isProfitable
                      ? `
                        bg-[#edf9f3]
                        text-[#34745f]
                        dark:bg-[#17352a]
                        dark:text-[#79c2a9]
                      `
                      : `
                        bg-[#fff4f1]
                        text-[#a64c3c]
                        dark:bg-[#281713]
                        dark:text-[#e58b78]
                      `
                  }
                `}
              >
                {isProfitable ? (
                  <CheckCircle2 size={14} />
                ) : (
                  <AlertTriangle size={14} />
                )}

                {isProfitable
                  ? t("priceProfit.statusProfitable")
                  : t("priceProfit.statusBelowBreakEven")}
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">

              <div
                className="
                  rounded-[24px]
                  border
                  border-[#cfe5dc]
                  bg-[#edf9f3]
                  p-6

                  dark:border-[#285140]
                  dark:bg-[#102c20]
                "
              >
                <p className="text-xs text-[#899690]">
                  {t("priceProfit.estimatedProfit")}
                </p>

                <p
                  className="
                    mt-2
                    text-4xl
                    font-bold
                    text-[#143d32]

                    dark:text-[#f1f7f4]
                  "
                >
                  {formatUsd(profit ?? 0)}
                </p>

                <p className="mt-1 text-xs text-[#899690]">
                  {formatTry(
                    result.profit.estimated_profit_try
                  )}
                </p>
              </div>

              <ResultGroup
                title={t("priceProfit.order")}
              >
                <ResultRow
                  label={t("priceProfit.itemPrice")}
                  value={formatUsd(
                    result.order.item_price_usd
                  )}
                />

                <ResultRow
                  label={t("priceProfit.buyerShipping")}
                  value={formatUsd(
                    result.order.shipping_usd
                  )}
                />

                <ResultRow
                  label={t("priceProfit.orderTotal")}
                  value={formatUsd(
                    result.order.order_total_usd
                  )}
                  strong
                />
              </ResultGroup>

              <ResultGroup
                title={t("priceProfit.pricing")}
              >
                <ResultRow
                  label={t("priceProfit.breakEven")}
                  value={formatUsd(
                    result.pricing.break_even_price_usd
                  )}
                />

                <ResultRow
                  label={t("priceProfit.recommended")}
                  value={formatUsd(
                    result.pricing.recommended_usd
                  )}
                  strong
                />

                <ResultRow
                  label={t("priceProfit.recommendedHigh")}
                  value={formatUsd(
                    result.pricing.recommended_high_usd
                  )}
                />
              </ResultGroup>

            </div>

            <div
              className="
                mt-5
                grid
                gap-5
                lg:grid-cols-2
              "
            >
              <ResultGroup
                title={t("priceProfit.costs")}
              >
                <ResultRow
                  label={t("priceProfit.productCost")}
                  value={formatUsd(
                    result.costs.product_cost_usd
                  )}
                />

                <ResultRow
                  label={t("priceProfit.actualShippingCost")}
                  value={formatUsd(
                    result.costs.actual_shipping_usd
                  )}
                />

                <ResultRow
                  label={t("priceProfit.totalCostBeforeFees")}
                  value={formatUsd(
                    result.costs.total_cost_before_etsy_fees_usd
                  )}
                  strong
                />
              </ResultGroup>

              <ResultGroup
                title={t("priceProfit.etsyFees")}
              >
                <ResultRow
                  label={t("priceProfit.transactionFee")}
                  value={formatUsd(
                    result.etsy_fees.transaction_fee_usd
                  )}
                />

                <ResultRow
                  label={t("priceProfit.paymentProcessing")}
                  value={formatUsd(
                    result.etsy_fees.payment_processing_usd
                  )}
                />

                <ResultRow
                  label={t("priceProfit.regulatoryFee")}
                  value={formatUsd(
                    result.etsy_fees.regulatory_fee_usd
                  )}
                />

                <ResultRow
                  label={t("priceProfit.totalFees")}
                  value={formatUsd(
                    result.etsy_fees.total_usd
                  )}
                  strong
                />
              </ResultGroup>
            </div>
          </section>
        )}

        {/* ================================================== */}
        {/* PRODUCT COST MODAL */}
        {/* ================================================== */}

        {costModalItem && (
          <CostModal
            item={costModalItem}
            costValue={costValue}
            setCostValue={setCostValue}
            actualShippingValue={actualShippingValue}
            setActualShippingValue={
              setActualShippingValue
            }
            supplierSource={supplierSource}
            setSupplierSource={setSupplierSource}
            supplierUrl={supplierUrl}
            setSupplierUrl={setSupplierUrl}
            error={costError}
            isSaving={isSavingCost}
            onClose={closeCostModal}
            onSave={handleSaveCost}
          />
        )}

      </main>
    </div>
  );
}

/* ============================================================
   STORE PRODUCT CARD
   ============================================================ */

function StoreProductCard({
  item,
  onAddCost,
}: {
  item: BulkAnalysis;
  onAddCost: (item: BulkAnalysis) => void;
}) {
  const t = useTranslations("dashboard");
  const product = item.product;
  const analysis = item.analysis;

  const profitable =
    item.status === "profitable";

  const belowBreakEven =
    item.status === "below_break_even";

  return (
    <div
      className="
        overflow-hidden
        rounded-[22px]
        border
        border-[#d8e7e1]
        bg-white
        transition

        hover:-translate-y-0.5
        hover:shadow-[0_12px_35px_rgba(20,61,50,0.08)]

        dark:border-[#29483d]
        dark:bg-[#0c1b15]
      "
    >
      <div
        className="
          flex
          flex-col
          gap-4
          p-4
          sm:flex-row
          sm:items-center
        "
      >

        {/* IMAGE */}

        <div
          className="
            h-16
            w-16
            shrink-0
            overflow-hidden
            rounded-2xl
            border
            border-[#e5ece8]
            bg-[#f4f8f6]

            dark:border-[#29483d]
            dark:bg-[#12231c]
          "
        >
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.title}
              className="
                h-full
                w-full
                object-cover
              "
            />
          ) : (
            <div
              className="
                flex
                h-full
                w-full
                items-center
                justify-center
                text-[#9aa7a2]
              "
            >
              <Package size={20} />
            </div>
          )}
        </div>

        {/* PRODUCT */}

        <div className="min-w-0 flex-1">
          <h4
            className="
              truncate
              text-sm
              font-semibold
            "
            title={product.title}
          >
            {product.title}
          </h4>

          <div
            className="
              mt-2
              flex
              flex-wrap
              items-center
              gap-x-4
              gap-y-1
            "
          >
            <span
              className="
                text-xs
                font-semibold
                text-[#34745f]

                dark:text-[#79c2a9]
              "
            >
              Sale ${product.price.toFixed(2)}
            </span>

            <span className="text-[11px] text-[#899690]">
              {t("priceProfit.inStock", {
                count: product.quantity,
              })}
            </span>

            {product.supplier_source && (
              <span
                className="
                  text-[11px]
                  capitalize
                  text-[#899690]
                "
              >
                {product.supplier_source}
              </span>
            )}
          </div>
        </div>

        {/* ANALYSIS */}

        {analysis ? (
          <div
            className="
              grid
              grid-cols-2
              gap-x-6
              gap-y-2
              sm:min-w-[310px]
            "
          >
            <StoreMetric
              label={t("priceProfit.productCostShort")}
              value={`$${analysis.product_cost_usd.toFixed(2)}`}
            />

            <StoreMetric
              label={t("priceProfit.etsyFeesShort")}
              value={`$${analysis.etsy_fees_usd.toFixed(2)}`}
            />

            <StoreMetric
              label={t("priceProfit.profitShort")}
              value={`$${analysis.estimated_profit_usd.toFixed(2)}`}
              highlight={profitable}
            />

            <StoreMetric
              label={t("priceProfit.marginShort")}
              value={`${analysis.profit_margin_percent.toFixed(2)}%`}
              highlight={profitable}
            />
          </div>
        ) : (
          <div
            className="
              flex
              items-center
              gap-3
              sm:min-w-[250px]
            "
          >
            <div
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-[#fff5e8]
                text-[#b8792e]

                dark:bg-[#302414]
                dark:text-[#e0a45f]
              "
            >
              <AlertTriangle size={16} />
            </div>

            <div>
              <p
                className="
                  text-xs
                  font-semibold
                  text-[#7a5a32]

                  dark:text-[#e0a45f]
                "
              >
                {t("priceProfit.costDataRequired")}
              </p>

              <p
                className="
                  mt-0.5
                  text-[10px]
                  text-[#899690]
                "
              >
                {t("priceProfit.addSupplierCostDescription")}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onAddCost(item)}
              className="
                ml-auto
                rounded-xl
                border
                border-[#d8e7e1]
                px-3 py-2
                text-[10px]
                font-bold
                text-[#34745f]
                transition
                hover:bg-[#f4faf7]

                dark:border-[#29483d]
                dark:text-[#79c2a9]
              "
            >
              {t("priceProfit.addCost")}
            </button>
          </div>
        )}

        {/* STATUS */}

        {analysis && (
          <div
            className={`
              flex
              shrink-0
              items-center
              gap-1.5
              rounded-full
              px-3 py-1.5
              text-[10px]
              font-bold

              ${
                profitable
                  ? `
                    bg-[#edf9f3]
                    text-[#34745f]
                    dark:bg-[#17352a]
                    dark:text-[#79c2a9]
                  `
                  : belowBreakEven
                    ? `
                      bg-[#fff4f1]
                      text-[#a64c3c]
                      dark:bg-[#281713]
                      dark:text-[#e58b78]
                    `
                    : `
                      bg-[#f2f5f3]
                      text-[#697671]
                      dark:bg-[#17352a]
                      dark:text-[#9fb4ab]
                    `
              }
            `}
          >
            {profitable ? (
              <CheckCircle2 size={13} />
            ) : (
              <AlertTriangle size={13} />
            )}

            {profitable
              ? "Profitable"
              : "Below break-even"}
          </div>
        )}

      </div>
    </div>
  );
}

/* ============================================================
   PRODUCT COST MODAL
   ============================================================ */

function CostModal({
  item,
  costValue,
  setCostValue,
  actualShippingValue,
  setActualShippingValue,
  supplierSource,
  setSupplierSource,
  supplierUrl,
  setSupplierUrl,
  error,
  isSaving,
  onClose,
  onSave,
}: {
  item: BulkAnalysis;
  costValue: string;
  setCostValue: (value: string) => void;
  actualShippingValue: string;
  setActualShippingValue: (value: string) => void;
  supplierSource: string;
  setSupplierSource: (value: string) => void;
  supplierUrl: string;
  setSupplierUrl: (value: string) => void;
  error: string;
  isSaving: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  const t = useTranslations("dashboard");

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-black/50
        px-4
        py-6
        backdrop-blur-sm
      "
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-cost-modal-title"
        className="
          w-full
          max-w-md
          overflow-hidden
          rounded-[28px]
          border
          border-[#d8e7e1]
          bg-white
          shadow-[0_30px_80px_rgba(0,0,0,0.20)]

          dark:border-[#29483d]
          dark:bg-[#0c1b15]
        "
      >
        {/* HEADER */}

        <div
          className="
            flex
            items-start
            justify-between
            border-b
            border-[#edf1ef]
            px-6
            py-5

            dark:border-[#203b32]
          "
        >
          <div className="min-w-0 pr-4">
            <p
              className="
                text-[10px]
                font-bold
                uppercase
                tracking-[0.16em]
                text-[#4b9b83]
              "
            >
              {t("priceProfit.productCost")}
            </p>

            <h3
              id="product-cost-modal-title"
              className="
                mt-1
                text-base
                font-semibold
              "
            >
              {t("priceProfit.addCost")}
            </h3>

            <p
              className="
                mt-1
                truncate
                text-xs
                text-[#899690]
              "
              title={item.product.title}
            >
              {item.product.title}
            </p>
          </div>

          <button
  type="button"
  onClick={onSave}
  disabled={isSaving}
  className="
    flex
    flex-1
    items-center
    justify-center
    gap-2
    rounded-xl
    bg-[#143d32]
    px-4
    py-3
    text-xs
    font-semibold
    text-white
    transition

    hover:bg-[#1c5143]

    disabled:cursor-not-allowed
    disabled:opacity-60

    dark:bg-[#15966a]
    dark:hover:bg-[#1caf7c]
  "
>
  <span className="flex h-4 w-4 items-center justify-center">
    {isSaving ? (
      <RefreshCw
        size={14}
        className="animate-spin"
      />
    ) : (
      <CheckCircle2 size={14} />
    )}
  </span>

  <span>
    {isSaving ? "Saving..." : "Save Cost"}
  </span>
</button>
        </div>

        {/* BODY */}

        <div className="space-y-5 p-6">
          {error && (
            <div
              className="
                flex
                items-start
                gap-2
                rounded-2xl
                border
                border-[#f1c9c0]
                bg-[#fff4f1]
                px-4
                py-3
                text-xs
                text-[#a64c3c]

                dark:border-[#5a2b22]
                dark:bg-[#281713]
                dark:text-[#e58b78]
              "
            >
              <AlertCircle
                size={15}
                className="mt-0.5 shrink-0"
              />

              <span>{error}</span>
            </div>
          )}

          {/* PRODUCT COST */}

          <MoneyField
            label={t("priceProfit.productCost")}
            value={costValue}
            onChange={setCostValue}
            placeholder="52.59"
          />

          {/* ACTUAL SHIPPING */}

          <div>
            <MoneyField
              label={t("priceProfit.actualShippingCost")}
              value={actualShippingValue}
              onChange={setActualShippingValue}
              placeholder="0.00"
            />

            <p
              className="
                mt-2
                text-[10px]
                leading-4
                text-[#899690]
              "
            >
              {t("priceProfit.actualShippingDescription")}
            </p>
          </div>

          {/* SUPPLIER */}

          <SelectField
            label={t("priceProfit.supplier")}
            icon={<Package size={16} />}
            value={supplierSource}
            onChange={setSupplierSource}
            options={[
              {
                value: "turkey",
                label: t("priceProfit.sources.turkey"),
              },
              {
                value: "aliexpress",
                label: t("priceProfit.sources.aliexpress"),
              },
            ]}
          />

          {/* SUPPLIER URL */}

          <div>
            <label
              className="
                mb-2
                block
                text-xs
                font-semibold
              "
            >
              {t("priceProfit.supplierUrl")}
            </label>

            <input
              type="url"
              value={supplierUrl}
              onChange={(event) =>
                setSupplierUrl(
                  event.target.value
                )
              }
              placeholder="https://..."
              className="
                w-full
                rounded-xl
                border
                border-[#d8e7e1]
                bg-white
                px-4
                py-3
                text-sm
                outline-none
                transition

                placeholder:text-[#b0bbb7]

                focus:border-[#7ebca8]
                focus:ring-4
                focus:ring-[#9fd8c2]/20

                dark:border-[#29483d]
                dark:bg-[#12231c]
                dark:text-[#f1f7f4]
              "
            />
          </div>

          {/* ACTIONS */}

          <div
            className="
              flex
              gap-3
              border-t
              border-[#edf1ef]
              pt-5

              dark:border-[#203b32]
            "
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="
                flex-1
                rounded-xl
                border
                border-[#d8e7e1]
                px-4
                py-3
                text-xs
                font-semibold
                text-[#697671]
                transition
                hover:bg-[#f8fbf9]

                disabled:cursor-not-allowed
                disabled:opacity-60

                dark:border-[#29483d]
                dark:text-[#9fb4ab]
                dark:hover:bg-[#17352a]
              "
            >
              {t("priceProfit.cancel")}
            </button>

            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="
                flex
                flex-1
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-[#143d32]
                px-4
                py-3
                text-xs
                font-semibold
                text-white
                transition

                hover:bg-[#1c5143]

                disabled:cursor-not-allowed
                disabled:opacity-60

                dark:bg-[#15966a]
                dark:hover:bg-[#1caf7c]
              "
            >
              {isSaving ? (
                <>
                  <RefreshCw
                    size={14}
                    className="animate-spin"
                  />

                  {t("priceProfit.saving")}
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />

                  {t("priceProfit.saveCost")}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MONEY FIELD
   ============================================================ */

function MoneyField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label
        className="
          mb-2
          block
          text-xs
          font-semibold
        "
      >
        {label}
      </label>

      <MoneyInput
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
}

/* ============================================================
   STORE METRIC
   ============================================================ */

function StoreMetric({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p
        className="
          text-[9px]
          font-bold
          uppercase
          tracking-wider
          text-[#9aa7a2]
        "
      >
        {label}
      </p>

      <p
        className={`
          mt-0.5
          text-xs
          font-bold

          ${
            highlight
              ? "text-[#34745f] dark:text-[#79c2a9]"
              : ""
          }
        `}
      >
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   STORE LOADING
   ============================================================ */

function StoreAnalysisLoading() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="
            flex
            items-center
            gap-4
            rounded-[22px]
            border
            border-[#d8e7e1]
            bg-[#f8fbf9]
            p-4

            dark:border-[#29483d]
            dark:bg-[#12231c]
          "
        >
          <div
            className="
              h-16
              w-16
              shrink-0
              animate-pulse
              rounded-2xl
              bg-[#e5eee9]

              dark:bg-[#1b352b]
            "
          />

          <div className="flex-1 space-y-2">
            <div
              className="
                h-3
                w-2/3
                animate-pulse
                rounded
                bg-[#e5eee9]

                dark:bg-[#1b352b]
              "
            />

            <div
              className="
                h-2
                w-1/3
                animate-pulse
                rounded
                bg-[#e5eee9]

                dark:bg-[#1b352b]
              "
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   EMPTY STORE ANALYSIS
   ============================================================ */

function EmptyStoreAnalysis() {
  const t = useTranslations("dashboard");

  return (
    <div
      className="
        flex
        min-h-[500px]
        items-center
        justify-center
        rounded-[24px]
        border
        border-dashed
        border-[#d8e7e1]
        bg-[#f8fbf9]

        dark:border-[#29483d]
        dark:bg-[#12231c]
      "
    >
      <div className="text-center">
        <div
          className="
            mx-auto
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-2xl
            bg-white
            text-[#4b9b83]
            shadow-sm

            dark:bg-[#17352a]
            dark:text-[#79c2a9]
          "
        >
          <TrendingUp size={24} />
        </div>

        <p className="mt-4 text-sm font-semibold">
          {t("priceProfit.noStoreAnalysis")}
        </p>

        <p className="mt-1 text-xs text-[#899690]">
          {t("priceProfit.refreshStoreAnalysis")}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   SUMMARY CARD
   ============================================================ */

function SummaryCard({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`
        rounded-[22px]
        border
        p-5
        transition

        ${
          highlight
            ? `
              border-[#cfe5dc]
              bg-[#edf9f3]
              dark:border-[#285140]
              dark:bg-[#102c20]
            `
            : `
              border-[#d8e7e1]
              bg-white
              dark:border-[#29483d]
              dark:bg-[#0c1b15]
            `
        }
      `}
    >
      <div className="flex items-center justify-between">
        <div
          className="
            flex h-9 w-9
            items-center justify-center
            rounded-xl
            bg-[#f1f7f4]
            text-[#4b9b83]

            dark:bg-[#17352a]
            dark:text-[#79c2a9]
          "
        >
          {icon}
        </div>

        <ArrowUpRight
          size={15}
          className="text-[#b0bcb7]"
        />
      </div>

      <p
        className="
          mt-4
          text-xs
          text-[#899690]
        "
      >
        {label}
      </p>

      <p className="mt-1 text-xl font-semibold">
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   INPUT
   ============================================================ */

function InputField({
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = "number",
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label
        className="
          mb-2
          flex
          items-center
          gap-2
          text-xs
          font-semibold
        "
      >
        <span className="text-[#4b9b83]">
          {icon}
        </span>

        {label}
      </label>

      <input
        type={type}
        min="0"
        step="0.01"
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="
          w-full
          rounded-xl
          border
          border-[#d8e7e1]
          bg-white
          px-4 py-3
          text-sm
          outline-none
          transition

          placeholder:text-[#b0bbb7]

          focus:border-[#7ebca8]
          focus:ring-4
          focus:ring-[#9fd8c2]/20

          dark:border-[#29483d]
          dark:bg-[#12231c]
          dark:text-[#f1f7f4]
        "
      />
    </div>
  );
}

/* ============================================================
   MONEY INPUT
   ============================================================ */

function MoneyInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <span
        className="
          pointer-events-none
          absolute
          left-4
          top-1/2
          -translate-y-1/2
          text-sm
          font-semibold
          text-[#899690]
        "
      >
        $
      </span>

      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="
          w-full
          rounded-xl
          border
          border-[#d8e7e1]
          bg-white
          py-3
          pl-8
          pr-4
          text-sm
          outline-none
          transition

          placeholder:text-[#b0bbb7]

          focus:border-[#7ebca8]
          focus:ring-4
          focus:ring-[#9fd8c2]/20

          dark:border-[#29483d]
          dark:bg-[#0c1b15]
          dark:text-[#f1f7f4]
        "
      />
    </div>
  );
}

/* ============================================================
   SELECT
   ============================================================ */

function SelectField({
  label,
  icon,
  value,
  onChange,
  options,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: Array<{
    value: string;
    label: string;
  }>;
}) {
  return (
    <div>
      <label
        className="
          mb-2
          flex
          items-center
          gap-2
          text-xs
          font-semibold
        "
      >
        <span className="text-[#4b9b83]">
          {icon}
        </span>

        {label}
      </label>

      <div className="relative">
        <select
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
          className="
            w-full
            appearance-none
            rounded-xl
            border
            border-[#d8e7e1]
            bg-white
            px-4 py-3
            pr-9
            text-sm
            outline-none
            transition

            focus:border-[#7ebca8]
            focus:ring-4
            focus:ring-[#9fd8c2]/20

            dark:border-[#29483d]
            dark:bg-[#12231c]
            dark:text-[#f1f7f4]
          "
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDown
          size={15}
          className="
            pointer-events-none
            absolute
            right-3
            top-1/2
            -translate-y-1/2
            text-[#899690]
          "
        />
      </div>
    </div>
  );
}

/* ============================================================
   TOGGLE
   ============================================================ */

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="
        flex
        w-full
        items-center
        justify-between
        gap-4
        py-3.5
        text-left
      "
    >
      <span className="text-xs font-medium">
        {label}
      </span>

      <span
        className={`
          relative
          h-6
          w-11
          shrink-0
          rounded-full
          transition

          ${
            checked
              ? "bg-[#34745f]"
              : "bg-[#cbd8d3]"
          }

          ${
            checked
              ? "dark:bg-[#15966a]"
              : "dark:bg-[#30463d]"
          }
        `}
      >
        <span
          className={`
            absolute
            top-1
            h-4
            w-4
            rounded-full
            bg-white
            shadow-sm
            transition

            ${
              checked
                ? "left-6"
                : "left-1"
            }
          `}
        />
      </span>
    </button>
  );
}

/* ============================================================
   RESULT GROUP
   ============================================================ */

function ResultGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3
        className="
          mb-3
          text-[11px]
          font-bold
          uppercase
          tracking-[0.14em]
          text-[#899690]
        "
      >
        {title}
      </h3>

      <div
        className="
          overflow-hidden
          rounded-2xl
          border
          border-[#d8e7e1]
          bg-white
          px-4

          dark:border-[#29483d]
          dark:bg-[#0c1b15]
        "
      >
        {children}
      </div>
    </div>
  );
}

/* ============================================================
   RESULT ROW
   ============================================================ */

function ResultRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        gap-4
        border-b
        border-[#edf1ef]
        py-3
        last:border-0

        dark:border-[#203b32]
      "
    >
      <span
        className={
          strong
            ? "text-xs font-semibold"
            : "text-xs text-[#899690]"
        }
      >
        {label}
      </span>

      <span
        className={
          strong
            ? "text-xs font-bold"
            : "text-xs font-medium"
        }
      >
        {value}
      </span>
    </div>
  );
}

/* ============================================================
   FORMATTERS
   ============================================================ */

function formatUsd(value: number) {
  return `$${value.toFixed(2)}`;
}

function formatTry(value: number) {
  return `₺${value.toFixed(2)}`;
}