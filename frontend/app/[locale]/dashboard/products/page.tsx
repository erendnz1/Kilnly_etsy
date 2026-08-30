
"use client";
import UrlProductAnalyzer from "./components/UrlProductAnalyzer";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import {
  Check,
  ExternalLink,
  Package,
  RefreshCw,
  Sparkles,
   Info,
  X,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

type Product = {
  id: number;
  listing_id: string;
  shop_id: string;
  title: string;
  description: string | null;
  price: number | null;
  quantity: number | null;
  state: string | null;
  url: string | null;
  image_url: string | null;
  image_count: number;
  image_urls: string | null;
  tags: string | null;
};

type ProductsResponse = {
  count: number;
  results: Product[];
};

type AnalysisResult = {
  seo_score: number;
  title_score: number;
  description_score: number;
  tag_score: number;
  strengths: string[];
  issues: string[];
  missing_information: string[];
  recommendations: string[];
};

type VisualAnalysisResult = {
  visual_score: number;
  main_image_score: number;
  composition_score: number;
  product_visibility_score: number;
  background_score: number;
  strengths: string[];
  issues: string[];
  recommendations: string[];
};

type OptimizationResult = {
  listing_id: string;

  current: {
    title: string;
    description: string | null;
    tags: string[];
    score?: number;
    analysis?: AnalysisResult;
  };

  optimized: {
    optimized_title: string;
    optimized_description: string;
    optimized_tags: string[];
    changes: string[];
    score?: number;
    score_difference?: number;
    analysis?: AnalysisResult;
  };

  score?: number;
  score_difference?: number;
  recommendation?: "apply" | "review" | "keep";
};

export default function ProductsPage() {
  const locale = useLocale();
  const t = useTranslations("dashboard.products");

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [analysis, setAnalysis] =
    useState<AnalysisResult | null>(null);

  const [visualAnalysis, setVisualAnalysis] =
    useState<VisualAnalysisResult | null>(null);

  const [optimization, setOptimization] =
    useState<OptimizationResult | null>(null);

  const [isAnalyzing, setIsAnalyzing] =
    useState(false);

  const [isVisualAnalyzing, setIsVisualAnalyzing] =
    useState(false);

  const [isOptimizing, setIsOptimizing] =
    useState(false);
const [optimizedImage, setOptimizedImage] =
  useState<string | null>(null);

const [isOptimizingImage, setIsOptimizingImage] =
  useState(false);

const [imageOptimizationError, setImageOptimizationError] =
  useState("");
  const [analysisError, setAnalysisError] =
    useState("");

  const [optimizationError, setOptimizationError] =
    useState("");
const [isApplying, setIsApplying] =
  useState(false);

const [applyError, setApplyError] =
  useState("");

const [applySuccess, setApplySuccess] =
  useState("");

const [showApplyConfirm, setShowApplyConfirm] =
  useState(false);
  const [selectedImageIndex, setSelectedImageIndex] =
    useState<Record<string, number>>({});

  async function loadProducts() {
    const token =
      localStorage.getItem("access_token");

    if (!token) {
      window.location.href = `/${locale}/login`;
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/products`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            t("errors.loadProducts")
        );
      }

      const result: ProductsResponse = data;

      console.log("PRODUCTS FROM API:", result.results);
setProducts(result.results);
    } catch (error) {
      console.error(
        "Products loading error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : t("errors.loadProducts")
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAnalyzeProduct(
    product: Product
  ) {
    const token =
      localStorage.getItem("access_token");

    if (!token) {
      window.location.href = `/${locale}/login`;
      return;
    }

    const language =
      locale === "tr"
        ? "tr"
        : "en";

    setSelectedProduct(product);

    setAnalysis(null);
    setVisualAnalysis(null);
    setOptimization(null);

    setAnalysisError("");
    setOptimizationError("");

    setIsAnalyzing(true);
    setIsVisualAnalyzing(true);

    try {
      const [
        listingResponse,
        visualResponse,
      ] = await Promise.all([
        fetch(
          `${API_URL}/products/${product.listing_id}/analyze?language=${language}`,
          {
            method: "POST",
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        ),

        fetch(
          `${API_URL}/products/${product.listing_id}/visual-analyze?language=${language}`,
          {
            method: "POST",
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        ),
      ]);

      const listingData =
        await listingResponse.json();

      const visualData =
        await visualResponse.json();

      if (!listingResponse.ok) {
        throw new Error(
          listingData.detail ||
            t(
              "analysis.errors.failed"
            )
        );
      }

      if (!visualResponse.ok) {
        throw new Error(
          visualData.detail ||
            t(
              "analysis.errors.visualFailed"
            )
        );
      }

      setAnalysis(
        listingData.analysis
      );

      setVisualAnalysis(
        visualData.analysis
      );
    } catch (error) {
      console.error(
        "AI analysis error:",
        error
      );

      setAnalysisError(
        error instanceof Error
          ? error.message
          : t(
              "analysis.errors.failed"
            )
      );
    } finally {
      setIsAnalyzing(false);
      setIsVisualAnalyzing(false);
    }
  }

  async function handleOptimizeProduct() {
    if (!selectedProduct) {
      return;
    }

    const token =
      localStorage.getItem("access_token");

    if (!token) {
      window.location.href = `/${locale}/login`;
      return;
    }

    const language = "en";

    setIsOptimizing(true);
    setOptimization(null);
    setOptimizationError("");

    try {
      const response = await fetch(
        `${API_URL}/products/${selectedProduct.listing_id}/optimize?language=${language}`,
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Optimization failed."
        );
      }

      setOptimization(data);
    } catch (error) {
      console.error(
        "AI optimization error:",
        error
      );

      setOptimizationError(
        error instanceof Error
          ? error.message
          : "Optimization failed."
      );
    } finally {
      setIsOptimizing(false);
    }
  }
  async function handleOptimizeImage() {
  if (!selectedProduct) return;

  const token = localStorage.getItem("access_token");

  if (!token) {
    window.location.href = `/${locale}/login`;
    return;
  }

  const language = locale === "tr" ? "tr" : "en";

  setIsOptimizingImage(true);
  setOptimizedImage(null);
  setImageOptimizationError("");

  try {
    const response = await fetch(
      `${API_URL}/products/${selectedProduct.listing_id}/visual-optimize?language=${language}`,
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
        data.detail || "Image optimization failed."
      );
    }

    setOptimizedImage(data.optimized_image);
  } catch (error) {
    console.error(
      "AI image optimization error:",
      error
    );

    setImageOptimizationError(
      error instanceof Error
        ? error.message
        : "Image optimization failed."
    );
  } finally {
    setIsOptimizingImage(false);
  }
}
 async function handleApplyOptimization() {
  if (!selectedProduct || !optimization) {
    return;
  }

  const token =
    localStorage.getItem("access_token");

  if (!token) {
    window.location.href = `/${locale}/login`;
    return;
  }

  setIsApplying(true);
  setApplyError("");
  setApplySuccess("");

  try {
    const response = await fetch(
      `${API_URL}/products/${selectedProduct.listing_id}/apply-optimization`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          optimized_title:
            optimization.optimized.optimized_title,

          optimized_description:
            optimization.optimized.optimized_description,

          optimized_tags:
            optimization.optimized.optimized_tags,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        typeof data.detail === "string"
          ? data.detail
          : "Listing güncellenemedi."
      );
    }

    setApplySuccess(
  t("optimization.applied")
);

    setShowApplyConfirm(false);

    /*
     * Local product state'i de güncelle.
     * Böylece sayfayı yenilemeden yeni
     * başlık / açıklama / tag'ler görünür.
     */
    setProducts((previous) =>
      previous.map((product) =>
        product.listing_id ===
        selectedProduct.listing_id
          ? {
              ...product,
              title: data.product.title,
              description:
                data.product.description,
              tags: JSON.stringify(
                data.product.tags
              ),
            }
          : product
      )
    );

    setSelectedProduct((previous) =>
      previous
        ? {
            ...previous,
            title: data.product.title,
            description:
              data.product.description,
            tags: JSON.stringify(
              data.product.tags
            ),
          }
        : null
    );

  } catch (error) {
    console.error(
      "Apply optimization error:",
      error
    );

    setApplyError(
      error instanceof Error
        ? error.message
        : "Listing güncellenemedi."
    );
  } finally {
    setIsApplying(false);
  }
}
  function closeAnalysis() {
  setSelectedProduct(null);
  setAnalysis(null);
  setVisualAnalysis(null);
  setOptimization(null);

  setAnalysisError("");
  setOptimizationError("");
  setApplyError("");
  setApplySuccess("");

  setIsAnalyzing(false);
  setIsVisualAnalyzing(false);
  setIsOptimizing(false);
  setIsApplying(false);
setOptimizedImage(null);
setImageOptimizationError("");
setIsOptimizingImage(false);
  setShowApplyConfirm(false);
}

  useEffect(() => {
    loadProducts();
  }, []);

  const currencyFormatter =
    new Intl.NumberFormat(
      locale === "tr"
        ? "tr-TR"
        : "en-US",
      {
        style: "currency",
        currency: "USD",
      }
    );

  const hasAnalysis =
    Boolean(
      analysis || visualAnalysis
    );

  return (
    <div className="min-h-screen">

      {/* HEADER */}
      <header
        className="
          border-b
          border-[#dfe9e4]
          bg-white/80
          px-6
          py-6
          backdrop-blur-xl
          lg:px-10
          dark:border-[#1f4738]
          dark:bg-[#0a1812]/80
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
            gap-4
          "
        >
          <div>
            <p
              className="
                text-xs
                font-semibold
                uppercase
                tracking-[0.18em]
                text-[#4b9b83]
              "
            >
              CraftPilot AI
            </p>

            <h1
              className="
                mt-1
                text-2xl
                font-semibold
                tracking-tight
              "
            >
              {t("title")}
            </h1>

            <p
              className="
                mt-2
                text-sm
                text-[#899690]
              "
            >
              {t("description")}
            </p>
          </div>

          <button
            type="button"
            onClick={loadProducts}
            disabled={isLoading}
            className="
              inline-flex
              shrink-0
              items-center
              gap-2
              rounded-xl
              border
              border-[#d8e7e1]
              bg-white
              px-4
              py-2.5
              text-sm
              font-semibold
              text-[#143d32]
              transition
              hover:bg-[#f4faf7]
              disabled:cursor-not-allowed
              disabled:opacity-50
              dark:border-[#29483d]
              dark:bg-[#12231c]
              dark:text-[#f1f7f4]
              dark:hover:bg-[#17352a]
            "
          >
            <RefreshCw
              size={16}
              className={
                isLoading
                  ? "animate-spin"
                  : ""
              }
            />

            {t("refresh")}
          </button>
        </div>
      </header>

      <main
        className="
          px-6
          py-8
          lg:px-10
          lg:py-10
        "
      >
<UrlProductAnalyzer />
        {/* ERROR */}
        {error && (
          <div
            className="
              mb-6
              rounded-2xl
              border
              border-[#f1c9c0]
              bg-[#fff4f1]
              px-4
              py-3
              text-sm
              text-[#a64c3c]
              dark:border-[#5a2b22]
              dark:bg-[#281713]
              dark:text-[#e58b78]
            "
          >
            {error}
          </div>
        )}

        {/* SUMMARY */}
        <div
          className="
            mb-7
            flex
            items-center
            gap-3
          "
        >
          <div
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              bg-[#dff1e9]
              text-[#34745f]
              dark:bg-[#193b30]
              dark:text-[#79c2a9]
            "
          >
            <Package size={19} />
          </div>

          <div>
            <p
              className="
                text-sm
                font-semibold
              "
            >
              {products.length === 1
                ? t("count.one")
                : t("count.other", {
                    count:
                      products.length,
                  })}
            </p>

            <p
              className="
                text-xs
                text-[#899690]
              "
            >
              {t("syncedFromEtsy")}
            </p>
          </div>
        </div>

        {/* LOADING */}
        {isLoading ? (
          <div
            className="
              grid
              gap-5
              sm:grid-cols-2
              xl:grid-cols-3
            "
          >
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="
                  overflow-hidden
                  rounded-[24px]
                  border
                  border-[#d8e7e1]
                  bg-white
                  dark:border-[#29483d]
                  dark:bg-[#0c1b15]
                "
              >
                <div
                  className="
                    h-60
                    animate-pulse
                    bg-[#edf4f0]
                    dark:bg-[#12231c]
                  "
                />

                <div
                  className="
                    space-y-3
                    p-5
                  "
                >
                  <div
                    className="
                      h-4
                      w-3/4
                      animate-pulse
                      rounded
                      bg-[#edf4f0]
                      dark:bg-[#12231c]
                    "
                  />

                  <div
                    className="
                      h-4
                      w-1/3
                      animate-pulse
                      rounded
                      bg-[#edf4f0]
                      dark:bg-[#12231c]
                    "
                  />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          /* EMPTY */
          <div
            className="
              flex
              min-h-[360px]
              flex-col
              items-center
              justify-center
              rounded-[24px]
              border
              border-dashed
              border-[#cfe1d9]
              bg-white
              px-6
              text-center
              dark:border-[#29483d]
              dark:bg-[#0c1b15]
            "
          >
            <Package
              size={36}
              className="text-[#9ab8ad]"
            />

            <h2
              className="
                mt-4
                text-lg
                font-semibold
              "
            >
              {t("empty.title")}
            </h2>

            <p
              className="
                mt-2
                max-w-md
                text-sm
                text-[#899690]
              "
            >
              {t("empty.description")}
            </p>

            <Link
              href={`/${locale}/dashboard`}
              className="
                mt-5
                rounded-xl
                bg-[#143d32]
                px-4
                py-2.5
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-[#1c5143]
                dark:bg-[#15966a]
                dark:hover:bg-[#1caf7c]
              "
            >
              {t(
                "empty.goToDashboard"
              )}
            </Link>
          </div>
        ) : (
          /* PRODUCTS */
          <div
            className="
              grid
              gap-5
              sm:grid-cols-2
              xl:grid-cols-3
            "
          >
            {products.map((product) => {
              let imageUrls: string[] =
                [];

              if (product.image_urls) {
                try {
                  const parsed =
                    JSON.parse(
                      product.image_urls
                    );

                  if (
                    Array.isArray(parsed)
                  ) {
                    imageUrls =
                      parsed.filter(
                        (
                          url
                        ): url is string =>
                          typeof url ===
                            "string" &&
                          url.length > 0
                      );
                  }
                } catch (error) {
                  console.error(
                    "Image URLs parse error:",
                    error
                  );
                }
              }

              if (
                imageUrls.length === 0 &&
                product.image_url
              ) {
                imageUrls = [
                  product.image_url,
                ];
              }

              const activeImageIndex =
                Math.min(
                  selectedImageIndex[
                    product.listing_id
                  ] ?? 0,
                  Math.max(
                    imageUrls.length - 1,
                    0
                  )
                );

              const activeImage =
                imageUrls[
                  activeImageIndex
                ] ||
                product.image_url;

              return (
                <article
                  key={
                    product.listing_id
                  }
                  className="
                    group
                    overflow-hidden
                    rounded-[24px]
                    border
                    border-[#d8e7e1]
                    bg-white
                    transition
                    duration-300
                    hover:-translate-y-1
                    hover:shadow-[0_20px_50px_rgba(20,61,50,0.08)]
                    dark:border-[#29483d]
                    dark:bg-[#0c1b15]
                    dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.25)]
                  "
                >

                  {/* IMAGE GALLERY */}
                  <div
                    className="
                      relative
                      overflow-hidden
                      bg-[#f4faf7]
                      dark:bg-[#12231c]
                    "
                  >
                    <div className="h-60">
                      {activeImage ? (
                        <img
                          src={activeImage}
                          alt={
                            product.title
                          }
                          className="
                            h-full
                            w-full
                            object-cover
                            transition
                            duration-500
                            group-hover:scale-[1.02]
                          "
                        />
                      ) : (
                        <div
                          className="
                            flex
                            h-full
                            items-center
                            justify-center
                          "
                        >
                          <Package
                            size={40}
                            className="text-[#9ab8ad]"
                          />
                        </div>
                      )}
                    </div>

                    {/* STATUS */}
                    <div
                      className="
                        absolute
                        left-4
                        top-4
                        rounded-full
                        border
                        border-white/60
                        bg-white/90
                        px-3
                        py-1
                        text-[11px]
                        font-semibold
                        text-[#34745f]
                        backdrop-blur
                        dark:border-[#29483d]
                        dark:bg-[#12231c]/90
                        dark:text-[#79c2a9]
                      "
                    >
                      {product.state ===
                      "active"
                        ? t(
                            "status.active"
                          )
                        : product.state ||
                          "—"}
                    </div>

                    {/* IMAGE COUNT */}
                    {imageUrls.length >
                      1 && (
                      <div
                        className="
                          absolute
                          right-4
                          top-4
                          rounded-full
                          border
                          border-white/50
                          bg-black/45
                          px-2.5
                          py-1
                          text-[11px]
                          font-semibold
                          text-white
                          backdrop-blur
                        "
                      >
                        {imageUrls.length}
                      </div>
                    )}

                    {/* THUMBNAILS */}
                    {imageUrls.length >
                      1 && (
                      <div
                        className="
                          absolute
                          bottom-3
                          left-3
                          right-3
                          flex
                          gap-2
                          overflow-x-auto
                          pb-1
                        "
                      >
                        {imageUrls.map(
                          (
                            image,
                            index
                          ) => (
                            <button
                              key={`${product.listing_id}-${index}`}
                              type="button"
                              aria-label={`${product.title} ${
                                index + 1
                              }`}
                              onClick={() =>
                                setSelectedImageIndex(
                                  (
                                    previous
                                  ) => ({
                                    ...previous,
                                    [product.listing_id]:
                                      index,
                                  })
                                )
                              }
                              className={`
                                h-12
                                w-12
                                shrink-0
                                overflow-hidden
                                rounded-lg
                                border-2
                                bg-black/20
                                transition
                                ${
                                  activeImageIndex ===
                                  index
                                    ? "border-white opacity-100"
                                    : "border-white/50 opacity-75 hover:opacity-100"
                                }
                              `}
                            >
                              <img
                                src={
                                  image
                                }
                                alt=""
                                className="
                                  h-full
                                  w-full
                                  object-cover
                                "
                              />
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  {/* BODY */}
                  <div className="p-5">

                    <h2
                      className="
                        line-clamp-2
                        min-h-[48px]
                        text-base
                        font-semibold
                        leading-6
                      "
                    >
                      {product.title}
                    </h2>

                    {/* PRICE / STOCK */}
                    <div
                      className="
                        mt-5
                        flex
                        items-end
                        justify-between
                      "
                    >
                      <div>
                        <p
                          className="
                            text-xs
                            text-[#899690]
                          "
                        >
                          {t("price")}
                        </p>

                        <p
                          className="
                            mt-1
                            text-lg
                            font-semibold
                          "
                        >
                          {product.price !==
                          null
                            ? currencyFormatter.format(
                                product.price
                              )
                            : "—"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p
                          className="
                            text-xs
                            text-[#899690]
                          "
                        >
                          {t("stock")}
                        </p>

                        <p
                          className="
                            mt-1
                            text-sm
                            font-semibold
                          "
                        >
                          {product.quantity ??
                            "—"}
                        </p>
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div
                      className="
                        mt-5
                        flex
                        gap-2
                      "
                    >
                      {product.url && (
                        <a
                          href={
                            product.url
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="
                            inline-flex
                            flex-1
                            items-center
                            justify-center
                            gap-2
                            rounded-xl
                            border
                            border-[#d8e7e1]
                            px-3
                            py-2.5
                            text-xs
                            font-semibold
                            text-[#34745f]
                            transition
                            hover:bg-[#f4faf7]
                            dark:border-[#29483d]
                            dark:text-[#79c2a9]
                            dark:hover:bg-[#17352a]
                          "
                        >
                          <ExternalLink
                            size={14}
                          />

                          {t("etsy")}
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          handleAnalyzeProduct(
                            product
                          )
                        }
                        disabled={
                          isAnalyzing ||
                          isVisualAnalyzing
                        }
                        className="
                          inline-flex
                          flex-1
                          items-center
                          justify-center
                          gap-2
                          rounded-xl
                          bg-[#143d32]
                          px-3
                          py-2.5
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
                        <Sparkles
                          size={14}
                          className={
                            isAnalyzing ||
                            isVisualAnalyzing
                              ? "animate-pulse"
                              : ""
                          }
                        />

                        {isAnalyzing ||
                        isVisualAnalyzing
                          ? t(
                              "analysis.analyzing"
                            )
                          : t(
                              "aiAnalyze"
                            )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

            {/* AI ANALYSIS MODAL */}
      {selectedProduct && (
        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-[#143d32]/20
            px-4
            py-6
            backdrop-blur-sm
          "
          onClick={closeAnalysis}
        >
          <div
            className="
              relative
              max-h-[90vh]
              w-full
              max-w-3xl
              overflow-hidden
              rounded-[28px]
              border
              border-[#d8e7e1]
              bg-white
              shadow-[0_30px_100px_rgba(20,61,50,0.18)]
              dark:border-[#29483d]
              dark:bg-[#0c1b15]
            "
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* HEADER */}
            <div
              className="
                flex
                items-start
                justify-between
                gap-4
                border-b
                border-[#dfe9e4]
                p-6
                dark:border-[#29483d]
              "
            >
              <div className="min-w-0">
                <p
                  className="
                    text-xs
                    font-semibold
                    uppercase
                    tracking-[0.16em]
                    text-[#4b9b83]
                  "
                >
                  {optimization
                    ? t("optimization.eyebrow")
                    : t("analysis.eyebrow")}
                </p>

                <h2
                  className="
                    mt-2
                    line-clamp-2
                    text-lg
                    font-semibold
                  "
                >
                  {selectedProduct.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeAnalysis}
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  text-[#65736e]
                  transition
                  hover:bg-[#f0f7f3]
                  dark:text-[#9fb4ab]
                  dark:hover:bg-[#17352a]
                "
              >
                <X size={18} />
              </button>
            </div>

            {/* CONTENT */}
            <div
              className="
                max-h-[calc(90vh-90px)]
                overflow-y-auto
                p-6
              "
            >

              {/* ANALYSIS LOADING */}
              {(isAnalyzing ||
                isVisualAnalyzing) && (
                <div
                  className="
                    flex
                    min-h-[320px]
                    flex-col
                    items-center
                    justify-center
                    text-center
                  "
                >
                  <div
                    className="
                      flex
                      h-16
                      w-16
                      items-center
                      justify-center
                      rounded-2xl
                      bg-[#dff1e9]
                      text-[#34745f]
                      dark:bg-[#193b30]
                      dark:text-[#79c2a9]
                    "
                  >
                    <Sparkles
                      size={28}
                      className="animate-pulse"
                    />
                  </div>

                  <p
                    className="
                      mt-5
                      text-sm
                      font-semibold
                    "
                  >
                    {t("analysis.analyzing")}
                  </p>

                  <p
                    className="
                      mt-2
                      max-w-sm
                      text-xs
                      leading-5
                      text-[#899690]
                    "
                  >
                    {t(
                      "analysis.analyzingDescription"
                    )}
                  </p>

                  {isVisualAnalyzing && (
                    <p
                      className="
                        mt-2
                        text-xs
                        text-[#899690]
                      "
                    >
                      {t(
                        "analysis.visual.analyzing"
                      )}
                    </p>
                  )}
                </div>
              )}

              {/* ANALYSIS ERROR */}
              {!isAnalyzing &&
                !isVisualAnalyzing &&
                analysisError && (
                  <div
                    className="
                      rounded-2xl
                      border
                      border-[#f1c9c0]
                      bg-[#fff4f1]
                      p-5
                      text-sm
                      text-[#a64c3c]
                      dark:border-[#5a2b22]
                      dark:bg-[#281713]
                      dark:text-[#e58b78]
                    "
                  >
                    {analysisError}
                  </div>
                )}

              {/* OPTIMIZATION LOADING */}
              {isOptimizing && (
                <div
                  className="
                    flex
                    min-h-[320px]
                    flex-col
                    items-center
                    justify-center
                    text-center
                  "
                >
                  <div
                    className="
                      flex
                      h-16
                      w-16
                      items-center
                      justify-center
                      rounded-2xl
                      bg-[#dff1e9]
                      text-[#34745f]
                      dark:bg-[#193b30]
                      dark:text-[#79c2a9]
                    "
                  >
                    <Sparkles
                      size={28}
                      className="animate-pulse"
                    />
                  </div>

                  <p
                    className="
                      mt-5
                      text-sm
                      font-semibold
                    "
                  >
                    {t("optimization.loading")}
                  </p>

                  <p
                    className="
                      mt-2
                      max-w-sm
                      text-xs
                      leading-5
                      text-[#899690]
                    "
                  >
                    {t(
                      "optimization.loadingDescription"
                    )}
                  </p>
                </div>
              )}

              {/* OPTIMIZATION ERROR */}
              {!isOptimizing &&
                optimizationError && (
                  <div
                    className="
                      rounded-2xl
                      border
                      border-[#f1c9c0]
                      bg-[#fff4f1]
                      p-5
                      text-sm
                      text-[#a64c3c]
                      dark:border-[#5a2b22]
                      dark:bg-[#281713]
                      dark:text-[#e58b78]
                    "
                  >
                    {optimizationError}
                  </div>
                )}

              {/* OPTIMIZATION RESULT */}
              {!isOptimizing &&
                !optimizationError &&
                optimization && (
                  <OptimizationResultView
                    optimization={optimization}
                    onApply={() => {
                      setApplyError("");
                      setApplySuccess("");
                      setShowApplyConfirm(true);
                    }}
                  />
                )}

              {/* APPLY SUCCESS */}
              {applySuccess && (
                <div
                  className="
                    mt-4
                    rounded-2xl
                    border
                    border-[#b9d9cd]
                    bg-[#f0faf5]
                    p-4
                    text-sm
                    font-medium
                    text-[#34745f]
                    dark:border-[#29483d]
                    dark:bg-[#12231c]
                    dark:text-[#79c2a9]
                  "
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="
                        flex
                        h-6
                        w-6
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        bg-[#dff1e9]
                        dark:bg-[#193b30]
                      "
                    >
                      <Check size={14} />
                    </span>

                    <span>{applySuccess}</span>
                  </div>
                </div>
              )}

              {/* APPLY ERROR */}
              {applyError && (
                <div
                  className="
                    mt-4
                    rounded-2xl
                    border
                    border-[#f1c9c0]
                    bg-[#fff4f1]
                    p-4
                    text-sm
                    text-[#a64c3c]
                    dark:border-[#5a2b22]
                    dark:bg-[#281713]
                    dark:text-[#e58b78]
                  "
                >
                  {applyError}
                </div>
              )}

              {/* NORMAL ANALYSIS RESULTS */}
              {!isAnalyzing &&
                !isVisualAnalyzing &&
                !isOptimizing &&
                !analysisError &&
                !optimizationError &&
                !optimization &&
                hasAnalysis && (
                  <div className="space-y-8">

                    {/* TEXT ANALYSIS */}
                    {analysis && (
                      <section>
                        <div className="mb-5">
                          <p
                            className="
                              text-xs
                              font-semibold
                              uppercase
                              tracking-[0.16em]
                              text-[#4b9b83]
                            "
                          >
                            {t(
                              "analysis.eyebrow"
                            )}
                          </p>
                        </div>

                        <div
                          className="
                            rounded-2xl
                            bg-[#f4faf7]
                            p-5
                            dark:bg-[#12231c]
                          "
                        >
                          <div
                            className="
                              flex
                              items-center
                              justify-between
                            "
                          >
                            <div>
                              <p
                                className="
                                  text-xs
                                  text-[#899690]
                                "
                              >
                                {t(
                                  "analysis.seoScore"
                                )}
                              </p>

                              <p
                                className="
                                  mt-1
                                  text-4xl
                                  font-semibold
                                "
                              >
                                {
                                  analysis.seo_score
                                }
                              </p>
                            </div>

                            <div
                              className="
                                flex
                                h-16
                                w-16
                                items-center
                                justify-center
                                rounded-2xl
                                border
                                border-[#cfe1d9]
                                bg-white
                                text-sm
                                font-semibold
                                text-[#34745f]
                                dark:border-[#29483d]
                                dark:bg-[#17352a]
                                dark:text-[#79c2a9]
                              "
                            >
                              /100
                            </div>
                          </div>
                        </div>

                        <div
                          className="
                            mt-4
                            grid
                            gap-3
                            sm:grid-cols-3
                          "
                        >
                          <ScoreCard
                            label={t(
                              "analysis.titleScore"
                            )}
                            score={
                              analysis.title_score
                            }
                          />

                          <ScoreCard
                            label={t(
                              "analysis.descriptionScore"
                            )}
                            score={
                              analysis.description_score
                            }
                          />

                          <ScoreCard
                            label={t(
                              "analysis.tagScore"
                            )}
                            score={
                              analysis.tag_score
                            }
                          />
                        </div>

                        <div
                          className="
                            mt-6
                            space-y-6
                          "
                        >
                          <AnalysisSection
                            title={t(
                              "analysis.strengths"
                            )}
                            items={
                              analysis.strengths
                            }
                            type="strength"
                          />

                          <AnalysisSection
                            title={t(
                              "analysis.issues"
                            )}
                            items={
                              analysis.issues
                            }
                            type="issue"
                          />

                          <AnalysisSection
                            title={t(
                              "analysis.missingInformation"
                            )}
                            items={
                              analysis.missing_information
                            }
                            type="missing"
                          />

                          <AnalysisSection
                            title={t(
                              "analysis.recommendations"
                            )}
                            items={
                              analysis.recommendations
                            }
                            type="recommendation"
                          />
                        </div>
                      </section>
                    )}

                    {/* VISUAL ANALYSIS */}
                    {visualAnalysis && (
                      <section
                        className="
                          border-t
                          border-[#dfe9e4]
                          pt-8
                          dark:border-[#29483d]
                        "
                      >
                        <div className="mb-5">
                          <p
                            className="
                              text-xs
                              font-semibold
                              uppercase
                              tracking-[0.16em]
                              text-[#4b9b83]
                            "
                          >
                            {t(
                              "analysis.visual.eyebrow"
                            )}
                          </p>

                          <h3
                            className="
                              mt-2
                              text-lg
                              font-semibold
                            "
                          >
                            {t(
                              "analysis.visual.title"
                            )}
                          </h3>
                        </div>

                        <div
                          className="
                            rounded-2xl
                            bg-[#f4faf7]
                            p-5
                            dark:bg-[#12231c]
                          "
                        >
                          <div
                            className="
                              flex
                              items-center
                              justify-between
                            "
                          >
                            <div>
                              <p
                                className="
                                  text-xs
                                  text-[#899690]
                                "
                              >
                                {t(
                                  "analysis.visual.visualScore"
                                )}
                              </p>

                              <p
                                className="
                                  mt-1
                                  text-4xl
                                  font-semibold
                                "
                              >
                                {
                                  visualAnalysis.visual_score
                                }
                              </p>
                            </div>

                            <div
                              className="
                                flex
                                h-16
                                w-16
                                items-center
                                justify-center
                                rounded-2xl
                                border
                                border-[#cfe1d9]
                                bg-white
                                text-sm
                                font-semibold
                                text-[#34745f]
                                dark:border-[#29483d]
                                dark:bg-[#17352a]
                                dark:text-[#79c2a9]
                              "
                            >
                              /100
                            </div>
                          </div>
                        </div>

                        <div
                          className="
                            mt-4
                            grid
                            gap-3
                            sm:grid-cols-2
                          "
                        >
                          <ScoreCard
                            label={t(
                              "analysis.visual.mainImageScore"
                            )}
                            score={
                              visualAnalysis.main_image_score
                            }
                          />

                          <ScoreCard
                            label={t(
                              "analysis.visual.compositionScore"
                            )}
                            score={
                              visualAnalysis.composition_score
                            }
                          />

                          <ScoreCard
                            label={t(
                              "analysis.visual.visibilityScore"
                            )}
                            score={
                              visualAnalysis.product_visibility_score
                            }
                          />

                          <ScoreCard
                            label={t(
                              "analysis.visual.backgroundScore"
                            )}
                            score={
                              visualAnalysis.background_score
                            }
                          />
                        </div>

                        <div
                          className="
                            mt-6
                            space-y-6
                          "
                        >
                          <AnalysisSection
                            title={t(
                              "analysis.visual.strengths"
                            )}
                            items={
                              visualAnalysis.strengths
                            }
                            type="strength"
                          />

                          <AnalysisSection
                            title={t(
                              "analysis.visual.issues"
                            )}
                            items={
                              visualAnalysis.issues
                            }
                            type="issue"
                          />

                          <AnalysisSection
                            title={t(
                              "analysis.visual.recommendations"
                            )}
                            items={
                              visualAnalysis.recommendations
                            }
                            type="recommendation"
                          />
                        </div>
                      </section>
                    )}

                    {/* LISTING OPTIMIZATION CTA */}
                    <section
                      className="
                        border-t
                        border-[#dfe9e4]
                        pt-8
                        dark:border-[#29483d]
                      "
                    >
                      <div
                        className="
                          rounded-2xl
                          border
                          border-[#cfe1d9]
                          bg-[#f4faf7]
                          p-5
                          dark:border-[#29483d]
                          dark:bg-[#12231c]
                        "
                      >
                        <div
                          className="
                            flex
                            flex-col
                            gap-4
                            sm:flex-row
                            sm:items-center
                            sm:justify-between
                          "
                        >
                          <div>
                            <p
                              className="
                                text-sm
                                font-semibold
                              "
                            >
                              {t(
                                "optimization.ctaTitle"
                              )}
                            </p>

                            <p
                              className="
                                mt-1
                                max-w-xl
                                text-xs
                                leading-5
                                text-[#899690]
                              "
                            >
                              {t(
                                "optimization.ctaDescription"
                              )}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={
                              handleOptimizeProduct
                            }
                            disabled={
                              isOptimizing
                            }
                            className="
                              inline-flex
                              shrink-0
                              items-center
                              justify-center
                              gap-2
                              rounded-xl
                              bg-[#143d32]
                              px-5
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
                            <Sparkles
                              size={15}
                            />

                            {t(
                              "optimization.optimizeButton"
                            )}
                          </button>
                        </div>
                      </div>
                    </section>
                  </div>
                )}

              {/* ============================================================
    AI VISUAL OPTIMIZATION
============================================================ */}

<section
  className="
    mt-8
    border-t
    border-[#dfe9e4]
    pt-8
    dark:border-[#29483d]
  "
>
  {/* HEADER */}
  <div className="mb-5">
    <p
      className="
        text-xs
        font-semibold
        uppercase
        tracking-[0.16em]
        text-[#4b9c83]
      "
    >
      AI Visual Optimization
    </p>

    <h3
      className="
        mt-2
        text-lg
        font-semibold
      "
    >
      Improve Your Product Image
    </h3>

    <p
      className="
        mt-1
        text-sm
        leading-6
        text-[#899690]
      "
    >
      Improve your Etsy product photo with AI
      without changing the actual product.
    </p>
  </div>

  {/* ORIGINAL / COMING SOON */}
  <div
    className="
      grid
      gap-5
      md:grid-cols-2
    "
  >
    {/* ORIGINAL IMAGE */}
    <div>
      <p
        className="
          mb-2
          text-sm
          font-semibold
        "
      >
        Original Image
      </p>

      <div
        className="
          overflow-hidden
          rounded-2xl
          border
          border-[#d8e7e1]
          bg-[#f6faf8]
          dark:border-[#29483d]
          dark:bg-[#12231c]
        "
      >
        {selectedProduct.image_url ? (
          <img
            src={selectedProduct.image_url}
            alt={selectedProduct.title}
            className="
              h-72
              w-full
              object-contain
            "
          />
        ) : (
          <div
            className="
              flex
              h-72
              items-center
              justify-center
              text-sm
              text-[#899690]
            "
          >
            No image available
          </div>
        )}
      </div>
    </div>

    {/* AI OPTIMIZED / COMING SOON */}
    <div>
      <div
        className="
          mb-2
          flex
          items-center
          gap-2
        "
      >
        <p
          className="
            text-sm
            font-semibold
          "
        >
          AI Optimized Image
        </p>

        <span
          className="
            rounded-full
            border
            border-[#bda65c]
            bg-[#2b2818]
            px-2.5
            py-1
            text-[10px]
            font-bold
            uppercase
            tracking-wide
            text-[#e5c968]
          "
        >
          Coming Soon
        </span>
      </div>

      <div
        className="
          flex
          h-72
          flex-col
          items-center
          justify-center
          rounded-2xl
          border
          border-dashed
          border-[#557269]
          bg-[#10251d]
          px-6
          text-center
          dark:border-[#45675b]
          dark:bg-[#10251d]
        "
      >
        <div
          className="
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-2xl
            bg-[#263c31]
            text-[#e5c968]
          "
        >
          <Sparkles size={22} />
        </div>

        <p
          className="
            mt-4
            text-base
            font-semibold
            text-[#e5c968]
          "
        >
          AI optimization
          <br />
          coming soon
        </p>

        <p
          className="
            mt-3
            max-w-xs
            text-xs
            leading-5
            text-[#899690]
          "
        >
          We're working on bringing you
          the best AI image optimization.
        </p>
      </div>
    </div>
  </div>

  {/* INFO */}
  <div
    className="
      mt-4
      flex
      items-start
      gap-3
      rounded-2xl
      border
      border-[#29483d]
      bg-[#10251d]
      px-4
      py-4
    "
  >
    <div
      className="
        mt-0.5
        flex
        h-6
        w-6
        shrink-0
        items-center
        justify-center
        rounded-full
        bg-[#193b30]
        text-[#79c2a9]
      "
    >
      <Info size={14} />
    </div>

    <p
      className="
        text-xs
        leading-5
        text-[#9fb4ab]
      "
    >
      AI image optimization is temporarily
      unavailable. We are working on a new
      integration to bring you better results.
    </p>
  </div>

        {/* DISABLED BUTTON */}
      <div className="mt-5 flex justify-end">
        <button
          type="button"
          disabled
          className="
            inline-flex
            cursor-not-allowed
            items-center
            gap-2
            rounded-xl
            bg-[#294039]
            px-5
            py-3
            text-xs
            font-semibold
            text-[#7f918a]
            opacity-80
          "
        >
          <Sparkles size={15} />

          {t("optimization.optimizeImageButton")}

          <span className="ml-1">
            🔒
          </span>
        </button>
      </div>
    </section>
                </div>
          </div>
        </div>
      )}
            {/* APPLY CONFIRMATION MODAL */}
      {showApplyConfirm &&
        selectedProduct &&
        optimization && (
          <div
            className="
              fixed
              inset-0
              z-[200]
              flex
              items-center
              justify-center
              bg-[#143d32]/25
              px-4
              backdrop-blur-sm
            "
            onClick={() => {
              if (!isApplying) {
                setShowApplyConfirm(false);
              }
            }}
          >
            <div
              className="
                w-full
                max-w-md
                rounded-[24px]
                border
                border-[#d8e7e1]
                bg-white
                p-6
                shadow-[0_30px_100px_rgba(20,61,50,0.2)]
                dark:border-[#29483d]
                dark:bg-[#0c1b15]
              "
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-2xl
                  bg-[#dff1e9]
                  text-[#34745f]
                  dark:bg-[#193b30]
                  dark:text-[#79c2a9]
                "
              >
                <Sparkles size={22} />
              </div>

              <h3
                className="
                  mt-5
                  text-lg
                  font-semibold
                "
              >
                {t("optimization.confirmTitle")}
              </h3>

              <p
                className="
                  mt-2
                  text-sm
                  leading-6
                  text-[#899690]
                "
              >
                {t("optimization.confirmDescription")}
              </p>

              <div
                className="
                  mt-5
                  rounded-2xl
                  bg-[#f4faf7]
                  p-4
                  dark:bg-[#12231c]
                "
              >
                <p
                  className="
                    text-xs
                    font-semibold
                    text-[#34745f]
                    dark:text-[#79c2a9]
                  "
                >
                  {t("optimization.fieldsToUpdate")}
                </p>

                <ul
                  className="
                    mt-3
                    space-y-2
                    text-xs
                    text-[#65736e]
                    dark:text-[#a9bbb4]
                  "
                >
                  <li>• {t("optimization.fieldTitle")}</li>
                  <li>• {t("optimization.fieldDescription")}</li>
                  <li>• {t("optimization.fieldTags")}</li>
                </ul>
              </div>

              <div
                className="
                  mt-6
                  flex
                  gap-3
                "
              >
                <button
                  type="button"
                  disabled={isApplying}
                  onClick={() =>
                    setShowApplyConfirm(false)
                  }
                  className="
                    flex-1
                    rounded-xl
                    border
                    border-[#d8e7e1]
                    px-4
                    py-3
                    text-sm
                    font-semibold
                    text-[#65736e]
                    transition
                    hover:bg-[#f4faf7]
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                    dark:border-[#29483d]
                    dark:text-[#a9bbb4]
                    dark:hover:bg-[#17352a]
                  "
                >
                  {t("optimization.cancel")}
                </button>

                <button
                  type="button"
                  disabled={isApplying}
                  onClick={handleApplyOptimization}
                  className="
                    inline-flex
                    flex-1
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-[#143d32]
                    px-4
                    py-3
                    text-sm
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
                  {isApplying ? (
                    <>
                      <RefreshCw
                        size={15}
                        className="animate-spin"
                      />
                      {t("optimization.applying")}
                    </>
                  ) : (
                    <>
                      <Check size={15} />
                      {t("optimization.apply")}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
function OptimizationResultView({
  optimization,
  onApply,
}: {
  optimization: OptimizationResult;
  onApply: () => void;
}) {
  const t = useTranslations("dashboard.products");

  const beforeScore =
    optimization.current.score ??
    optimization.score ??
    0;

  const afterScore =
    optimization.optimized.score ??
    optimization.score ??
    beforeScore;

  const scoreDifference =
    optimization.optimized.score_difference ??
    optimization.score_difference ??
    afterScore - beforeScore;

  const shouldApply =
  afterScore > beforeScore;

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <p
          className="
            text-xs
            font-semibold
            uppercase
            tracking-[0.16em]
            text-[#4b9b83]
          "
        >
          {t("optimization.eyebrow")}
        </p>

        <h3
          className="
            mt-2
            text-xl
            font-semibold
          "
        >
          {t("optimization.title")}
        </h3>

       <p className="mt-2 text-xs leading-5 text-[#899690]">
  {t("optimization.description")}
</p>
        <div
  className="
    mt-5
    grid
    gap-3
    sm:grid-cols-3
  "
>
  <div
    className="
      rounded-2xl
      border
      border-[#d8e7e1]
      bg-white
      p-4
      dark:border-[#29483d]
      dark:bg-[#12231c]
    "
  >
    <p className="text-xs text-[#899690]">
      {t("optimization.currentSeo")}
    </p>

    <p className="mt-2 text-2xl font-semibold">
      {beforeScore}
      <span className="ml-1 text-xs text-[#899690]">
        /100
      </span>
    </p>
  </div>

  <div
    className="
      rounded-2xl
      border
      border-[#b9d9cd]
      bg-[#f4faf7]
      p-4
      dark:border-[#29483d]
      dark:bg-[#12231c]
    "
  >
    <p className="text-xs text-[#899690]">
      {t("optimization.optimizedSeo")}
    </p>

    <p className="mt-2 text-2xl font-semibold text-[#34745f] dark:text-[#79c2a9]">
      {afterScore}
      <span className="ml-1 text-xs text-[#899690]">
        /100
      </span>
    </p>
  </div>

  <div
    className="
      rounded-2xl
      border
      border-[#d8e7e1]
      bg-white
      p-4
      dark:border-[#29483d]
      dark:bg-[#12231c]
    "
  >
    <p className="text-xs text-[#899690]">
      {t("optimization.change")}
    </p>

    <p
      className={`
        mt-2
        text-2xl
        font-semibold
        ${
          scoreDifference > 0
            ? "text-[#34745f] dark:text-[#79c2a9]"
            : scoreDifference < 0
              ? "text-[#b45345]"
              : "text-[#65736e] dark:text-[#a9bbb4]"
        }
      `}
    >
      {scoreDifference > 0
        ? `+${scoreDifference}`
        : scoreDifference}
    </p>
  </div>
</div>
      </div>

      {/* CURRENT TITLE */}
      <OptimizationField
        label={t("optimization.currentTitle")}
        value={
          optimization.current.title
        }
      />

      {/* OPTIMIZED TITLE */}
      <OptimizationField
        label={t("optimization.optimizedTitle")}
        value={
          optimization.optimized
            .optimized_title
        }
        highlighted
      />

      {/* CURRENT DESCRIPTION */}
      <OptimizationField
        label={t("optimization.currentDescription")}
        value={
          optimization.current
            .description ||
          "—"
        }
        multiline
      />

      {/* OPTIMIZED DESCRIPTION */}
      <OptimizationField
        label={t("optimization.optimizedDescription")}
        value={
          optimization.optimized
            .optimized_description
        }
        multiline
        highlighted
      />

      {/* TAGS */}
      <div>
        <h4
          className="
            text-sm
            font-semibold
          "
        >
          {t("optimization.optimizedTags")}
        </h4>

        <div
          className="
            mt-3
            flex
            flex-wrap
            gap-2
          "
        >
          {optimization.optimized.optimized_tags.map(
            (tag, index) => (
              <span
                key={`${tag}-${index}`}
                className="
                  rounded-full
                  border
                  border-[#cfe1d9]
                  bg-[#f4faf7]
                  px-3
                  py-1.5
                  text-xs
                  font-medium
                  text-[#34745f]
                  dark:border-[#29483d]
                  dark:bg-[#17352a]
                  dark:text-[#79c2a9]
                "
              >
                {tag}
              </span>
            )
          )}
        </div>
      </div>

      {/* CHANGES */}
      {optimization.optimized
        .changes?.length > 0 && (
        <div>
          <h4
            className="
              text-sm
              font-semibold
            "
          >
            {t("optimization.changes")}
          </h4>

          <div
            className="
              mt-3
              space-y-2
            "
          >
            {optimization.optimized.changes.map(
              (change, index) => (
                <div
                  key={`change-${index}`}
                  className="
                    flex
                    gap-3
                    rounded-xl
                    bg-[#f6faf8]
                    p-3
                    text-xs
                    leading-5
                    text-[#65736e]
                    dark:bg-[#12231c]
                    dark:text-[#a9bbb4]
                  "
                >
                  <span
                    className="
                      flex
                      h-5
                      w-5
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-[#dff1e9]
                      text-[#34745f]
                      dark:bg-[#193b30]
                      dark:text-[#79c2a9]
                    "
                  >
                    <Check size={12} />
                  </span>

                  <span>
                    {change}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* APPLY */}
      <div
        className="
          border-t
          border-[#dfe9e4]
          pt-6
          dark:border-[#29483d]
        "
      >
        <button
  type="button"
  onClick={onApply}
 disabled={scoreDifference < 0}
  className="
    inline-flex
    w-full
    items-center
    justify-center
    gap-2
    rounded-xl
    bg-[#143d32]
    px-5
    py-3
    text-sm
    font-semibold
    text-white
    transition
    hover:bg-[#1c5143]
    disabled:cursor-not-allowed
    disabled:opacity-50
    dark:bg-[#15966a]
    dark:hover:bg-[#1caf7c]
  "
>
          <Check size={16} />

          {t("optimization.apply")}
        </button>

        <p
          className="
            mt-3
            text-center
            text-[11px]
            leading-5
            text-[#899690]
          "
        >
          {scoreDifference > 0
  ? t("optimization.scoreImproved")
  : scoreDifference === 0
    ? t("optimization.scoreSame")
    : t("optimization.scoreLower")}
        </p>
      </div>
    </div>
  );
}

function OptimizationField({
  label,
  value,
  multiline = false,
  highlighted = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  highlighted?: boolean;
}) {
  return (
    <div>
      <div
        className="
          mb-2
          flex
          items-center
          justify-between
          gap-3
        "
      >
        <h4
          className="
            text-sm
            font-semibold
          "
        >
          {label}
        </h4>

        {highlighted && (
          <span
            className="
              rounded-full
              bg-[#dff1e9]
              px-2.5
              py-1
              text-[10px]
              font-semibold
              uppercase
              tracking-wide
              text-[#34745f]
              dark:bg-[#193b30]
              dark:text-[#79c2a9]
            "
          >
            AI
          </span>
        )}
      </div>

      <div
        className={`
          rounded-2xl
          border
          p-4
          text-xs
          leading-6
          ${
            highlighted
              ? "border-[#b9d9cd] bg-[#f4faf7] text-[#234f43] dark:border-[#29483d] dark:bg-[#12231c] dark:text-[#c0d5cc]"
              : "border-[#d8e7e1] bg-white text-[#65736e] dark:border-[#29483d] dark:bg-[#0f2119] dark:text-[#9fb4ab]"
          }
          ${
            multiline
              ? "whitespace-pre-wrap"
              : ""
          }
        `}
      >
        {value}
      </div>
    </div>
  );
}

function ScoreCard({
  label,
  score,
}: {
  label: string;
  score: number;
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-[#d8e7e1]
        bg-white
        p-4
        dark:border-[#29483d]
        dark:bg-[#12231c]
      "
    >
      <p className="text-xs text-[#899690]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold">
        {score}
      </p>
    </div>
  );
}

function AnalysisSection({
  title,
  items,
  type,
}: {
  title: string;
  items: string[];
  type:
    | "strength"
    | "issue"
    | "missing"
    | "recommendation";
}) {
  if (!items || items.length === 0) {
    return null;
  }

  const icon =
    type === "strength"
      ? "✓"
      : type === "issue"
        ? "!"
        : type === "missing"
          ? "i"
          : "→";

  return (
    <div>
      <h3 className="text-sm font-semibold">
        {title}
      </h3>

      <div className="mt-3 space-y-2">
        {items.map(
          (item, index) => (
            <div
              key={`${type}-${index}`}
              className="
                flex
                gap-3
                rounded-xl
                bg-[#f6faf8]
                p-3
                text-xs
                leading-5
                text-[#65736e]
                dark:bg-[#12231c]
                dark:text-[#a9bbb4]
              "
            >
              <span
                className="
                  flex
                  h-5
                  w-5
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-[#dff1e9]
                  text-[10px]
                  font-bold
                  text-[#34745f]
                  dark:bg-[#193b30]
                  dark:text-[#79c2a9]
                "
              >
                {icon}
              </span>

              <span>
                {item}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}

