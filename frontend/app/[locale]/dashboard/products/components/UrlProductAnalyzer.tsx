"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Link as LinkIcon,
  Sparkles,
  Loader2,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { useTranslations } from "next-intl";

type ProductData = {
  url: string;
  title: string;
  description: string;
  price: number | null;
  currency: string | null;
  brand: string;
  images: string[];
  image_count: number;
};

type EtsyListing = {
  title: string;
  description: string;
  category: string;
  tags: string[];
  materials: string[];
  keywords: string[];
  price: number | null;
  currency: string | null;
  quantity: number;
  images: string[];
};

type Analysis = {
  etsy_suitability_score: number;
  seo_score: number;
  title_score: number;
  description_score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
};

type ApiResponse = {
  success: boolean;
  language: string;
  product: ProductData;
  analysis: {
    etsy_listing: EtsyListing;
    analysis: Analysis;
    missing_information: string[];
  };
};

export default function UrlProductAnalyzer() {
  const pathname = usePathname();

  const language =
    pathname?.startsWith("/tr") ? "tr" : "en";

  const t = {
    tr: {
      title: "AI Ürün Analizcisi",
      subtitle:
        "Herhangi bir ürün URL'sini Etsy'ye hazır bir listelemeye dönüştürün",
      placeholder: "Ürün URL'sini yapıştırın...",
      analyze: "Listelemeyi Hazırla",
      preparing: "Hazırlanıyor...",
      generated: "AI TARAFINDAN OLUŞTURULDU",
      ready: "Etsy Listelemesi Hazır",
      readyDescription:
        "Ürününüz Etsy için hazırlandı.",
      titleLabel: "Etsy Başlığı",
      descriptionLabel: "Etsy Açıklaması",
      category: "Kategori",
      tags: "Etsy Etiketleri",
      materials: "Malzemeler",
      price: "Fiyat",
      quantity: "Adet",
      images: "Görseller",
      unavailable: "Mevcut değil",
      copy: "Kopyala",
      copied: "Kopyalandı",
      copyListing: "Tüm Listelemeyi Kopyala",
      noImage: "Görsel yok",
      available: "mevcut",
      urlRequired: "Lütfen ürün URL'si girin.",
      analysisFailed: "Ürün analizi başarısız oldu.",
      somethingWrong: "Bir hata oluştu.",
    },

    en: {
      title: "AI Product Analyzer",
      subtitle:
        "Turn any product URL into an Etsy-ready listing",
      placeholder: "Paste product URL...",
      analyze: "Prepare Listing",
      preparing: "Preparing...",
      generated: "AI GENERATED",
      ready: "Etsy Listing Ready",
      readyDescription:
        "Your product has been prepared for Etsy.",
      titleLabel: "Etsy Title",
      descriptionLabel: "Etsy Description",
      category: "Category",
      tags: "Etsy Tags",
      materials: "Materials",
      price: "Price",
      quantity: "Quantity",
      images: "Images",
      unavailable: "Not available",
      copy: "Copy",
      copied: "Copied",
      copyListing: "Copy Entire Listing",
      noImage: "No image",
      available: "available",
      urlRequired: "Please enter a product URL.",
      analysisFailed: "Product analysis failed.",
      somethingWrong: "Something went wrong.",
    },
  }[language];

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] =
    useState<ApiResponse | null>(null);

  async function analyzeProduct() {
    if (!url.trim()) {
      setError(t.urlRequired);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:8000";

      const response = await fetch(
        `${apiUrl}/products/url-analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: url.trim(),
            language,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || t.analysisFailed
        );
      }

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t.somethingWrong
      );
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Enter") {
      analyzeProduct();
    }
  }

  return (
    <div className="mb-8">
      <div
        className="
          overflow-hidden
          rounded-[24px]
          border
          border-[#dce8e3]
          bg-white
          shadow-[0_20px_60px_rgba(20,61,50,0.08)]
          dark:border-[#29483d]
          dark:bg-[#12241e]
        "
      >
        {/* HEADER */}
        <div className="border-b border-[#e6eeea] px-6 py-5 dark:border-[#29483d]">
          <div className="flex items-center gap-3">
            <div
              className="
                flex h-10 w-10 items-center justify-center
                rounded-xl bg-[#e4f4ed] text-[#15966a]
                dark:bg-[#173d31]
              "
            >
              <Sparkles size={19} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-[#17382d] dark:text-white">
                AI Product Analyzer
              </h2>

              <p className="mt-0.5 text-xs text-[#7b8984] dark:text-[#8da39a]">
                Turn any product URL into an Etsy-ready listing
              </p>
            </div>
          </div>
        </div>

        {/* INPUT */}
        <div className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <LinkIcon
                size={17}
                className="
                  absolute left-4 top-1/2
                  -translate-y-1/2
                  text-[#8b9893]
                "
              />

              <input
                type="url"
                value={url}
                onChange={(event) =>
                  setUrl(event.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder={t.placeholder}
                disabled={loading}
                className="
                  h-12 w-full rounded-xl
                  border border-[#dce8e3]
                  bg-[#f8fbf9]
                  pl-11 pr-4
                  text-sm text-[#17382d]
                  outline-none transition
                  placeholder:text-[#9ba7a2]
                  focus:border-[#15966a]
                  focus:ring-4 focus:ring-[#15966a]/10
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                  dark:border-[#29483d]
                  dark:bg-[#0d1b16]
                  dark:text-white
                "
              />
            </div>

            <button
              type="button"
              onClick={analyzeProduct}
              disabled={loading}
              className="
                flex h-12 items-center justify-center
                gap-2 rounded-xl bg-[#143d32]
                px-6 text-sm font-semibold text-white
                transition hover:bg-[#1c5143]
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {loading ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  {t.preparing}
                </>
              ) : (
                <>
                  <Sparkles size={17} />
                  {t.analyze}
                </>
              )}
            </button>
          </div>

          {/* ERROR */}
          {error && (
            <div
              className="
                mt-4 flex items-start gap-2
                rounded-xl border border-red-200
                bg-red-50 px-4 py-3
                text-sm text-red-700
                dark:border-red-900/40
                dark:bg-red-950/20
                dark:text-red-300
              "
            >
              <AlertCircle
                size={17}
                className="mt-0.5 shrink-0"
              />

              <span>{error}</span>
            </div>
          )}

          {/* RESULT */}
          {result && (
            <ListingResult result={result} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   LISTING RESULT
============================================================ */

function ListingResult({
  result,
}: {
  result: ApiResponse;
}) {
  const t = useTranslations(
    "dashboard.productAnalyzer"
  );

  const listing = result.analysis.etsy_listing;
  const analysis = result.analysis.analysis;

  return (
    <div className="mt-6 border-t border-[#e6eeea] pt-6 dark:border-[#29483d]">
      {/* RESULT HEADER */}
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#4b9b83]">
          AI GENERATED
        </p>

        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-[#17382d] dark:text-white">
              Etsy Listing Ready
            </h3>

            <p className="mt-1 text-sm text-[#7b8984] dark:text-[#8da39a]">
              Your product has been prepared for Etsy.
            </p>
          </div>

          <CopyListingButton listing={listing} />
        </div>
      </div>

      {/* PRODUCT IMAGE + BASIC INFO */}
      <div className="grid gap-5 lg:grid-cols-[180px_1fr]">
        {/* PRODUCT IMAGE */}
        <div
          className="
            aspect-square overflow-hidden rounded-2xl
            border border-[#dce8e3]
            bg-[#f3f7f5]
            dark:border-[#29483d]
            dark:bg-[#0d1b16]
          "
        >
          {listing.images?.[0] ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="
                h-full
                w-full
                object-contain
                p-2
              "
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-[#8b9893]">
              No image
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-medium text-[#4b9b83]">
            {listing.category}
          </p>

          <h4 className="mt-2 text-lg font-semibold leading-7 text-[#17382d] dark:text-white">
            {listing.title}
          </h4>

          {/* ETSY READINESS */}
          <div
            className="
              mt-4
              inline-flex
              items-center
              gap-3
              rounded-xl
              border
              border-[#29483d]
              bg-[#0d1b16]
              px-4
              py-2.5
            "
          >
            <div>
              <p className="text-[9px] uppercase tracking-wider text-[#7b8984]">
                {t("etsyReadiness")}
              </p>

              <p className="text-xl font-bold text-white">
                {analysis.etsy_suitability_score}

                <span className="ml-1 text-[10px] font-normal text-[#7b8984]">
                  /100
                </span>
              </p>
            </div>

            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-full
                border-2
                border-[#15966a]
                text-[10px]
                font-bold
                text-[#15966a]
              "
            >
              ✓
            </div>
          </div>
        </div>
      </div>

      {/* TITLE */}
      <CopySection
  title="Etsy Title"
  value={listing.title}
  language={result.language}
/>

      {/* DESCRIPTION */}
      <CopySection
  title="Etsy Description"
  value={listing.description}
  multiline
  language={result.language}
/>

      {/* CATEGORY */}
      <div
        className="
          mt-4 rounded-2xl border
          border-[#dce8e3]
          bg-[#f8fbf9] p-4
          dark:border-[#29483d]
          dark:bg-[#0d1b16]
        "
      >
        <p className="text-xs font-semibold text-[#17382d] dark:text-white">
          Category
        </p>

        <div className="mt-2 flex items-center gap-2 text-sm text-[#4b6b60] dark:text-[#b3c9c0]">
          <span>{listing.category}</span>
        </div>
      </div>

      {/* TAGS */}
      <TagSection
        title="Etsy Tags"
        tags={listing.tags}
      />

      {/* MATERIALS */}
      {listing.materials.length > 0 && (
        <TagSection
          title="Materials"
          tags={listing.materials}
        />
      )}

      {/* KEYWORDS */}
      {listing.keywords.length > 0 && (
        <TagSection
          title="SEO Keywords"
          tags={listing.keywords}
        />
      )}

      {/* PRODUCT DETAILS */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <DetailCard
          label="Price"
          value={
            listing.price !== null
              ? `${listing.price} ${
                  listing.currency || ""
                }`
              : "Not available"
          }
        />

        <DetailCard
          label="Quantity"
          value={String(listing.quantity)}
        />

        <DetailCard
          label="Images"
          value={`${listing.images.length} available`}
        />
      </div>
    </div>
  );
}

/* ============================================================
   COPY SECTION
============================================================ */

function CopySection({
  title,
  value,
  multiline = false,
  language,
}: {
  title: string;
  value: string;
  multiline?: boolean;
  language: string;
}) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  return (
    <div
      className="
        mt-4 rounded-2xl border
        border-[#dce8e3]
        bg-white p-4
        dark:border-[#29483d]
        dark:bg-[#12241e]
      "
    >
      {/* HEADER */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-[#17382d] dark:text-white">
          {title}
        </p>

        <button
          type="button"
          onClick={copy}
          className="
            flex items-center gap-1.5
            rounded-lg px-2.5 py-1.5
            text-[11px] font-medium
            text-[#24745b]
            transition
            hover:bg-[#eaf5f0]
            dark:hover:bg-[#173d31]
          "
        >
          {copied ? (
            <>
              <Check size={13} />
              {language === "tr" ? "Kopyalandı" : "Copied"}
            </>
          ) : (
            <>
              <Copy size={13} />
              {language === "tr" ? "Kopyala" : "Copy"}
            </>
          )}
        </button>
      </div>

      {/* CONTENT */}
      <div
        className={`
          mt-3
          rounded-xl
          bg-[#f7faf8]
          px-4
          py-3
          text-sm
          leading-6
          text-[#52665e]
          dark:bg-[#0d1b16]
          dark:text-[#b1c6bd]
          ${
            multiline && !expanded
              ? "max-h-[95px] overflow-hidden"
              : ""
          }
        `}
      >
        {value ||
          (language === "tr"
            ? "Mevcut değil"
            : "Not available")}
      </div>

      {/* SHOW MORE / LESS */}
      {multiline && value.length > 300 && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="
            mt-2
            text-xs
            font-medium
            text-[#15966a]
            transition
            hover:text-[#0f7c56]
          "
        >
          {expanded
            ? language === "tr"
              ? "Daha az göster ↑"
              : "Show less ↑"
            : language === "tr"
              ? "Daha fazlasını göster ↓"
              : "Show more ↓"}
        </button>
      )}
    </div>
  );
}

/* ============================================================
   TAG SECTION
============================================================ */

function TagSection({
  title,
  tags,
}: {
  title: string;
  tags: string[];
}) {
  return (
    <div
      className="
        mt-4 rounded-2xl border
        border-[#dce8e3]
        bg-white p-4
        dark:border-[#29483d]
        dark:bg-[#12241e]
      "
    >
      <p className="text-xs font-semibold text-[#17382d] dark:text-white">
        {title}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="
              rounded-full
              bg-[#e4f4ed]
              px-3 py-1.5
              text-[11px] font-medium
              text-[#24745b]
              dark:bg-[#173d31]
              dark:text-[#79c2a9]
            "
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   DETAIL CARD
============================================================ */

function DetailCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        rounded-2xl border
        border-[#dce8e3]
        bg-white p-4
        dark:border-[#29483d]
        dark:bg-[#12241e]
      "
    >
      <p className="text-[10px] text-[#7b8984]">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-[#17382d] dark:text-white">
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   COPY ENTIRE LISTING
============================================================ */

function CopyListingButton({
  listing,
}: {
  listing: EtsyListing;
}) {
  const [copied, setCopied] = useState(false);

  async function copyListing() {
    const text = [
      `TITLE`,
      listing.title,

      "",

      `DESCRIPTION`,
      listing.description,

      "",

      `CATEGORY`,
      listing.category,

      "",

      `TAGS`,
      listing.tags.join(", "),

      "",

      `MATERIALS`,
      listing.materials.join(", "),

      "",

      `SEO KEYWORDS`,
      listing.keywords.join(", "),

      "",

      `PRICE`,
      listing.price !== null
        ? `${listing.price} ${
            listing.currency || ""
          }`
        : "Not available",

      "",

      `QUANTITY`,
      String(listing.quantity),
    ].join("\n");

    await navigator.clipboard.writeText(text);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1800);
  }

  return (
    <button
      type="button"
      onClick={copyListing}
      className="
        flex items-center justify-center
        gap-2 rounded-xl
        bg-[#143d32]
        px-4 py-2.5
        text-xs font-semibold
        text-white
        transition
        hover:bg-[#1c5143]
      "
    >
      {copied ? (
        <>
          <Check size={14} />
          Copied
        </>
      ) : (
        <>
          <Copy size={14} />
          Copy Entire Listing
        </>
      )}
    </button>
  );
}