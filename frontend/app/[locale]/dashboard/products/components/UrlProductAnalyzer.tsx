"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { usePathname } from "next/navigation";
import {
  Link as LinkIcon,
  Sparkles,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";

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

type Supplier = {
  url: string;
  title?: string | null;
  image_url?: string | null;
  price?: number | null;
  currency?: string | null;
  match_score?: number | null;
  supplier_confidence?: string | null;
  search_query?: string | null;
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
  suppliers?: Supplier[];
};

type ProcessingStep = {
  label: string;
  progress: number;
};

export default function UrlProductAnalyzer() {
  const pathname = usePathname();
  const language = pathname?.startsWith("/tr") ? "tr" : "en";

  const text =
    language === "tr"
      ? {
          analyzer: "AI Ürün Analizcisi",
          subtitle:
            "Herhangi bir ürün URL'sini Etsy'ye hazır bir listelemeye dönüştürün",
          placeholder: "Ürün URL'sini yapıştırın...",
          analyze: "Listelemeyi Hazırla",
          preparing: "Hazırlanıyor...",
          generated: "AI TARAFINDAN OLUŞTURULDU",
          ready: "Etsy Listelemesi Hazır",
          readyDescription:
            "Ürün bilgileri analiz edildi ve Etsy için optimize edildi.",
          sourceProduct: "Kaynak Ürün",
          source: "Kaynak",
          title: "Etsy Başlığı",
          description: "Etsy Açıklaması",
          category: "Kategori",
          tags: "Etsy Etiketleri",
          materials: "Malzemeler",
          keywords: "SEO Anahtar Kelimeleri",
          price: "Fiyat",
          quantity: "Adet",
          images: "Görseller",
          available: "mevcut",
          copy: "Kopyala",
          copied: "Kopyalandı",
          copyListing: "Listelemeyi Kopyala",
          analysis: "AI Analizi",
          readiness: "Etsy Hazırlık",
          seo: "SEO",
          titleScore: "Başlık",
          descriptionScore: "Açıklama",
          strengths: "Güçlü Yönler",
          weaknesses: "Sorunlar",
          recommendations: "Öneriler",
          missing: "Eksik Bilgiler",
          viewAnalysis: "Detaylı analizi göster",
          hideAnalysis: "Analizi gizle",
          urlRequired: "Lütfen ürün URL'si girin.",
          analysisFailed: "Ürün analizi başarısız oldu.",
          somethingWrong: "Bir hata oluştu.",
          originalProduct: "AI tarafından hazırlanan listeleme",
          processingTitle: "Etsy listelemeniz hazırlanıyor",
          processingDescription:
            "Ürün bilgileri analiz ediliyor. Bu işlem birkaç saniye sürebilir.",
          stepProduct: "Ürün bilgileri alınıyor",
          stepImages: "Ürün görselleri inceleniyor",
          stepListing: "Etsy listelemesi oluşturuluyor",
          stepSeo: "SEO ve anahtar kelimeler kontrol ediliyor",
          stepFinal: "Sonuç hazırlanıyor",
          almostDone: "Son dokunuşlar yapılıyor...",
          more: "daha",
          showMore: "Daha fazlasını göster ↓",
          showLess: "Daha az göster ↑",
          suppliers: "Benzer Tedarikçiler",
          suppliersDescription: "Ürününüzle eşleşen AliExpress ürünleri",
          findSuppliers: "AliExpress ürünlerini bul",
          supplierSearch: "Tedarikçi aranıyor...",
          viewSupplier: "Ürünü görüntüle",
          noSuppliers: "Uygun AliExpress ürünü bulunamadı.",
        }
      : {
          analyzer: "AI Product Analyzer",
          subtitle:
            "Turn any product URL into an Etsy-ready listing",
          placeholder: "Paste product URL...",
          analyze: "Prepare Listing",
          preparing: "Preparing...",
          generated: "AI GENERATED",
          ready: "Etsy Listing Ready",
          readyDescription:
            "Product information has been analyzed and optimized for Etsy.",
          sourceProduct: "Source Product",
          source: "Source",
          title: "Etsy Title",
          description: "Etsy Description",
          category: "Category",
          tags: "Etsy Tags",
          materials: "Materials",
          keywords: "SEO Keywords",
          price: "Price",
          quantity: "Quantity",
          images: "Images",
          available: "available",
          copy: "Copy",
          copied: "Copied",
          copyListing: "Copy Listing",
          analysis: "AI Analysis",
          readiness: "Etsy Readiness",
          seo: "SEO",
          titleScore: "Title",
          descriptionScore: "Description",
          strengths: "Strengths",
          weaknesses: "Issues",
          recommendations: "Recommendations",
          missing: "Missing Information",
          viewAnalysis: "View detailed analysis",
          hideAnalysis: "Hide analysis",
          urlRequired: "Please enter a product URL.",
          analysisFailed: "Product analysis failed.",
          somethingWrong: "Something went wrong.",
          originalProduct: "AI generated listing",
          processingTitle: "Preparing your Etsy listing",
          processingDescription:
            "Your product information is being analyzed. This may take a few seconds.",
          stepProduct: "Collecting product information",
          stepImages: "Processing product images",
          stepListing: "Generating Etsy listing",
          stepSeo: "Checking SEO and keywords",
          stepFinal: "Finalizing your listing",
          almostDone: "Adding the final touches...",
          more: "more",
          showMore: "Show more ↓",
          showLess: "Show less ↑",
          suppliers: "Similar Suppliers",
          suppliersDescription: "AliExpress products matching your source product",
          findSuppliers: "Find AliExpress products",
          supplierSearch: "Searching suppliers...",
          viewSupplier: "View product",
          noSuppliers: "No suitable AliExpress products found.",
        };

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [progress, setProgress] = useState(0);
  const [supplierLoading, setSupplierLoading] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);

  const processingStartTime = useRef<number | null>(null);

  const processingSteps: ProcessingStep[] = [
    {
      label: text.stepProduct,
      progress: 18,
    },
    {
      label: text.stepImages,
      progress: 38,
    },
    {
      label: text.stepListing,
      progress: 62,
    },
    {
      label: text.stepSeo,
      progress: 82,
    },
    {
      label: text.stepFinal,
      progress: 92,
    },
  ];

  /*
   * ---------------------------------------------------------------
   * PROCESSING PROGRESS
   * ---------------------------------------------------------------
   *
   * Backend şu anda tek bir POST request döndürüyor.
   *
   * Bu yüzden burada gerçek backend progress'i değil,
   * kullanıcı deneyimi için kontrollü bir progress gösteriyoruz.
   *
   * ÖNEMLİ:
   * Progress hiçbir zaman request devam ederken %92'yi geçmez.
   * Backend gerçekten cevap verdiğinde %100 yapılır.
   */

  useEffect(() => {
    if (!loading) return;

    const interval = window.setInterval(() => {
      if (!processingStartTime.current) return;

      const elapsed =
        (Date.now() - processingStartTime.current) / 1000;

      /*
       * Backend tek bir POST request döndürüyor.
       * Bu nedenle burada gerçek backend progress'i değil,
       * kullanıcı deneyimi için kontrollü bir progress gösteriyoruz.
       *
       * Mevcut gerçek backend süresi yaklaşık 5.58 saniye.
       * Ancak farklı URL'lerde süre değişebileceği için progress
       * request devam ederken %95'i geçmez.
       */
      if (elapsed < 1.5) {
        setProcessingStep(0);

        const value =
          4 + (elapsed / 1.5) * 16;

        setProgress(Math.min(20, value));
      } else if (elapsed < 4) {
        setProcessingStep(1);

        const value =
          20 + ((elapsed - 1.5) / 2.5) * 20;

        setProgress(Math.min(40, value));
      } else if (elapsed < 8) {
        setProcessingStep(2);

        const value =
          40 + ((elapsed - 4) / 4) * 22;

        setProgress(Math.min(62, value));
      } else if (elapsed < 12) {
        setProcessingStep(3);

        const value =
          62 + ((elapsed - 8) / 4) * 18;

        setProgress(Math.min(80, value));
      } else {
        setProcessingStep(4);

        const value =
          80 + Math.min((elapsed - 12) / 8, 1) * 15;

        setProgress(Math.min(95, value));
      }
    }, 100);

    return () => {
      window.clearInterval(interval);
    };
  }, [loading]);

  async function analyzeProduct() {
    if (!url.trim()) {
      setError(text.urlRequired);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setProgress(4);
    setProcessingStep(0);
    processingStartTime.current = Date.now();

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:8000";

      /*
       * ---------------------------------------------------------
       * URL CLEANING
       * ---------------------------------------------------------
       *
       * AliExpress URL'lerinde search/tracking parametrelerini
       * backend'e göndermiyoruz. Ürün sayfası için origin +
       * pathname yeterli. Kullanıcının inputundaki URL değişmez.
       */
      const rawUrl = url.trim();
      let cleanUrl = rawUrl;

      try {
        const parsedUrl = new URL(rawUrl);

        if (parsedUrl.hostname.toLowerCase().includes("aliexpress.")) {
          cleanUrl = `${parsedUrl.origin}${parsedUrl.pathname}`;
        }
      } catch {
        // Geçersiz URL kontrolünü backend yapacak.
      }

      /*
       * ---------------------------------------------------------
       * BACKEND REQUEST
       * ---------------------------------------------------------
       */
      const response = await fetch(
        `${apiUrl}/products/url-analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: cleanUrl,
            language,
          }),
        }
      );

      let data: ApiResponse | null = null;

      try {
        data = await response.json();
      } catch {
        throw new Error(text.analysisFailed);
      }

      if (!response.ok) {
        const detail =
          data && typeof data === "object" && "detail" in data
            ? String(
                (data as ApiResponse & {
                  detail?: string;
                }).detail || ""
              )
            : "";

        throw new Error(
          detail || text.analysisFailed
        );
      }

      if (!data) {
        throw new Error(text.analysisFailed);
      }

      /*
       * ---------------------------------------------------------
       * FIND ALIEXPRESS SUPPLIERS
       * ---------------------------------------------------------
       *
       * URL analyzer sonucundaki gerçek kaynak ürün verisini
       * supplier finder'a gönderiyoruz. Supplier araması başarısız
       * olsa bile Etsy listing sonucu kaybolmamalı.
       */
      let finalData: ApiResponse = data;
      setSupplierLoading(true);

      try {
        const supplierResponse = await fetch(
          `${apiUrl}/products/find-supplier`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: data.product.title,
              description: data.product.description || "",
              image_urls: data.product.images || [],
            }),
          }
        );

        if (supplierResponse.ok) {
          const supplierData = await supplierResponse.json();

          finalData = {
            ...data,
            suppliers: Array.isArray(supplierData.suppliers)
              ? supplierData.suppliers
              : [],
          };
        } else {
          console.warn(
            "Supplier finder request failed:",
            await supplierResponse.text()
          );
        }
      } catch (supplierError) {
        console.warn(
          "Supplier finder error:",
          supplierError
        );
      } finally {
        setSupplierLoading(false);
      }

      /*
       * ---------------------------------------------------------
       * COMPLETED
       * ---------------------------------------------------------
       */
      setProcessingStep(
        processingSteps.length - 1
      );
      setProgress(100);

      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 350);
      });

      setResult(finalData);
    } catch (err) {
      setProgress(0);

      setError(
        err instanceof Error
          ? err.message
          : text.somethingWrong
      );
    } finally {
      setLoading(false);
      processingStartTime.current = null;
    }
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Enter") {
      analyzeProduct();
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl pb-8">

      {/* ============================================================
          INPUT
      ============================================================ */}

      <section
        className="
          overflow-hidden rounded-2xl border
          border-[#dce8e3] bg-white
          shadow-[0_12px_40px_rgba(20,61,50,0.06)]
          dark:border-[#29483d]
          dark:bg-[#12241e]
        "
      >
        <div className="px-5 py-5 sm:px-6">

          <div className="mb-4 flex items-center gap-3">

            <div
              className="
                flex h-9 w-9 shrink-0 items-center justify-center
                rounded-xl bg-[#e4f4ed]
                text-[#15966a]
                dark:bg-[#173d31]
              "
            >
              <Sparkles size={17} />
            </div>

            <div>
              <h2
                className="
                  text-sm font-semibold
                  text-[#17382d]
                  dark:text-white
                "
              >
                {text.analyzer}
              </h2>

              <p
                className="
                  mt-0.5 text-xs
                  text-[#7b8984]
                  dark:text-[#8da39a]
                "
              >
                {text.subtitle}
              </p>
            </div>

          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row">

            <div className="relative flex-1">

              <LinkIcon
                size={16}
                className="
                  absolute left-3.5 top-1/2
                  -translate-y-1/2
                  text-[#8b9893]
                "
              />

              <input
                type="url"
                value={url}
                onChange={(event) => {
                  setUrl(event.target.value);

                  if (error) {
                    setError("");
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder={text.placeholder}
                disabled={loading}
                className="
                  h-11 w-full rounded-xl
                  border border-[#dce8e3]
                  bg-[#f8fbf9]
                  pl-10 pr-4
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
                flex h-11 items-center justify-center gap-2
                rounded-xl bg-[#143d32]
                px-5 text-xs font-semibold text-white
                transition hover:bg-[#1c5143]
                disabled:cursor-not-allowed
                disabled:opacity-60
                sm:min-w-[155px]
              "
            >
              {loading ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />

                  {text.preparing}
                </>
              ) : (
                <>
                  <Sparkles size={16} />

                  {text.analyze}
                </>
              )}
            </button>

          </div>

          {/* ERROR */}

          {error && (
            <div
              className="
                mt-3 flex items-start gap-2
                rounded-xl border border-red-200
                bg-red-50 px-3.5 py-3
                text-xs text-red-700
                dark:border-red-900/40
                dark:bg-red-950/20
                dark:text-red-300
              "
            >
              <AlertCircle
                size={15}
                className="mt-0.5 shrink-0"
              />

              <span>{error}</span>
            </div>
          )}

          {/* PROCESSING */}

          {loading && (
            <ProcessingPanel
              progress={progress}
              currentStep={processingStep}
              steps={processingSteps}
              title={text.processingTitle}
              description={text.processingDescription}
              almostDone={text.almostDone}
            />
          )}

        </div>
      </section>

      {/* RESULT */}

      {result && (
        <ListingResult
          result={result}
          text={text}
          supplierLoading={supplierLoading}
        />
      )}

    </div>
  );
}

/* ================================================================
   PROCESSING PANEL
================================================================ */

function ProcessingPanel({
  progress,
  currentStep,
  steps,
  title,
  description,
  almostDone,
}: {
  progress: number;
  currentStep: number;
  steps: ProcessingStep[];
  title: string;
  description: string;
  almostDone: string;
}) {
  return (
    <div
      className="
        mt-5 overflow-hidden rounded-2xl
        border border-[#dce8e3]
        bg-[#f8fbf9]
        dark:border-[#29483d]
        dark:bg-[#0d1b16]
      "
    >
      <div className="px-5 py-5">

        {/* HEADER */}

        <div className="flex items-start justify-between gap-4">

          <div className="flex items-start gap-3">

            <div
              className="
                flex h-9 w-9 shrink-0 items-center justify-center
                rounded-xl bg-[#e4f4ed]
                text-[#15966a]
                dark:bg-[#173d31]
              "
            >
              <Sparkles
                size={17}
                className="animate-pulse"
              />
            </div>

            <div>
              <h3
                className="
                  text-sm font-semibold
                  text-[#17382d]
                  dark:text-white
                "
              >
                {title}
              </h3>

              <p
                className="
                  mt-1 max-w-xl
                  text-[11px] leading-4
                  text-[#7b8984]
                  dark:text-[#8da39a]
                "
              >
                {description}
              </p>
            </div>

          </div>

          <span
            className="
              shrink-0 text-sm font-bold
              text-[#15966a]
            "
          >
            {Math.round(progress)}%
          </span>

        </div>

        {/* PROGRESS BAR */}

        <div className="mt-5">

          <div
            className="
              h-2 overflow-hidden rounded-full
              bg-[#dfeae5]
              dark:bg-[#203a31]
            "
          >
            <div
              className="
                h-full rounded-full
                bg-[#15966a]
                transition-all duration-500
                ease-out
              "
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

        </div>

        {/* STEPS */}

        <div
          className="
            mt-5 grid gap-2
            sm:grid-cols-5
          "
        >
          {steps.map((step, index) => {

            const completed =
              index < currentStep;

            const active =
              index === currentStep;

            return (
              <div
                key={step.label}
                className="
                  flex items-center gap-2
                  rounded-lg
                  px-2 py-1.5
                "
              >

                <div
                  className={`
                    flex h-5 w-5 shrink-0
                    items-center justify-center
                    rounded-full
                    text-[9px] font-bold
                    transition

                    ${
                      completed
                        ? "bg-[#15966a] text-white"
                        : active
                          ? "border-2 border-[#15966a] bg-[#e4f4ed] text-[#15966a] dark:bg-[#173d31]"
                          : "border border-[#cbd9d3] text-[#9aa8a2] dark:border-[#355247]"
                    }
                  `}
                >
                  {completed ? (
                    <Check size={11} />
                  ) : active ? (
                    <Loader2
                      size={10}
                      className="animate-spin"
                    />
                  ) : (
                    index + 1
                  )}
                </div>

                <span
                  className={`
                    text-[9px] leading-3

                    ${
                      completed || active
                        ? "font-medium text-[#365c4e] dark:text-[#b3c9c0]"
                        : "text-[#9aa7a2] dark:text-[#657b72]"
                    }
                  `}
                >
                  {step.label}
                </span>

              </div>
            );
          })}
        </div>

        {/* CURRENT STEP */}

        <div
          className="
            mt-4 flex items-center
            justify-center gap-2
            text-[10px]
            text-[#8b9893]
          "
        >
          <Loader2
            size={11}
            className="animate-spin"
          />

          <span>
            {progress >= 90
              ? almostDone
              : steps[currentStep]?.label}
          </span>
        </div>

      </div>
    </div>
  );
}

/* ================================================================
   LISTING RESULT
================================================================ */

function ListingResult({
  result,
  text,
  supplierLoading,
}: {
  result: ApiResponse;
  text: Record<string, string>;
  supplierLoading: boolean;
}) {
  const [showAnalysis, setShowAnalysis] =
    useState(false);

  const listing =
    result.analysis.etsy_listing;

  const analysis =
    result.analysis.analysis;

  const product =
    result.product;

  return (
    <div className="mt-5 space-y-4">

      {/* RESULT HEADER */}

      <div
        className="
          rounded-2xl border
          border-[#dce8e3] bg-white
          px-5 py-4
          shadow-[0_10px_30px_rgba(20,61,50,0.04)]
          dark:border-[#29483d]
          dark:bg-[#12241e]
        "
      >
        <div
          className="
            flex flex-col gap-4
            sm:flex-row sm:items-center
            sm:justify-between
          "
        >

          <div className="flex items-center gap-3">

            <div
              className="
                flex h-9 w-9 items-center
                justify-center rounded-xl
                bg-[#e4f4ed]
                text-[#15966a]
                dark:bg-[#173d31]
              "
            >
              <Check size={17} />
            </div>

            <div>

              <p
                className="
                  text-[9px] font-bold uppercase
                  tracking-[0.18em]
                  text-[#4b9b83]
                "
              >
                {text.generated}
              </p>

              <h2
                className="
                  mt-0.5 text-base font-semibold
                  text-[#17382d]
                  dark:text-white
                "
              >
                {text.ready}
              </h2>

              <p
                className="
                  mt-0.5 text-xs
                  text-[#7b8984]
                  dark:text-[#8da39a]
                "
              >
                {text.readyDescription}
              </p>

            </div>

          </div>

          <CopyListingButton
            listing={listing}
            text={text}
          />

        </div>
      </div>

      {/* SOURCE + GENERATED */}

      <div
        className="
          grid gap-4
          lg:grid-cols-[280px_1fr]
        "
      >

        <SourceProduct
          product={product}
          text={text}
        />

        <div
          className="
            rounded-2xl border
            border-[#dce8e3] bg-white
            p-5
            dark:border-[#29483d]
            dark:bg-[#12241e]
          "
        >

          <div
            className="
              mb-4 flex items-center
              justify-between gap-3
            "
          >

            <div>

              <p
                className="
                  text-[9px] font-bold uppercase
                  tracking-[0.16em]
                  text-[#4b9b83]
                "
              >
                {text.generated}
              </p>

              <h3
                className="
                  mt-1 text-sm font-semibold
                  text-[#17382d]
                  dark:text-white
                "
              >
                {text.originalProduct}
              </h3>

            </div>

            <ScoreBadge
              score={
                analysis.etsy_suitability_score
              }
              label={text.readiness}
            />

          </div>

          <div className="space-y-3">

            <CompactField
              label={text.title}
              value={listing.title}
              copyable
              language={result.language}
            />

            <CompactField
              label={text.description}
              value={listing.description}
              copyable
              multiline
              language={result.language}
            />

          </div>

        </div>

      </div>

      {/* CATEGORY + DETAILS */}

      <div
        className="
          rounded-2xl border
          border-[#dce8e3] bg-white
          p-5
          dark:border-[#29483d]
          dark:bg-[#12241e]
        "
      >

        <div
          className="
            grid gap-4
            md:grid-cols-[1fr_auto]
            md:items-center
          "
        >

          <div className="min-w-0">

            <p
              className="
                text-[10px] font-medium
                uppercase tracking-wide
                text-[#7b8984]
              "
            >
              {text.category}
            </p>

            <p
              className="
                mt-1 truncate text-sm font-medium
                text-[#17382d]
                dark:text-white
              "
            >
              {listing.category || "—"}
            </p>

          </div>

          <div
            className="
              grid grid-cols-3 gap-2
              sm:gap-3
            "
          >

            <MiniDetail
              label={text.price}
              value={
                listing.price !== null
                  ? `${listing.price} ${
                      listing.currency || ""
                    }`
                  : "—"
              }
            />

            <MiniDetail
              label={text.quantity}
              value={String(listing.quantity)}
            />

            <MiniDetail
              label={text.images}
              value={`${listing.images?.length || 0}`}
            />

          </div>

        </div>

      </div>

      {/* SEO */}

      <div
        className="
          rounded-2xl border
          border-[#dce8e3] bg-white
          p-5
          dark:border-[#29483d]
          dark:bg-[#12241e]
        "
      >

        <div className="mb-4">

          <p
            className="
              text-sm font-semibold
              text-[#17382d]
              dark:text-white
            "
          >
            SEO & Attributes
          </p>

          <p
            className="
              mt-0.5 text-[11px]
              text-[#7b8984]
              dark:text-[#8da39a]
            "
          >
            {text.tags}, {text.materials} &{" "}
            {text.keywords}
          </p>

        </div>

        <div className="space-y-4">

          {listing.tags?.length > 0 && (
            <ChipGroup
              label={text.tags}
              items={listing.tags}
            />
          )}

          {listing.materials?.length > 0 && (
            <ChipGroup
              label={text.materials}
              items={listing.materials}
            />
          )}

          {listing.keywords?.length > 0 && (
            <ChipGroup
              label={text.keywords}
              items={listing.keywords}
              muted
            />
          )}

        </div>

      </div>

      {/* ALIEXPRESS SUPPLIERS */}

      <div
        className="
          overflow-hidden rounded-2xl border
          border-[#dce8e3] bg-white
          dark:border-[#29483d]
          dark:bg-[#12241e]
        "
      >
        <div className="border-b border-[#e6eeea] px-5 py-4 dark:border-[#29483d]">
          <div className="flex items-center gap-3">
            <div
              className="
                flex h-8 w-8 items-center justify-center
                rounded-lg bg-[#e4f4ed] text-[#15966a]
                dark:bg-[#173d31]
              "
            >
              {supplierLoading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <ExternalLink size={15} />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#17382d] dark:text-white">
                {text.suppliers}
              </p>
              <p className="mt-0.5 text-[11px] text-[#7b8984] dark:text-[#8da39a]">
                {supplierLoading
                  ? text.supplierSearch
                  : text.suppliersDescription}
              </p>
            </div>
          </div>
        </div>

        {supplierLoading ? (
          <div className="flex items-center gap-2 px-5 py-5 text-xs text-[#7b8984] dark:text-[#8da39a]">
            <Loader2 size={14} className="animate-spin" />
            {text.supplierSearch}
          </div>
        ) : result.suppliers?.length ? (
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.suppliers.map((supplier, index) => (
              <a
                key={`${supplier.url}-${index}`}
                href={supplier.url}
                target="_blank"
                rel="noreferrer"
                className="group overflow-hidden rounded-xl border border-[#e2ebe7] bg-[#fbfdfc] transition hover:-translate-y-0.5 hover:border-[#bfd9cf] dark:border-[#29483d] dark:bg-[#0d1b16]"
              >
                <div className="aspect-[1.2] overflow-hidden bg-[#f3f7f5] dark:bg-[#13261f]">
                  {supplier.image_url ? (
                    <img
                      src={supplier.image_url}
                      alt={supplier.title || "AliExpress product"}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[#8da39a]">
                      <ImageIcon size={20} />
                    </div>
                  )}
                </div>

                <div className="space-y-2 p-3">
                  <p className="line-clamp-2 text-xs font-medium text-[#17382d] dark:text-white">
                    {supplier.title || supplier.search_query || "AliExpress product"}
                  </p>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#17382d] dark:text-[#d9eee6]">
                      {supplier.price != null
                        ? `${supplier.price} ${supplier.currency || ""}`
                        : "—"}
                    </span>

                    {supplier.match_score != null && (
                      <span className="rounded-full bg-[#e4f4ed] px-2 py-1 text-[10px] font-semibold text-[#27785f] dark:bg-[#173d31] dark:text-[#9bd2bd]">
                        {supplier.match_score}% match
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[10px] font-medium text-[#5f776e] group-hover:text-[#17382d] dark:text-[#8da39a] dark:group-hover:text-white">
                    {text.viewSupplier}
                    <ExternalLink size={11} />
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="px-5 py-5 text-xs text-[#7b8984] dark:text-[#8da39a]">
            {text.noSuppliers}
          </div>
        )}
      </div>

      {/* AI ANALYSIS */}

      <div
        className="
          overflow-hidden rounded-2xl border
          border-[#dce8e3] bg-white
          dark:border-[#29483d]
          dark:bg-[#12241e]
        "
      >

        <button
          type="button"
          onClick={() =>
            setShowAnalysis(!showAnalysis)
          }
          className="
            flex w-full items-center
            justify-between
            px-5 py-4 text-left
            transition
            hover:bg-[#f8fbf9]
            dark:hover:bg-[#0d1b16]
          "
        >

          <div className="flex items-center gap-3">

            <div
              className="
                flex h-8 w-8 items-center
                justify-center rounded-lg
                bg-[#e4f4ed]
                text-[#15966a]
                dark:bg-[#173d31]
              "
            >
              <Sparkles size={15} />
            </div>

            <div>

              <p
                className="
                  text-sm font-semibold
                  text-[#17382d]
                  dark:text-white
                "
              >
                {text.analysis}
              </p>

              <p
                className="
                  mt-0.5 text-[11px]
                  text-[#7b8984]
                  dark:text-[#8da39a]
                "
              >
                {showAnalysis
                  ? text.hideAnalysis
                  : text.viewAnalysis}
              </p>

            </div>

          </div>

          {showAnalysis ? (
            <ChevronUp
              size={17}
              className="text-[#7b8984]"
            />
          ) : (
            <ChevronDown
              size={17}
              className="text-[#7b8984]"
            />
          )}

        </button>

        {/* SCORES */}

        <div
          className="
            grid grid-cols-2
            border-t
            border-[#e6eeea]
            dark:border-[#29483d]
            sm:grid-cols-4
          "
        >

          <ScoreCell
            label={text.readiness}
            score={
              analysis.etsy_suitability_score
            }
            highlighted
          />

          <ScoreCell
            label={text.seo}
            score={analysis.seo_score}
          />

          <ScoreCell
            label={text.titleScore}
            score={analysis.title_score}
          />

          <ScoreCell
            label={text.descriptionScore}
            score={
              analysis.description_score
            }
          />

        </div>

        {/* DETAILS */}

        {showAnalysis && (
          <div
            className="
              grid gap-4
              border-t
              border-[#e6eeea]
              p-5
              dark:border-[#29483d]
              md:grid-cols-3
            "
          >

            <AnalysisList
              title={text.strengths}
              items={analysis.strengths}
              type="success"
              language={result.language}
              text={text}
            />

            <AnalysisList
              title={text.weaknesses}
              items={analysis.weaknesses}
              type="warning"
              language={result.language}
              text={text}
            />

            <AnalysisList
              title={text.recommendations}
              items={analysis.recommendations}
              type="neutral"
              language={result.language}
              text={text}
            />

            {result.analysis
              .missing_information
              ?.length > 0 && (
              <div className="md:col-span-3">
                <AnalysisList
                  title={text.missing}
                  items={
                    result.analysis
                      .missing_information
                  }
                  type="warning"
                  language={result.language}
                  text={text}
                />
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
}

/* ================================================================
   SOURCE PRODUCT
================================================================ */

function SourceProduct({
  product,
  text,
}: {
  product: ProductData;
  text: Record<string, string>;
}) {
  const image = product.images?.[0];

  return (
    <div
      className="
        overflow-hidden rounded-2xl border
        border-[#dce8e3] bg-white
        dark:border-[#29483d]
        dark:bg-[#12241e]
      "
    >

      <div
        className="
          relative aspect-[1.35]
          bg-[#f5f8f6]
          dark:bg-[#0d1b16]
        "
      >

        {image ? (
          <img
            src={image}
            alt={
              product.title ||
              text.sourceProduct
            }
            className="
              h-full w-full
              object-contain p-5
            "
          />
        ) : (
          <div
            className="
              flex h-full items-center
              justify-center
              text-[#8b9893]
            "
          >
            <ImageIcon size={28} />
          </div>
        )}

        <div
          className="
            absolute bottom-3 right-3
            rounded-lg border
            border-white/60
            bg-black/60
            px-2 py-1
            text-[10px] font-medium
            text-white
            backdrop-blur-sm
          "
        >
          {product.image_count ||
            product.images?.length ||
            0}{" "}
          {text.available}
        </div>

      </div>

      <div className="p-4">

        <p
          className="
            text-[9px] font-bold uppercase
            tracking-[0.16em]
            text-[#4b9b83]
          "
        >
          {text.sourceProduct}
        </p>

        <h3
          className="
            mt-1.5 line-clamp-2
            text-sm font-semibold
            leading-5
            text-[#17382d]
            dark:text-white
          "
        >
          {product.title || "—"}
        </h3>

        <div
          className="
            mt-3 flex items-center
            justify-between gap-3
          "
        >

          <div>

            <p
              className="
                text-[10px]
                text-[#7b8984]
              "
            >
              {text.price}
            </p>

            <p
              className="
                mt-0.5 text-sm font-semibold
                text-[#17382d]
                dark:text-white
              "
            >
              {product.price !== null
                ? `${product.price} ${
                    product.currency || ""
                  }`
                : "—"}
            </p>

          </div>

          {product.url && (
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="
                inline-flex items-center
                gap-1.5 rounded-lg border
                border-[#dce8e3]
                px-2.5 py-1.5
                text-[10px] font-medium
                text-[#24745b]
                transition
                hover:bg-[#eaf5f0]
                dark:border-[#29483d]
                dark:hover:bg-[#173d31]
              "
            >
              <ExternalLink size={12} />
              {text.source}
            </a>
          )}

        </div>

      </div>
    </div>
  );
}

/* ================================================================
   COMPACT FIELD
================================================================ */

function CompactField({
  label,
  value,
  copyable = false,
  multiline = false,
  language,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  multiline?: boolean;
  language: string;
}) {
  const [copied, setCopied] =
    useState(false);

  const [expanded, setExpanded] =
    useState(false);

  async function copy() {
    if (!value) return;

    await navigator.clipboard.writeText(
      value
    );

    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  const shouldCollapse =
    multiline && value.length > 260;

  return (
    <div>

      <div
        className="
          mb-1.5 flex items-center
          justify-between gap-3
        "
      >

        <p
          className="
            text-[10px] font-semibold
            uppercase tracking-wide
            text-[#7b8984]
          "
        >
          {label}
        </p>

        {copyable && (
          <button
            type="button"
            onClick={copy}
            className="
              inline-flex items-center
              gap-1 rounded-md px-2 py-1
              text-[10px] font-medium
              text-[#24745b]
              transition
              hover:bg-[#eaf5f0]
              dark:hover:bg-[#173d31]
            "
          >
            {copied ? (
              <>
                <Check size={11} />
                {language === "tr"
                  ? "Kopyalandı"
                  : "Copied"}
              </>
            ) : (
              <>
                <Copy size={11} />
                {language === "tr"
                  ? "Kopyala"
                  : "Copy"}
              </>
            )}
          </button>
        )}

      </div>

      <div
        className={`
          rounded-xl border
          border-[#e6eeea]
          bg-[#f8fbf9]
          px-3.5 py-3
          text-xs leading-5
          text-[#52665e]
          dark:border-[#29483d]
          dark:bg-[#0d1b16]
          dark:text-[#b1c6bd]

          ${
            shouldCollapse && !expanded
              ? "max-h-[82px] overflow-hidden"
              : ""
          }
        `}
      >
        {value || "—"}
      </div>

      {shouldCollapse && (
        <button
          type="button"
          onClick={() =>
            setExpanded(!expanded)
          }
          className="
            mt-1.5 text-[10px]
            font-medium
            text-[#15966a]
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

/* ================================================================
   SCORE BADGE
================================================================ */

function ScoreBadge({
  score,
  label,
}: {
  score: number;
  label: string;
}) {
  return (
    <div
      className="
        flex items-center gap-2
        rounded-xl border
        border-[#29483d]
        bg-[#0d1b16]
        px-3 py-2
      "
    >

      <div>

        <p
          className="
            text-[8px]
            uppercase tracking-wider
            text-[#7b8984]
          "
        >
          {label}
        </p>

        <p
          className="
            mt-0.5 text-lg font-bold
            leading-none text-white
          "
        >
          {score}

          <span
            className="
              ml-0.5 text-[9px]
              font-normal
              text-[#7b8984]
            "
          >
            /100
          </span>
        </p>

      </div>

      <div
        className="
          flex h-7 w-7
          items-center justify-center
          rounded-full border-2
          border-[#15966a]
          text-[9px] font-bold
          text-[#15966a]
        "
      >
        ✓
      </div>

    </div>
  );
}

/* ================================================================
   SCORE CELL
================================================================ */

function ScoreCell({
  label,
  score,
  highlighted = false,
}: {
  label: string;
  score: number;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`
        px-4 py-3.5

        ${
          highlighted
            ? "bg-[#f5faf7] dark:bg-[#10251e]"
            : ""
        }

        border-b
        border-[#e6eeea]
        dark:border-[#29483d]

        sm:border-b-0
        sm:border-r
        sm:last:border-r-0
      `}
    >

      <p
        className="
          text-[9px] font-medium
          uppercase tracking-wide
          text-[#7b8984]
        "
      >
        {label}
      </p>

      <div
        className="
          mt-1 flex items-baseline gap-1
        "
      >

        <span
          className="
            text-xl font-bold
            text-[#17382d]
            dark:text-white
          "
        >
          {score}
        </span>

        <span
          className="
            text-[9px]
            text-[#8b9893]
          "
        >
          /100
        </span>

      </div>

    </div>
  );
}

/* ================================================================
   MINI DETAIL
================================================================ */

function MiniDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        min-w-[78px]
        rounded-xl border
        border-[#e6eeea]
        bg-[#f8fbf9]
        px-3 py-2.5
        dark:border-[#29483d]
        dark:bg-[#0d1b16]
      "
    >

      <p
        className="
          text-[9px]
          text-[#7b8984]
        "
      >
        {label}
      </p>

      <p
        className="
          mt-0.5 truncate
          text-xs font-semibold
          text-[#17382d]
          dark:text-white
        "
      >
        {value}
      </p>

    </div>
  );
}

/* ================================================================
   CHIP GROUP
================================================================ */

function ChipGroup({
  label,
  items,
  muted = false,
}: {
  label: string;
  items: string[];
  muted?: boolean;
}) {
  return (
    <div>

      <p
        className="
          mb-2 text-[10px]
          font-semibold uppercase
          tracking-wide
          text-[#7b8984]
        "
      >
        {label}
      </p>

      <div className="flex flex-wrap gap-1.5">

        {items.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className={`
              rounded-lg
              px-2.5 py-1.5
              text-[10px] font-medium

              ${
                muted
                  ? "bg-[#f0f4f2] text-[#5d7169] dark:bg-[#183129] dark:text-[#9eb4aa]"
                  : "bg-[#e4f4ed] text-[#24745b] dark:bg-[#173d31] dark:text-[#79c2a9]"
              }
            `}
          >
            {item}
          </span>
        ))}

      </div>

    </div>
  );
}

/* ================================================================
   ANALYSIS LIST
================================================================ */

function AnalysisList({
  title,
  items,
  type,
  language,
  text,
}: {
  title: string;
  items: string[];
  type:
    | "success"
    | "warning"
    | "neutral";
  language: string;
  text: Record<string, string>;
}) {
  if (!items || items.length === 0) {
    return null;
  }

  const icon =
    type === "success"
      ? "✓"
      : type === "warning"
        ? "!"
        : "→";

  const iconClass =
    type === "success"
      ? "bg-[#e4f4ed] text-[#15966a] dark:bg-[#173d31]"
      : type === "warning"
        ? "bg-[#fff4df] text-[#b97813] dark:bg-[#3b2c16]"
        : "bg-[#edf2f0] text-[#5d7169] dark:bg-[#1b3029]";

  return (
    <div>

      <p
        className="
          mb-2 text-[10px]
          font-semibold uppercase
          tracking-wide
          text-[#7b8984]
        "
      >
        {title}
      </p>

      <div className="space-y-2">

        {items.slice(0, 4).map(
          (item, index) => (
            <div
              key={`${item}-${index}`}
              className="
                flex items-start gap-2.5
                rounded-xl border
                border-[#e6eeea]
                bg-[#f8fbf9]
                px-3 py-2.5
                dark:border-[#29483d]
                dark:bg-[#0d1b16]
              "
            >

              <span
                className={`
                  mt-0.5 flex h-5 w-5
                  shrink-0 items-center
                  justify-center rounded-md
                  text-[9px] font-bold
                  ${iconClass}
                `}
              >
                {icon}
              </span>

              <p
                className="
                  text-[10px] leading-4
                  text-[#52665e]
                  dark:text-[#b1c6bd]
                "
              >
                {item}
              </p>

            </div>
          )
        )}

      </div>

      {items.length > 4 && (
        <p
          className="
            mt-2 text-[9px]
            text-[#8b9893]
          "
        >
          +{items.length - 4}{" "}
          {language === "tr"
            ? text.more
            : text.more}
        </p>
      )}

    </div>
  );
}

/* ================================================================
   COPY ENTIRE LISTING
================================================================ */

function CopyListingButton({
  listing,
  text,
}: {
  listing: EtsyListing;
  text: Record<string, string>;
}) {
  const [copied, setCopied] =
    useState(false);

  async function copyListing() {
    const content = [
      "TITLE",
      listing.title,
      "",
      "DESCRIPTION",
      listing.description,
      "",
      "CATEGORY",
      listing.category,
      "",
      "TAGS",
      listing.tags.join(", "),
      "",
      "MATERIALS",
      listing.materials.join(", "),
      "",
      "SEO KEYWORDS",
      listing.keywords.join(", "),
      "",
      "PRICE",
      listing.price !== null
        ? `${listing.price} ${
            listing.currency || ""
          }`
        : "Not available",
      "",
      "QUANTITY",
      String(listing.quantity),
    ].join("\n");

    await navigator.clipboard.writeText(
      content
    );

    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1800);
  }

  return (
    <button
      type="button"
      onClick={copyListing}
      className="
        inline-flex items-center
        justify-center gap-2
        rounded-xl
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
          {text.copied}
        </>
      ) : (
        <>
          <Copy size={14} />
          {text.copyListing}
        </>
      )}
    </button>
  );
}