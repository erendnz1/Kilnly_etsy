import Link from "next/link";

import { useLocale, useTranslations } from "next-intl";
import VisualBeforeAfter from "./components/VisualBeforeAfter";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "../ThemeToggle";

export default function HomePage() {
  const t = useTranslations();
  const locale = useLocale();

 return (
    <main className="min-h-screen bg-[#fafcfb] text-[#14201c] dark:bg-[#06110d] dark:text-[#f1f7f4]">

     {/* ===================================================== */}
{/* NAVBAR */}
{/* ===================================================== */}

<div className="sticky top-0 z-50 px-4 pt-3 sm:px-6">
  <nav
    className="
      mx-auto
      max-w-7xl
      rounded-full
      border
      border-[#e2ebe7]
      bg-white/95
      shadow-[0_8px_30px_rgba(20,61,50,0.06)]
      backdrop-blur-xl

      dark:border-[#19382e]
      dark:bg-[#091712]/95
      dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)]
    "
  >
    <div className="flex items-center justify-between px-5 py-3.5 sm:px-6 lg:px-7">

      {/* LOGO */}
      <Link
        href={`/${locale}`}
        className="flex items-center gap-2"
      >
        <div
          className="
            flex h-9 w-9
            items-center justify-center
            rounded-xl
            bg-[#143d32]
            text-sm font-bold
            text-white
            shadow-sm
            dark:bg-[#18503e]
          "
        >
          C
        </div>

        <span
          className="
            text-lg
            font-semibold
            tracking-tight
            text-[#143d32]
            dark:text-[#f1f7f4]
          "
        >
          CraftPilot
        </span>
      </Link>


      {/* NAV LINKS */}
      <div
        className="
          hidden
          items-center
          gap-2
          text-sm
          md:flex
        "
      >

        {/* FEATURES */}
        <a
          href="#features"
          className="
            rounded-full
            border border-transparent
            px-4 py-2.5
            font-medium
            text-[#68756f]
            transition-all duration-200

            hover:border-[#e2ebe7]
            hover:bg-[#f6faf8]
            hover:text-[#143d32]
            hover:shadow-[0_2px_8px_rgba(20,61,50,0.05)]

            dark:text-[#9fb4ab]
            dark:hover:border-[#24483c]
            dark:hover:bg-[#12251f]
            dark:hover:text-[#79c2a9]
          "
        >
          {t("nav.features")}
        </a>


        {/* HOW IT WORKS */}
        <a
          href="#how-it-works"
          className="
            rounded-full
            border border-transparent
            px-4 py-2.5
            font-medium
            text-[#68756f]
            transition-all duration-200

            hover:border-[#e2ebe7]
            hover:bg-[#f6faf8]
            hover:text-[#143d32]
            hover:shadow-[0_2px_8px_rgba(20,61,50,0.05)]

            dark:text-[#9fb4ab]
            dark:hover:border-[#24483c]
            dark:hover:bg-[#12251f]
            dark:hover:text-[#79c2a9]
          "
        >
          {t("nav.howItWorks")}
        </a>


        {/* PRICING */}
        <a
          href="#pricing"
          className="
            rounded-full
            border border-transparent
            px-4 py-2.5
            font-medium
            text-[#68756f]
            transition-all duration-200

            hover:border-[#e2ebe7]
            hover:bg-[#f6faf8]
            hover:text-[#143d32]
            hover:shadow-[0_2px_8px_rgba(20,61,50,0.05)]

            dark:text-[#9fb4ab]
            dark:hover:border-[#24483c]
            dark:hover:bg-[#12251f]
            dark:hover:text-[#79c2a9]
          "
        >
          {t("nav.pricing")}
        </a>

      </div>


      {/* ACTIONS */}
      <div className="flex items-center gap-2 sm:gap-3">

        {/* LOGIN */}
        <Link
          href={`/${locale}/login`}
          className="
            hidden
            text-sm
            font-medium
            text-[#46534f]
            transition
            hover:text-[#143d32]
            dark:text-[#c8d9d2]
            dark:hover:text-white
            sm:block
          "
        >
          {t("nav.login")}
        </Link>


        {/* START FREE */}
        <Link
          href={`/${locale}/register`}
          className="
            rounded-full
            bg-[#143d32]
            px-4 py-2.5
            text-sm font-semibold
            text-white
            shadow-[0_4px_14px_rgba(20,61,50,0.12)]
            transition-all duration-200

            hover:-translate-y-0.5
            hover:bg-[#1c5143]
            hover:shadow-[0_6px_18px_rgba(20,61,50,0.18)]

            sm:px-5
          "
        >
          {t("nav.startFree")}
        </Link>


        {/* LANGUAGE */}
        <LanguageSwitcher />


        {/* THEME */}
        <ThemeToggle />

      </div>

    </div>
  </nav>
</div>


      {/* ===================================================== */}
      {/* HERO */}
      {/* ===================================================== */}

      <section
        className="
          relative
          isolate
          overflow-hidden
          bg-[#f4faf7]
          dark:bg-[#020806]
        "
      >

        {/* ===================================================== */}
        {/* DARK MODE BACKGROUND EFFECTS */}
        {/* ===================================================== */}

        {/* Ana yeşil radial glow */}
        <div
          className="
            pointer-events-none
            absolute
            inset-0
            -z-20
            bg-[radial-gradient(circle_at_50%_25%,rgba(20,110,78,0.28),transparent_42%)]
            opacity-0
            dark:opacity-100
          "
        />


        {/* Üst merkez ışığı */}
        <div
          className="
            pointer-events-none
            absolute
            left-1/2
            top-[-180px]
            -z-10
            h-[520px]
            w-[900px]
            -translate-x-1/2
            rounded-full
            bg-[#1fa875]/20
            blur-[120px]
            opacity-0
            dark:opacity-100
          "
        />


        {/* Alt merkez yeşil ışık */}
        <div
          className="
            pointer-events-none
            absolute
            bottom-[-260px]
            left-1/2
            -z-10
            h-[520px]
            w-[900px]
            -translate-x-1/2
            rounded-full
            bg-[#0f8f61]/25
            blur-[110px]
            opacity-0
            dark:opacity-100
          "
        />


        {/* Sol alt neon glow */}
        <div
          className="
            pointer-events-none
            absolute
            -bottom-[100px]
            -left-40
            -z-10
            h-[420px]
            w-[420px]
            rounded-full
            bg-[#16a36d]/20
            blur-[100px]
            opacity-0
            dark:opacity-100
          "
        />


        {/* Sağ alt neon glow */}
        <div
          className="
            pointer-events-none
            absolute
            -bottom-[100px]
            -right-40
            -z-10
            h-[420px]
            w-[420px]
            rounded-full
            bg-[#16a36d]/20
            blur-[100px]
            opacity-0
            dark:opacity-100
          "
        />


        {/* ===================================================== */}
        {/* LARGE NEON ARC */}
        {/* ===================================================== */}

        <div
          className="
            pointer-events-none
            absolute
            left-1/2
            top-[100px]
            -z-10
            h-[780px]
            w-[1180px]
            -translate-x-1/2
            rounded-[50%]
            border
            border-transparent
            opacity-0
            dark:opacity-100
            [border-top-color:rgba(44,190,132,0.16)]
            [box-shadow:0_-10px_45px_rgba(25,180,120,0.04)]
          "
        />


        {/* İç neon arc */}
        <div
          className="
            pointer-events-none
            absolute
            left-1/2
            top-[190px]
            -z-10
            h-[600px]
            w-[920px]
            -translate-x-1/2
            rounded-[50%]
            border
            border-transparent
            opacity-0
            dark:opacity-100
            [border-top-color:rgba(79,220,160,0.09)]
          "
        />


        {/* ===================================================== */}
        {/* TOP LIGHT LINE */}
        {/* ===================================================== */}

        <div
          className="
            pointer-events-none
            absolute
            left-1/2
            top-0
            -z-10
            h-px
            w-[70%]
            -translate-x-1/2
            bg-transparent
            opacity-0
            dark:opacity-100
            shadow-[0_0_25px_8px_rgba(52,211,153,0.18)]
          "
        />


        {/* ===================================================== */}
        {/* HERO CONTAINER */}
        {/* ===================================================== */}

        <div
          className="
            mx-auto
            max-w-7xl
            px-6
            pb-12
            pt-10
            lg:px-8
            lg:pb-16
            lg:pt-14
          "
        >

          {/* =================================================== */}
          {/* HERO SPLIT */}
          {/* =================================================== */}

          <div
            className="
              grid
              items-center
              gap-10
              lg:grid-cols-[0.9fr_1.1fr]
              lg:gap-10
              xl:gap-12
            "
          >

            {/* ================================================= */}
            {/* LEFT SIDE - TEXT */}
            {/* ================================================= */}

            <div
              className="
                relative
                z-10
                text-center
                lg:text-left
              "
            >

              {/* BADGE */}
              <div
                className="
                  mb-7
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-[#d7e5df]
                  bg-white
                  px-4
                  py-2
                  text-sm
                  text-[#596861]
                  shadow-sm

                  dark:border-[#1b5742]
                  dark:bg-[#071a13]
                  dark:text-[#b9d8cb]
                  dark:shadow-[0_0_25px_rgba(37,180,125,0.08)]
                "
              >
                <span
                  className="
                    h-2
                    w-2
                    rounded-full
                    bg-[#55a98d]
                    dark:bg-[#4ade80]
                    dark:shadow-[0_0_12px_rgba(74,222,128,0.9)]
                  "
                />

                {t("hero.badge")}
              </div>


              {/* TITLE */}
              <h1
                className="
                  max-w-2xl
                  text-5xl
                  font-semibold
                  leading-[1.02]
                  tracking-[-0.045em]
                  text-[#143d32]

                  dark:bg-gradient-to-b
                  dark:from-white
                  dark:via-[#f1f8f5]
                  dark:to-[#9acdb8]
                  dark:bg-clip-text
                  dark:text-transparent

                  sm:text-5xl
                  lg:text-[3.6rem]
                  xl:text-[4rem]
                "
              >
                {t("hero.title")}
              </h1>


              {/* DESCRIPTION */}
              <p
                className="
                  mx-auto
                  mt-7
                  max-w-xl
                  text-lg
                  leading-8
                  text-[#697671]

                  dark:text-[#9bb8ad]

                  sm:text-xl
                  lg:mx-0
                "
              >
                {t("hero.description")}
              </p>


              {/* BUTTONS */}
              <div
                className="
                  mt-9
                  flex
                  flex-col
                  justify-center
                  gap-3
                  sm:flex-row
                  lg:justify-start
                "
              >

                {/* PRIMARY */}
                <Link
                  href={`/${locale}/register`}
                  className="
                    rounded-full
                    bg-[#143d32]
                    px-7
                    py-3.5
                    text-sm
                    font-semibold
                    text-white
                    shadow-lg
                    shadow-[#143d32]/10
                    transition
                    hover:-translate-y-0.5
                    hover:bg-[#1c5143]
                  "
                >
                  {t("hero.primaryButton")}
                </Link>


                {/* SECONDARY */}
                <a
                  href="#how-it-works"
                  className="
                    rounded-full
                    border
                    border-[#d8e2de]
                    bg-white
                    px-7
                    py-3.5
                    text-sm
                    font-semibold
                    text-[#30413b]
                    transition
                    hover:bg-[#f4f8f6]

                    dark:border-[#29483d]
                    dark:bg-[#12231e]
                    dark:text-[#d8e8e1]
                    dark:hover:bg-[#193129]
                  "
                >
                  {t("hero.secondaryButton")}
                </a>

              </div>


              {/* NOTE */}
              <p
                className="
                  mt-4
                  text-xs
                  text-[#8c9894]
                  dark:text-[#6f8d81]
                "
              >
                {t("hero.note")}
              </p>

            </div>


            {/* ================================================= */}
            {/* RIGHT SIDE - DASHBOARD */}
            {/* ================================================= */}
{/* ================================================= */}
{/* RIGHT SIDE - VIDEO */}
{/* ================================================= */}

<div className="relative">

  {/* HUGE GREEN GLOW */}
  <div
    className="
      pointer-events-none
      absolute
      -inset-16
      rounded-[50%]
      bg-[#cfeee1]/50
      blur-3xl

      dark:bg-[radial-gradient(
        ellipse_at_center,
        rgba(18,145,94,0.32),
        transparent_65%
      )]
    "
  />

  {/* VIDEO GLOW */}
  <div
    className="
      pointer-events-none
      absolute
      left-1/2
      top-1/2
      h-[320px]
      w-[700px]
      -translate-x-1/2
      -translate-y-1/2
      rounded-full
      bg-[#15966a]/15
      blur-[100px]
    "
  />

  {/* VIDEO FRAME */}
  <div
    className="
      relative
      overflow-hidden
      rounded-[28px]
      border
      border-[#dce8e3]
      bg-white
      p-2
      shadow-[0_35px_100px_rgba(20,61,50,0.14)]

      dark:border-[#174c3b]
      dark:bg-[#07140f]
      dark:shadow-[0_35px_100px_rgba(0,0,0,0.65)]
    "
  >

    <video
      src="/videos/Create_a_premium_–_second.mp4"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      className="
        block
        aspect-video
        w-full
        rounded-[22px]
        object-cover
      "
    />

  </div>

  {/* VIDEO BADGE */}
  <div
    className="
      absolute
      -bottom-5
      left-6
      flex
      items-center
      gap-2
      rounded-full
      border
      border-[#d7e8e1]
      bg-white
      px-4
      py-2.5
      text-sm
      font-semibold
      text-[#173c31]
      shadow-[0_12px_30px_rgba(20,61,50,0.12)]

      dark:border-[#31564a]
      dark:bg-[#12251f]
      dark:text-[#dcece6]
    "
  >

    <span
      className="
        flex
        h-6
        w-6
        items-center
        justify-center
        rounded-full
        bg-[#dff2ea]
        text-xs
        text-[#23745d]

        dark:bg-[#193b30]
        dark:text-[#79c2a9]
      "
    >
      ✦
    </span>

      {t("hero.videoBadge")}

  </div>

</div>

</div>   {/* HERO SPLIT */}
</div>   {/* HERO CONTAINER */}
</section> {/* HERO */}

{/* THE DIFFERENCE */}
<section
  className="
    relative overflow-hidden
    border-y border-[#dfece6]
    bg-[#f1f8f5]
    dark:border-[#1d342c]
    dark:bg-[#0f1d18]
  "
>
  {/* BACKGROUND GLOWS */}
  <div
    className="
      pointer-events-none
      absolute -left-40 top-10
      h-[500px] w-[500px]
      rounded-full
      bg-[#d8efe5]/60
      blur-3xl
      dark:bg-[#174c3b]/20
    "
  />

  <div
    className="
      pointer-events-none
      absolute -right-40 bottom-0
      h-[500px] w-[500px]
      rounded-full
      bg-[#ccebdd]/50
      blur-3xl
      dark:bg-[#174c3b]/20
    "
  />

  <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">

    {/* TOP HEADER */}
    <div className="mx-auto max-w-4xl text-center">

      {/* EYEBROW */}
      <p
        className="
          text-sm
          font-semibold
          uppercase
          tracking-[0.2em]
          text-[#3f967c]
        "
      >
        {t("theDifference.eyebrow")}
      </p>

      {/* TITLE */}
      <h2
        className="
          mx-auto
          mt-4
          max-w-4xl
          text-4xl
          font-semibold
          leading-[1.08]
          tracking-tight
          text-[#102d25]
          dark:text-[#f1f7f4]
          sm:text-5xl
          lg:text-[54px]
          xl:text-[58px]
        "
      >
        {t("theDifference.title")}
      </h2>

      {/* DESCRIPTION */}
      <p
        className="
          mx-auto
          mt-5
          max-w-3xl
          text-base
          leading-7
          text-[#697671]
          dark:text-[#9fb4ab]
          sm:text-lg
          sm:leading-8
        "
      >
        {t("theDifference.description")}
      </p>

    </div>


    {/* BOTTOM CONTENT */}
    <div
      className="
        mx-auto
        mt-14
        grid
        max-w-6xl
        items-center
        gap-10
        lg:grid-cols-[0.7fr_1.3fr]
        lg:gap-14
      "
    >

      {/* LEFT - FEATURES */}
      <div className="relative max-w-md">

        {/* FEATURE TITLE */}
        <p
          className="
            text-xs
            font-semibold
            uppercase
            tracking-[0.16em]
            text-[#82918b]
            dark:text-[#6f887d]
          "
        >
          {locale === "tr"
            ? "CraftPilot mağazanız için ne yapar?"
            : "What CraftPilot does for your store"}
        </p>


        {/* FEATURE POINTS */}
        <div className="mt-6 space-y-4">

          {/* SEO */}
          <div className="flex items-start gap-3">

            <span
              className="
                mt-0.5
                flex h-8 w-8 shrink-0
                items-center justify-center
                rounded-full
                bg-[#dff2ea]
                text-sm
                font-semibold
                text-[#23745d]
                dark:bg-[#193b30]
                dark:text-[#79c2a9]
              "
            >
              ✓
            </span>

            <div>
              <p
                className="
                  text-sm
                  font-semibold
                  text-[#183a31]
                  dark:text-[#e5f0eb]
                "
              >
                {t("theDifference.seoIssues")}
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  leading-6
                  text-[#71807b]
                  dark:text-[#91a79e]
                "
              >
                {locale === "tr"
                  ? "Ürün başlıklarını, etiketleri ve SEO fırsatlarını analiz eder."
                  : "Analyze titles, tags and SEO opportunities."}
              </p>
            </div>

          </div>


          {/* LISTINGS */}
          <div className="flex items-start gap-3">

            <span
              className="
                mt-0.5
                flex h-8 w-8 shrink-0
                items-center justify-center
                rounded-full
                bg-[#dff2ea]
                text-sm
                font-semibold
                text-[#23745d]
                dark:bg-[#193b30]
                dark:text-[#79c2a9]
              "
            >
              ✓
            </span>

            <div>
              <p
                className="
                  text-sm
                  font-semibold
                  text-[#183a31]
                  dark:text-[#e5f0eb]
                "
              >
                {t("theDifference.weakListings")}
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  leading-6
                  text-[#71807b]
                  dark:text-[#91a79e]
                "
              >
                {locale === "tr"
                  ? "Zayıf ürünleri ve geliştirilmesi gereken listingleri belirler."
                  : "Identify weak listings and improvement opportunities."}
              </p>
            </div>

          </div>


          {/* PRICING */}
          <div className="flex items-start gap-3">

            <span
              className="
                mt-0.5
                flex h-8 w-8 shrink-0
                items-center justify-center
                rounded-full
                bg-[#dff2ea]
                text-sm
                font-semibold
                text-[#23745d]
                dark:bg-[#193b30]
                dark:text-[#79c2a9]
              "
            >
              ✓
            </span>

            <div>
              <p
                className="
                  text-sm
                  font-semibold
                  text-[#183a31]
                  dark:text-[#e5f0eb]
                "
              >
                {t("theDifference.pricingIssue")}
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  leading-6
                  text-[#71807b]
                  dark:text-[#91a79e]
                "
              >
                {locale === "tr"
                  ? "Fiyatlandırma ve ürün performansındaki sorunları ortaya çıkarır."
                  : "Find pricing and product performance issues."}
              </p>
            </div>

          </div>


          {/* SUPPLIER */}
          <div className="flex items-start gap-3">

            <span
              className="
                mt-0.5
                flex h-8 w-8 shrink-0
                items-center justify-center
                rounded-full
                bg-[#dff2ea]
                text-sm
                font-semibold
                text-[#23745d]
                dark:bg-[#193b30]
                dark:text-[#79c2a9]
              "
            >
              ✓
            </span>

            <div>
              <p
                className="
                  text-sm
                  font-semibold
                  text-[#183a31]
                  dark:text-[#e5f0eb]
                "
              >
                {locale === "tr"
                  ? "Tedarikçi ve ürün fırsatlarını keşfedin"
                  : "Discover suppliers and product opportunities"}
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  leading-6
                  text-[#71807b]
                  dark:text-[#91a79e]
                "
              >
                {locale === "tr"
                  ? "Ürünleri analiz ederek daha iyi tedarik ve satış fırsatlarını keşfetmenize yardımcı olur."
                  : "Discover better sourcing and selling opportunities through product analysis."}
              </p>
            </div>

          </div>

        </div>


        {/* CTA */}
        <Link
          href={`/${locale}/register`}
          className="
            mt-8
            inline-flex
            items-center
            rounded-full
            bg-[#143d32]
            px-6
            py-3.5
            text-sm
            font-semibold
            text-white
            shadow-[0_12px_30px_rgba(20,61,50,0.18)]
            transition
            hover:-translate-y-0.5
            hover:bg-[#1c5143]
            dark:bg-[#1d5a49]
            dark:hover:bg-[#26725c]
          "
        >
          {t("theDifference.button")} →
        </Link>

      </div>


      {/* RIGHT - PRODUCT SHOWCASE */}
      <div className="relative min-w-0">

        {/* IMAGE GLOW */}
        <div
          className="
            pointer-events-none
            absolute
            -inset-10
            rounded-[50px]
            bg-[#bfe8d7]/50
            blur-3xl
            dark:bg-[#1b5947]/25
          "
        />

        {/* IMAGE FRAME */}
        <div
          className="
            relative
            overflow-hidden
            rounded-[30px]
            border
            border-[#cfe1da]
            bg-[#071812]
            p-2
            shadow-[0_30px_90px_rgba(20,61,50,0.24)]
            dark:border-[#29483d]
            dark:shadow-[0_30px_90px_rgba(0,0,0,0.45)]
          "
        >

          <img
            src="/ed3.png"
            alt={
              locale === "tr"
                ? "CraftPilot ürün analizi ve Etsy ürünleri"
                : "CraftPilot product analysis and Etsy products"
            }
            className="
              block
              h-auto
              w-full
              rounded-[22px]
              object-contain
            "
          />

        </div>


        {/* AI BADGE */}
        <div
          className="
            absolute
            -bottom-5
            left-6
            flex
            items-center
            gap-2
            rounded-full
            border
            border-[#d7e8e1]
            bg-white
            px-4
            py-2.5
            text-sm
            font-semibold
            text-[#173c31]
            shadow-[0_12px_30px_rgba(20,61,50,0.12)]
            dark:border-[#31564a]
            dark:bg-[#12251f]
            dark:text-[#dcece6]
          "
        >

          <span
            className="
              flex h-6 w-6
              items-center justify-center
              rounded-full
              bg-[#dff2ea]
              text-xs
              text-[#23745d]
              dark:bg-[#193b30]
              dark:text-[#79c2a9]
            "
          >
            ✦
          </span>

          {locale === "tr"
            ? "AI destekli ürün analizi"
            : "AI-powered product analysis"}

        </div>

      </div>

    </div>

  </div>
</section>

{/* AI STORE AUDIT */}
<section
  className="
    relative overflow-hidden
    border-y border-[#dfece6]
    bg-white
    dark:border-[#1d342c]
    dark:bg-[#0b1713]
  "
>
  {/* BACKGROUND GLOWS */}
  <div
    className="
      pointer-events-none absolute
      -left-40 top-1/2
      h-[420px] w-[420px]
      -translate-y-1/2
      rounded-full
      bg-[#d8f2e7]/55
      blur-[100px]
      dark:bg-[#174c3b]/20
    "
  />

  <div
    className="
      pointer-events-none absolute
      -right-40 top-10
      h-[420px] w-[420px]
      rounded-full
      bg-[#dff5ec]/60
      blur-[100px]
      dark:bg-[#174c3b]/20
    "
  />

  <div
    className="
      mx-auto max-w-7xl
      px-6
      py-14
      sm:py-16
      lg:px-8
      lg:py-16
    "
  >

    <div
      className="
        relative grid
        items-center
        gap-10
        lg:grid-cols-[0.78fr_1.22fr]
        lg:gap-12
      "
    >

      {/* ===================================================== */}
      {/* LEFT - TEXT */}
      {/* ===================================================== */}

      <div className="relative max-w-xl">

        {/* EYEBROW */}
        <div
          className="
            inline-flex
            items-center
            gap-2
            rounded-full
            border border-[#d7ebe3]
            bg-[#f2faf6]
            px-3 py-1.5
            text-[11px]
            font-semibold
            uppercase
            tracking-[0.16em]
            text-[#3f967c]
            dark:border-[#29483d]
            dark:bg-[#12251f]
            dark:text-[#79c2a9]
          "
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#55b995]" />

          {t("storeAudit.eyebrow")}
        </div>


        {/* TITLE */}
        <h2
          className="
            mt-5
            text-[38px]
            font-semibold
            leading-[1.04]
            tracking-[-0.035em]
            text-[#102d25]
            dark:text-[#f1f7f4]
            sm:text-[44px]
            lg:text-[48px]
            xl:text-[52px]
          "
        >
          {t("storeAudit.title")}
        </h2>


        {/* DESCRIPTION */}
        <p
          className="
            mt-5
            max-w-lg
            text-[16px]
            leading-7
            text-[#687873]
            dark:text-[#9fb4ab]
          "
        >
          {t("storeAudit.description")}
        </p>


        {/* FEATURE LIST */}
        <div className="mt-6 space-y-3">

          {/* FEATURE 1 */}
          <div className="flex items-center gap-3">

            <span
              className="
                flex h-8 w-8 shrink-0
                items-center justify-center
                rounded-lg
                bg-[#e5f5ee]
                text-xs
                text-[#319475]
                dark:bg-[#193b30]
                dark:text-[#79c2a9]
              "
            >
              ↗
            </span>

            <span
              className="
                text-[13px]
                font-medium
                text-[#30443d]
                dark:text-[#c4d5ce]
              "
            >
              {t("storeAudit.featureHealth")}
            </span>

          </div>


          {/* FEATURE 2 */}
          <div className="flex items-center gap-3">

            <span
              className="
                flex h-8 w-8 shrink-0
                items-center justify-center
                rounded-lg
                bg-[#e5f5ee]
                text-xs
                text-[#319475]
                dark:bg-[#193b30]
                dark:text-[#79c2a9]
              "
            >
              ⌕
            </span>

            <span
              className="
                text-[13px]
                font-medium
                text-[#30443d]
                dark:text-[#c4d5ce]
              "
            >
              {t("storeAudit.featureAnalysis")}
            </span>

          </div>


          {/* FEATURE 3 */}
          <div className="flex items-center gap-3">

            <span
              className="
                flex h-8 w-8 shrink-0
                items-center justify-center
                rounded-lg
                bg-[#e5f5ee]
                text-xs
                text-[#319475]
                dark:bg-[#193b30]
                dark:text-[#79c2a9]
              "
            >
              ✦
            </span>

            <span
              className="
                text-[13px]
                font-medium
                text-[#30443d]
                dark:text-[#c4d5ce]
              "
            >
              {t("storeAudit.featureActions")}
            </span>

          </div>


          {/* FEATURE 4 */}
          <div className="flex items-center gap-3">

            <span
              className="
                flex h-8 w-8 shrink-0
                items-center justify-center
                rounded-lg
                bg-[#e5f5ee]
                text-xs
                text-[#319475]
                dark:bg-[#193b30]
                dark:text-[#79c2a9]
              "
            >
              ↑
            </span>

            <span
              className="
                text-[13px]
                font-medium
                text-[#30443d]
                dark:text-[#c4d5ce]
              "
            >
              {t("storeAudit.featureGrowth")}
            </span>

          </div>

        </div>


        {/* CTA */}
        <div className="mt-7 flex flex-wrap items-center gap-4">

          <Link
            href={`/${locale}/register`}
            className="
              inline-flex
              items-center
              rounded-full
              bg-[#143d32]
              px-5 py-3
              text-sm
              font-semibold
              text-white
              shadow-[0_12px_28px_rgba(20,61,50,0.16)]
              transition
              hover:-translate-y-0.5
              hover:bg-[#1c5143]
              dark:bg-[#1d5a49]
              dark:hover:bg-[#26725c]
            "
          >
            {t("storeAudit.viewAudit")} →
          </Link>

          <span
            className="
              text-[11px]
              text-[#82908a]
              dark:text-[#758d83]
            "
          >
            {t("storeAudit.freeStart")}
          </span>

        </div>

      </div>


      {/* ===================================================== */}
      {/* RIGHT - AUDIT DASHBOARD */}
      {/* ===================================================== */}

      <div className="relative min-w-0">

        {/* GLOW */}
        <div
          className="
            pointer-events-none
            absolute
            -inset-8
            rounded-[45px]
            bg-[#ccefe0]/60
            blur-[65px]
            dark:bg-[#174c3b]/20
          "
        />


        {/* DASHBOARD */}
        <div
          className="
            relative
            overflow-hidden
            rounded-[28px]
            border border-[#d8e8e1]
            bg-[#f5faf7]
            p-4
            shadow-[0_25px_70px_rgba(20,61,50,0.12)]
            dark:border-[#29483d]
            dark:bg-[#10231d]
            dark:shadow-[0_25px_70px_rgba(0,0,0,0.38)]
            sm:p-5
            lg:p-6
          "
        >

          {/* CARD GLOW */}
          <div
            className="
              pointer-events-none
              absolute
              -right-20
              -top-20
              h-60
              w-60
              rounded-full
              bg-[#d7f2e6]
              blur-[70px]
              dark:bg-[#174c3b]/25
            "
          />


          {/* DASHBOARD TOP */}
          <div className="relative flex items-start justify-between">

            <div>

              <p
                className="
                  text-[10px]
                  font-medium
                  uppercase
                  tracking-[0.12em]
                  text-[#8b9993]
                  dark:text-[#71877e]
                "
              >
                {t("storeAudit.health")}
              </p>

              <div className="mt-1 flex items-end gap-2">

                <span
                  className="
                    text-[42px]
                    font-semibold
                    leading-none
                    tracking-tight
                    text-[#143d32]
                    dark:text-[#79c2a9]
                  "
                >
                  {t("storeAudit.score")}
                </span>

                <span
                  className="
                    mb-1
                    text-xs
                    text-[#84918c]
                    dark:text-[#71877e]
                  "
                >
                  {t("storeAudit.outOf")}
                </span>

              </div>

              <div className="mt-1.5 flex items-center gap-1.5">

                <span className="h-1.5 w-1.5 rounded-full bg-[#55b995]" />

                <span
                  className="
                    text-[10px]
                    font-medium
                    text-[#4c8976]
                    dark:text-[#79c2a9]
                  "
                >
                  {t("storeAudit.status")}
                </span>

              </div>

            </div>


            {/* SCORE */}
            <div
              className="
                flex h-[64px] w-[64px]
                items-center justify-center
                rounded-full
                border-[5px]
                border-[#9fd7c3]
                bg-white
                text-base
                font-bold
                text-[#34745f]
                shadow-sm
                dark:border-[#4d947c]
                dark:bg-[#172a24]
                dark:text-[#79c2a9]
              "
            >
              82
            </div>

          </div>


          {/* METRICS */}
          <div
            className="
              relative
              mt-5
              grid
              grid-cols-2
              gap-2.5
              lg:grid-cols-4
            "
          >

            {/* SEO */}
            <div
              className="
                rounded-xl
                border border-[#edf2ef]
                bg-white
                p-3
                dark:border-[#29483d]
                dark:bg-[#172a24]
              "
            >

              <div className="flex items-center justify-between">

                <p className="text-[10px] text-[#87958f] dark:text-[#71877e]">
                  {t("storeAudit.seo")}
                </p>

                <span
                  className="
                    flex h-6 w-6
                    items-center justify-center
                    rounded-md
                    bg-[#e7f7ef]
                    text-[10px]
                    text-[#369675]
                    dark:bg-[#193b30]
                    dark:text-[#79c2a9]
                  "
                >
                  ⌕
                </span>

              </div>

              <p className="mt-2 text-xl font-semibold text-[#142d26] dark:text-[#f1f7f4]">
                91
              </p>

              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e5ece8] dark:bg-[#29433a]">
                <div className="h-full w-[91%] rounded-full bg-[#55b995]" />
              </div>

              <p className="mt-1 text-[9px] font-medium text-[#48a383]">
                {t("storeAudit.veryGood")}
              </p>

            </div>


            {/* LISTINGS */}
            <div
              className="
                rounded-xl
                border border-[#edf2ef]
                bg-white
                p-3
                dark:border-[#29483d]
                dark:bg-[#172a24]
              "
            >

              <div className="flex items-center justify-between">

                <p className="text-[10px] text-[#87958f] dark:text-[#71877e]">
                  {t("storeAudit.listings")}
                </p>

                <span
                  className="
                    flex h-6 w-6
                    items-center justify-center
                    rounded-md
                    bg-[#eeeafa]
                    text-[10px]
                    text-[#7569b5]
                    dark:bg-[#2b2844]
                    dark:text-[#aaa0e8]
                  "
                >
                  ◆
                </span>

              </div>

              <p className="mt-2 text-xl font-semibold text-[#142d26] dark:text-[#f1f7f4]">
                76
              </p>

              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e5ece8] dark:bg-[#29433a]">
                <div className="h-full w-[76%] rounded-full bg-[#79b89f]" />
              </div>

              <p className="mt-1 text-[9px] font-medium text-[#6aa98e]">
                {t("storeAudit.good")}
              </p>

            </div>


            {/* KEYWORDS */}
            <div
              className="
                rounded-xl
                border border-[#edf2ef]
                bg-white
                p-3
                dark:border-[#29483d]
                dark:bg-[#172a24]
              "
            >

              <div className="flex items-center justify-between">

                <p className="text-[10px] text-[#87958f] dark:text-[#71877e]">
                  {t("storeAudit.keywords")}
                </p>

                <span
                  className="
                    flex h-6 w-6
                    items-center justify-center
                    rounded-md
                    bg-[#e8f4ff]
                    text-[10px]
                    text-[#5284b8]
                    dark:bg-[#1d3445]
                    dark:text-[#86b8e5]
                  "
                >
                  ↗
                </span>

              </div>

              <p className="mt-2 text-xl font-semibold text-[#142d26] dark:text-[#f1f7f4]">
                84
              </p>

              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e5ece8] dark:bg-[#29433a]">
                <div className="h-full w-[84%] rounded-full bg-[#55a98d]" />
              </div>

              <p className="mt-1 text-[9px] font-medium text-[#48a383]">
                İyi
              </p>

            </div>


            {/* CONVERSION */}
            <div
              className="
                rounded-xl
                border border-[#edf2ef]
                bg-white
                p-3
                dark:border-[#29483d]
                dark:bg-[#172a24]
              "
            >

              <div className="flex items-center justify-between">

                <p className="text-[10px] text-[#87958f] dark:text-[#71877e]">
                  {t("storeAudit.conversion")}
                </p>

                <span
                  className="
                    flex h-6 w-6
                    items-center justify-center
                    rounded-md
                    bg-[#fff5df]
                    text-[10px]
                    text-[#b08a35]
                    dark:bg-[#3c331f]
                    dark:text-[#e0c46c]
                  "
                >
                  ↗
                </span>

              </div>

              <p className="mt-2 text-xl font-semibold text-[#142d26] dark:text-[#f1f7f4]">
                68
              </p>

              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e5ece8] dark:bg-[#29433a]">
                <div className="h-full w-[68%] rounded-full bg-[#d0b879]" />
              </div>

              <p className="mt-1 text-[9px] font-medium text-[#ad8836]">
                {t("storeAudit.improvable")}
              </p>

            </div>

          </div>


          {/* OPPORTUNITIES */}
          <div
            className="
              relative
              mt-3
              rounded-xl
              border border-[#e1ebe6]
              bg-white
              p-4
              dark:border-[#29483d]
              dark:bg-[#172a24]
            "
          >

            {/* HEADER */}
            <div className="flex items-center justify-between">

              <div>

                <div className="flex items-center gap-2">

                  <p
                    className="
                      text-sm
                      font-semibold
                      text-[#172d26]
                      dark:text-[#f1f7f4]
                    "
                  >
                    {t("storeAudit.opportunities")}
                  </p>

                  <span className="h-1.5 w-1.5 rounded-full bg-[#55b995]" />

                </div>

                <p
                  className="
                    mt-0.5
                    text-[10px]
                    text-[#929d99]
                    dark:text-[#71877e]
                  "
                >
                  {t("storeAudit.highPriority")}
                </p>

              </div>

              <div
                className="
                  rounded-full
                  bg-[#edf7f3]
                  px-2.5 py-1
                  text-[10px]
                  font-semibold
                  text-[#34745f]
                  dark:bg-[#193b30]
                  dark:text-[#79c2a9]
                "
              >
                AI
              </div>

            </div>


            {/* OPPORTUNITIES */}
            <div className="mt-3 grid gap-2 sm:grid-cols-2">

              {/* SEO */}
              <div
                className="
                  flex items-center gap-2.5
                  rounded-lg
                  border border-[#f5e4df]
                  bg-[#fff8f6]
                  p-2.5
                  dark:border-[#553029]
                  dark:bg-[#30201d]
                "
              >

                <span
                  className="
                    flex h-7 w-7 shrink-0
                    items-center justify-center
                    rounded-full
                    bg-[#ffe4de]
                    text-[10px]
                    font-semibold
                    text-[#c55b47]
                    dark:bg-[#553029]
                    dark:text-[#f08a74]
                  "
                >
                  !
                </span>

                <div className="min-w-0">

                  <p className="truncate text-xs font-semibold text-[#26332f] dark:text-[#f0e2de]">
                    {t("storeAudit.seoProblems")}
                  </p>

                  <p className="mt-0.5 truncate text-[9px] text-[#8b9691] dark:text-[#a88f88]">
                    {t("storeAudit.seoProblemsDetail")}
                  </p>

                </div>

              </div>


              {/* WEAK LISTINGS */}
              <div
                className="
                  flex items-center gap-2.5
                  rounded-lg
                  border border-[#f1e7c9]
                  bg-[#fffaf0]
                  p-2.5
                  dark:border-[#55491f]
                  dark:bg-[#302a1b]
                "
              >

                <span
                  className="
                    flex h-7 w-7 shrink-0
                    items-center justify-center
                    rounded-full
                    bg-[#f7e9bd]
                    text-[10px]
                    font-semibold
                    text-[#a7832e]
                    dark:bg-[#55491f]
                    dark:text-[#e1c56d]
                  "
                >
                  !
                </span>

                <div className="min-w-0">

                  <p className="truncate text-xs font-semibold text-[#26332f] dark:text-[#f0e5c9]">
                    {t("storeAudit.weakListings")}
                  </p>

                  <p className="mt-0.5 truncate text-[9px] text-[#8b9691] dark:text-[#a99f7c]">
                    {t("storeAudit.weakListingsDetail")}
                  </p>

                </div>

              </div>


              {/* PRICING */}
              <div
                className="
                  flex items-center gap-2.5
                  rounded-lg
                  border border-[#f1e7c9]
                  bg-[#fffaf0]
                  p-2.5
                  dark:border-[#55491f]
                  dark:bg-[#302a1b]
                "
              >

                <span
                  className="
                    flex h-7 w-7 shrink-0
                    items-center justify-center
                    rounded-full
                    bg-[#f7e9bd]
                    text-[10px]
                    font-semibold
                    text-[#a7832e]
                    dark:bg-[#55491f]
                    dark:text-[#e1c56d]
                  "
                >
                  !
                </span>

                <div className="min-w-0">

                  <p className="truncate text-xs font-semibold text-[#26332f] dark:text-[#f0e5c9]">
                    {t("storeAudit.pricingIssue")}
                  </p>

                  <p className="mt-0.5 truncate text-[9px] text-[#8b9691] dark:text-[#a99f7c]">
                    {t("storeAudit.pricingIssueDetail")}
                  </p>

                </div>

              </div>


              {/* KEYWORD */}
              <div
                className="
                  flex items-center gap-2.5
                  rounded-lg
                  border border-[#dceee6]
                  bg-[#f3faf7]
                  p-2.5
                  dark:border-[#285443]
                  dark:bg-[#19332a]
                "
              >

                <span
                  className="
                    flex h-7 w-7 shrink-0
                    items-center justify-center
                    rounded-full
                    bg-[#dcefe7]
                    text-[10px]
                    font-semibold
                    text-[#34745f]
                    dark:bg-[#285443]
                    dark:text-[#79c2a9]
                  "
                >
                  ↑
                </span>

                <div className="min-w-0">

                  <p className="truncate text-xs font-semibold text-[#26332f] dark:text-[#d9ebe3]">
                    {t("storeAudit.keywordGap")}
                  </p>

                  <p className="mt-0.5 truncate text-[9px] text-[#7e938a] dark:text-[#91b0a3]">
                    {t("storeAudit.keywordGapDetail")}
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>


        {/* FLOATING BADGE */}
        <div
          className="
            absolute
            -bottom-4
            left-5
            flex
            items-center
            gap-2
            rounded-full
            border border-[#d6e9e1]
            bg-white
            px-3.5 py-2
            text-xs
            font-semibold
            text-[#173c31]
            shadow-[0_12px_28px_rgba(20,61,50,0.12)]
            dark:border-[#31564a]
            dark:bg-[#12251f]
            dark:text-[#dcece6]
          "
        >

          <span
            className="
              flex h-5 w-5
              items-center
              justify-center
              rounded-full
              bg-[#dff2ea]
              text-[10px]
              text-[#23745d]
              dark:bg-[#193b30]
              dark:text-[#79c2a9]
            "
          >
            ✦
          </span>

          AI destekli mağaza analizi

        </div>

      </div>

    </div>

  </div>
</section>
     {/* AI GROWTH COACH */}
<section className="relative overflow-hidden bg-[#f1f8f5] dark:bg-[#0d1b16]">

  {/* BACKGROUND GLOW */}
  <div
    className="
      pointer-events-none absolute
      -left-40 top-1/2
      h-[500px] w-[500px]
      -translate-y-1/2
      rounded-full
      bg-[#d9f1e8]/70
      blur-3xl
      dark:bg-[#174c3b]/30
    "
  />

  <div
    className="
      pointer-events-none absolute
      -right-40 top-20
      h-[420px] w-[420px]
      rounded-full
      bg-[#cfeee1]/50
      blur-3xl
      dark:bg-[#174c3b]/20
    "
  />

  <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">

    <div
      className="
        relative grid
        gap-12
        lg:grid-cols-[0.78fr_1.22fr]
        lg:items-center
        lg:gap-16
      "
    >

      {/* LEFT - TEXT */}
      <div className="relative max-w-xl">

        {/* EYEBROW */}
        <p
          className="
            text-sm font-semibold
            uppercase tracking-[0.2em]
            text-[#4b9b83]
          "
        >
          {t("growthCoach.eyebrow")}
        </p>

        {/* TITLE */}
        <h2
          className="
            mt-4
            text-4xl font-semibold
            leading-[1.08]
            tracking-tight
            text-[#102d25]
            dark:text-[#f1f7f4]
            sm:text-5xl
            lg:text-[54px]
          "
        >
          {t("growthCoach.title")}
        </h2>

        {/* DESCRIPTION */}
        <p
          className="
            mt-6
            max-w-lg
            text-lg
            leading-8
            text-[#697671]
            dark:text-[#9fb4ab]
          "
        >
          {t("growthCoach.description")}
        </p>

        {/* TRUST / DATA POINT */}
        <div
          className="
            mt-7
            flex items-center gap-3
            text-sm
            text-[#667873]
            dark:text-[#91a79e]
          "
        >
          <span
            className="
              flex h-9 w-9 shrink-0
              items-center justify-center
              rounded-xl
              bg-[#dff2ea]
              text-[#34745f]
              shadow-sm
              dark:bg-[#193b30]
              dark:text-[#79c2a9]
            "
          >
            ✦
          </span>

          <span>
            {t("growthCoach.estimated")}
          </span>
        </div>

      </div>


      {/* RIGHT - COACH CARD */}
      <div
        className="
          relative overflow-hidden
          rounded-[30px]
          border border-[#d5e5df]
          bg-white
          p-5
          shadow-[0_30px_90px_rgba(20,61,50,0.13)]
          dark:border-[#29483d]
          dark:bg-[#12231e]
          dark:shadow-[0_30px_90px_rgba(0,0,0,0.4)]
          sm:p-6
          lg:p-7
        "
      >

        {/* CARD GLOW */}
        <div
          className="
            pointer-events-none absolute
            -right-24 -top-24
            h-72 w-72
            rounded-full
            bg-[#d9f1e8]/80
            blur-3xl
            dark:bg-[#174c3b]/30
          "
        />


        {/* HEADER */}
        <div className="relative flex items-start justify-between gap-4">

          <div>

            <p
              className="
                text-xs uppercase
                tracking-[0.14em]
                text-[#929d99]
                dark:text-[#71877e]
              "
            >
              {t("growthCoach.today")}
            </p>

            <h3
              className="
                mt-2
                text-2xl
                font-semibold
                tracking-tight
                text-[#14201c]
                dark:text-[#f1f7f4]
                sm:text-[26px]
              "
            >
              {t("growthCoach.question")}
            </h3>

          </div>

          <div
            className="
              flex h-11 w-11 shrink-0
              items-center justify-center
              rounded-xl
              bg-[#e7f3ee]
              text-[#34745f]
              dark:bg-[#193b30]
              dark:text-[#79c2a9]
            "
          >
            ✦
          </div>

        </div>


        {/* ANALYZED */}
        <p
          className="
            relative mt-4
            max-w-xl
            text-sm
            leading-6
            text-[#77837f]
            dark:text-[#91a79e]
          "
        >
          {t("growthCoach.analyzed")}
        </p>


        {/* ACTION HEADER */}
        <div
          className="
            relative mt-6
            mb-3
            flex items-center
            justify-between gap-3
          "
        >

          <p
            className="
              text-xs font-semibold
              uppercase
              tracking-[0.14em]
              text-[#8a9892]
              dark:text-[#71877e]
            "
          >
            {t("growthCoach.recommendedActions")}
          </p>

          <span
            className="
              rounded-full
              bg-[#e8f4ef]
              px-3 py-1.5
              text-[10px]
              font-semibold
              text-[#34745f]
              dark:bg-[#193b30]
              dark:text-[#79c2a9]
            "
          >
            {t("growthCoach.opportunities")}
          </span>

        </div>


        {/* ACTIONS */}
        <div className="relative space-y-3">

          {/* 01 */}
          <div
            className="
              rounded-2xl
              border border-[#dce8e3]
              bg-[#f9fbfa]
              p-4
              transition
              hover:-translate-y-0.5
              hover:shadow-sm
              dark:border-[#29483d]
              dark:bg-[#172a24]
            "
          >
            <div className="flex items-center gap-4">

              <div
                className="
                  flex h-10 w-10 shrink-0
                  items-center justify-center
                  rounded-xl
                  bg-[#143d32]
                  text-xs font-bold
                  text-white
                  dark:bg-[#1d5a49]
                "
              >
                01
              </div>

              <div className="min-w-0 flex-1">

                <p
                  className="
                    font-semibold
                    text-[#14201c]
                    dark:text-[#f1f7f4]
                  "
                >
                  {t("growthCoach.step1")}
                </p>

                <span
                  className="
                    mt-2 inline-flex
                    rounded-full
                    bg-[#eaf5f0]
                    px-2.5 py-1
                    text-[11px]
                    font-semibold
                    text-[#34745f]
                    dark:bg-[#193b30]
                    dark:text-[#79c2a9]
                  "
                >
                  {t("growthCoach.highImpact")}
                </span>

              </div>

            </div>
          </div>


          {/* 02 */}
          <div
            className="
              rounded-2xl
              border border-[#e7ecea]
              bg-[#f9fbfa]
              p-4
              transition
              hover:-translate-y-0.5
              hover:shadow-sm
              dark:border-[#29483d]
              dark:bg-[#172a24]
            "
          >
            <div className="flex items-center gap-4">

              <div
                className="
                  flex h-10 w-10 shrink-0
                  items-center justify-center
                  rounded-xl
                  bg-[#edf3f0]
                  text-xs font-bold
                  text-[#527168]
                  dark:bg-[#29443b]
                  dark:text-[#a6bbb3]
                "
              >
                02
              </div>

              <div className="min-w-0 flex-1">

                <p
                  className="
                    font-semibold
                    text-[#14201c]
                    dark:text-[#f1f7f4]
                  "
                >
                  {t("growthCoach.step2")}
                </p>

                <span
                  className="
                    mt-2 inline-flex
                    rounded-full
                    bg-[#f4f0df]
                    px-2.5 py-1
                    text-[11px]
                    font-semibold
                    text-[#94772d]
                    dark:bg-[#40381f]
                    dark:text-[#d8bf68]
                  "
                >
                  {t("growthCoach.mediumImpact")}
                </span>

              </div>

            </div>
          </div>


          {/* 03 */}
          <div
            className="
              rounded-2xl
              border border-[#e7ecea]
              bg-[#f9fbfa]
              p-4
              transition
              hover:-translate-y-0.5
              hover:shadow-sm
              dark:border-[#29483d]
              dark:bg-[#172a24]
            "
          >
            <div className="flex items-center gap-4">

              <div
                className="
                  flex h-10 w-10 shrink-0
                  items-center justify-center
                  rounded-xl
                  bg-[#edf3f0]
                  text-xs font-bold
                  text-[#527168]
                  dark:bg-[#29443b]
                  dark:text-[#a6bbb3]
                "
              >
                03
              </div>

              <div className="min-w-0 flex-1">

                <p
                  className="
                    font-semibold
                    text-[#14201c]
                    dark:text-[#f1f7f4]
                  "
                >
                  {t("growthCoach.step3")}
                </p>

                <span
                  className="
                    mt-2 inline-flex
                    rounded-full
                    bg-[#f4f0df]
                    px-2.5 py-1
                    text-[11px]
                    font-semibold
                    text-[#94772d]
                    dark:bg-[#40381f]
                    dark:text-[#d8bf68]
                  "
                >
                  {t("growthCoach.mediumImpact")}
                </span>

              </div>

            </div>
          </div>


          {/* 04 */}
          <div
            className="
              rounded-2xl
              border border-[#e7ecea]
              bg-[#f9fbfa]
              p-4
              transition
              hover:-translate-y-0.5
              hover:shadow-sm
              dark:border-[#29483d]
              dark:bg-[#172a24]
            "
          >
            <div className="flex items-center gap-4">

              <div
                className="
                  flex h-10 w-10 shrink-0
                  items-center justify-center
                  rounded-xl
                  bg-[#edf3f0]
                  text-xs font-bold
                  text-[#527168]
                  dark:bg-[#29443b]
                  dark:text-[#a6bbb3]
                "
              >
                04
              </div>

              <div className="min-w-0 flex-1">

                <p
                  className="
                    font-semibold
                    text-[#14201c]
                    dark:text-[#f1f7f4]
                  "
                >
                  {t("growthCoach.step4")}
                </p>

                <span
                  className="
                    mt-2 inline-flex
                    rounded-full
                    bg-[#f5f5f3]
                    px-2.5 py-1
                    text-[11px]
                    font-semibold
                    text-[#7c827f]
                    dark:bg-[#29332f]
                    dark:text-[#9eaaa5]
                  "
                >
                  {t("growthCoach.lowImpact")}
                </span>

              </div>

            </div>
          </div>

        </div>


        {/* CTA */}
        <Link
          href={`/${locale}/register`}
          className="
            relative mt-5
            block w-full
            rounded-full
            bg-[#143d32]
            px-6 py-3.5
            text-center
            text-sm font-semibold
            text-white
            shadow-[0_12px_30px_rgba(20,61,50,0.15)]
            transition
            hover:-translate-y-0.5
            hover:bg-[#1c5143]
            dark:bg-[#1d5a49]
            dark:hover:bg-[#26725c]
          "
        >
          {t("growthCoach.startAction")} →
        </Link>

      </div>

    </div>

  </div>
</section>
      {/* COMPETITOR INTELLIGENCE */}
      <section className="relative overflow-hidden bg-[#f4faf7] dark:bg-[#0d1b16]">

        {/* BACKGROUND GLOW */}
        <div className="pointer-events-none absolute -left-40 top-20 h-[420px] w-[420px] rounded-full bg-[#dff3ea]/70 blur-3xl dark:bg-[#174c3b]/30" />

        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">

          <div className="relative grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">

            {/* LEFT */}
            <div>

              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4b9b83]">
                {t("competitor.eyebrow")}
              </p>

              <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-tight tracking-tight dark:text-[#f1f7f4] sm:text-5xl">
                {t("competitor.title")}
              </h2>

              <p className="mt-5 max-w-lg text-lg leading-8 text-[#697671] dark:text-[#9fb4ab]">
                {t("competitor.description")}
              </p>

              <Link
  href={`/${locale}/register`}
  className="mt-8 inline-flex rounded-full bg-[#143d32] px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#1c5143]"
>
  {t("competitor.analyze")} →
</Link>

            </div>


            {/* COMPETITOR CARD */}
            <div className="relative overflow-hidden rounded-[26px] border border-[#d5e5df] bg-[#f7faf8] p-4.5 shadow-[0_25px_70px_rgba(20,61,50,0.12)] dark:border-[#29483d] dark:bg-[#12231e] dark:shadow-[0_25px_70px_rgba(0,0,0,0.35)] sm:p-6">

              {/* CARD GLOW */}
              <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#cfeee1]/70 blur-3xl dark:bg-[#174c3b]/30" />


              {/* YOUR LISTING */}
              <div className="relative rounded-2xl border border-[#dce8e3] bg-white p-4 dark:border-[#29483d] dark:bg-[#172a24]">

                <div className="flex items-start justify-between gap-4">

                  <div>

                    <p className="text-xs uppercase tracking-wider text-[#929d99] dark:text-[#71877e]">
                      {t("competitor.yourListing")}
                    </p>

                    <h3 className="mt-2 text-lg font-semibold dark:text-[#f1f7f4]">
                      Personalized Birthstone Necklace
                    </h3>

                  </div>

                  <div className="rounded-full bg-[#e7f3ee] px-3 py-1.5 text-xs font-semibold text-[#34745f] dark:bg-[#193b30] dark:text-[#79c2a9]">
                    {t("competitor.price")}
                  </div>

                </div>

                <p className="mt-3 text-sm text-[#7a8782] dark:text-[#91a79e]">
                  {t("competitor.reviews")}
                </p>


                {/* YOUR METRICS */}
                <div className="mt-5 grid grid-cols-2 gap-3">

                  <div className="rounded-xl bg-[#f7f9f8] p-3 dark:bg-[#1c3029]">

                    <p className="text-[11px] text-[#929d99] dark:text-[#71877e]">
                      {t("competitor.keywordCoverage")}
                    </p>

                    <p className="mt-1 text-sm font-semibold text-[#34745f] dark:text-[#79c2a9]">
                      78%
                    </p>

                  </div>


                  <div className="rounded-xl bg-[#f7f9f8] p-3 dark:bg-[#1c3029]">

                    <p className="text-[11px] text-[#929d99] dark:text-[#71877e]">
                      {t("competitor.pricePosition")}
                    </p>

                    <p className="mt-1 text-sm font-semibold dark:text-[#e8f1ed]">
                      {t("competitor.competitive")}
                    </p>

                  </div>

                </div>

              </div>


              {/* COMPETITORS */}
              <div className="relative mt-5">

                <div className="flex items-center justify-between">

                  <p className="text-sm font-semibold dark:text-[#f1f7f4]">
                    {t("competitor.topCompetitors")}
                  </p>

                  <span className="text-xs text-[#929d99] dark:text-[#71877e]">
                    {t("competitor.market")}
                  </span>

                </div>


                <div className="mt-3 space-y-2">

                  {/* COMPETITOR 1 */}
                  <div className="flex items-center justify-between rounded-xl bg-white p-3.5 dark:bg-[#172a24]">

                    <div>

                      <p className="text-sm font-medium dark:text-[#e8f1ed]">
                        {t("competitor.competitor1Name")}
                      </p>

                      <p className="mt-1 text-xs text-[#929d99] dark:text-[#71877e]">
                        {t("competitor.competitor1Reviews")}
                      </p>

                    </div>

                    <span className="font-semibold dark:text-[#f1f7f4]">
                      $27
                    </span>

                  </div>


                  {/* COMPETITOR 2 */}
                  <div className="flex items-center justify-between rounded-xl bg-white p-3.5 dark:bg-[#172a24]">

                    <div>

                      <p className="text-sm font-medium dark:text-[#e8f1ed]">
                        {t("competitor.competitor2Name")}
                      </p>

                      <p className="mt-1 text-xs text-[#929d99] dark:text-[#71877e]">
                        {t("competitor.competitor2Reviews")}
                      </p>

                    </div>

                    <span className="font-semibold dark:text-[#f1f7f4]">
                      $31
                    </span>

                  </div>


                  {/* COMPETITOR 3 */}
                  <div className="flex items-center justify-between rounded-xl bg-white p-3.5 dark:bg-[#172a24]">

                    <div>

                      <p className="text-sm font-medium dark:text-[#e8f1ed]">
                        {t("competitor.competitor3Name")}
                      </p>

                      <p className="mt-1 text-xs text-[#929d99] dark:text-[#71877e]">
                        {t("competitor.competitor3Reviews")}
                      </p>

                    </div>

                    <span className="font-semibold dark:text-[#f1f7f4]">
                      $34
                    </span>

                  </div>

                </div>

              </div>


              {/* AI INSIGHT */}
              <div className="relative mt-5 overflow-hidden rounded-2xl bg-[#143d32] p-5 text-white shadow-lg shadow-[#143d32]/10">

                {/* AI GLOW */}
                <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#55a98d]/20 blur-3xl" />


                <div className="relative">

                  <div className="flex items-center gap-2">

                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-xs">
                      ✦
                    </span>

                    <p className="text-sm font-semibold">
                      {t("competitor.aiInsight")}
                    </p>

                  </div>


                  <p className="mt-3 text-sm leading-6 text-white/75">
                    {t("competitor.insight")}
                  </p>


                  <div className="mt-4 flex flex-wrap gap-2">

                    <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/80">
                      {t("competitor.pricePosition")}:{" "}
                      {t("competitor.competitive")}
                    </span>

                    <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/80">
                      {t("competitor.keywordCoverage")}:{" "}
                      {t("competitor.weaker")}
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>
      </section>
      {/* TREND RADAR */}
      <section className="relative overflow-hidden bg-[#f1f8f5] dark:bg-[#0d1b16]">

        {/* BACKGROUND GLOW */}
        <div className="pointer-events-none absolute -right-40 top-16 h-[420px] w-[420px] rounded-full bg-[#d8f1e8]/70 blur-3xl dark:bg-[#174c3b]/30" />

        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">

          <div className="relative grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">

            {/* LEFT */}
            <div>

              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4b9b83]">
                {t("trendRadar.eyebrow")}
              </p>

              <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-tight tracking-tight dark:text-[#f1f7f4] sm:text-5xl">
                {t("trendRadar.title")}
              </h2>

              <p className="mt-5 max-w-lg text-lg leading-8 text-[#697671] dark:text-[#9fb4ab]">
                {t("trendRadar.description")}
              </p>

              <Link
  href={`/${locale}/register`}
  className="mt-8 inline-flex rounded-full bg-[#143d32] px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#1c5143]"
>
  {t("trendRadar.analyze")} →
</Link>
            </div>


            {/* TREND CARD */}
            <div className="relative overflow-hidden rounded-[28px] border border-[#d5e5df] bg-white p-5 shadow-[0_30px_80px_rgba(20,61,50,0.12)] dark:border-[#29483d] dark:bg-[#12231e] dark:shadow-[0_30px_80px_rgba(0,0,0,0.35)] sm:p-7">

              {/* CARD GLOW */}
              <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#cfeee1]/70 blur-3xl dark:bg-[#174c3b]/30" />


              {/* HEADER */}
              <div className="relative flex items-center justify-between">

                <div>

                  <p className="text-xs uppercase tracking-wider text-[#929d99] dark:text-[#71877e]">
                    {t("trendRadar.trendingNow")}
                  </p>

                  <h3 className="mt-2 text-2xl font-semibold tracking-tight dark:text-[#f1f7f4]">
                    {t("trendRadar.product")}
                  </h3>

                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e7f3ee] text-[#34745f] dark:bg-[#193b30] dark:text-[#79c2a9]">
                  ↑
                </div>

              </div>


              {/* METRICS */}
              <div className="relative mt-7 grid gap-3 sm:grid-cols-3">


                {/* DEMAND */}
                <div className="rounded-2xl bg-[#f7f9f8] p-4 dark:bg-[#172a24]">

                  <p className="text-xs text-[#929d99] dark:text-[#71877e]">
                    {t("trendRadar.demand")}
                  </p>

                  <div className="mt-2 flex items-end justify-between">

                    <span className="text-2xl font-semibold dark:text-[#f1f7f4]">
                      87
                    </span>

                    <span className="text-xs font-semibold text-[#34745f] dark:text-[#79c2a9]">
                      High
                    </span>

                  </div>

                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e4ebe7] dark:bg-[#294038]">
                    <div className="h-full w-[87%] rounded-full bg-[#55a98d]" />
                  </div>

                </div>


                {/* COMPETITION */}
                <div className="rounded-2xl bg-[#f7f9f8] p-4 dark:bg-[#172a24]">

                  <p className="text-xs text-[#929d99] dark:text-[#71877e]">
                    {t("trendRadar.competition")}
                  </p>

                  <div className="mt-2 flex items-end justify-between">

                    <span className="text-2xl font-semibold dark:text-[#f1f7f4]">
                      61
                    </span>

                    <span className="text-xs font-semibold text-[#94772d] dark:text-[#d8bf68]">
                      Medium
                    </span>

                  </div>

                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e4ebe7] dark:bg-[#294038]">
                    <div className="h-full w-[61%] rounded-full bg-[#d0b879]" />
                  </div>

                </div>


                {/* TREND GROWTH */}
                <div className="rounded-2xl bg-[#f7f9f8] p-4 dark:bg-[#172a24]">

                  <p className="text-xs text-[#929d99] dark:text-[#71877e]">
                    {t("trendRadar.trendGrowth")}
                  </p>

                  <div className="mt-2 flex items-end justify-between">

                    <span className="text-2xl font-semibold dark:text-[#f1f7f4]">
                      +24%
                    </span>

                    <span className="text-xs font-semibold text-[#34745f] dark:text-[#79c2a9]">
                      ↑
                    </span>

                  </div>

                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e4ebe7] dark:bg-[#294038]">
                    <div className="h-full w-[78%] rounded-full bg-[#55a98d]" />
                  </div>

                </div>

              </div>


              {/* OPPORTUNITY SCORE */}
              <div className="relative mt-5 overflow-hidden rounded-3xl bg-[#143d32] p-6 text-white shadow-lg shadow-[#143d32]/10">

                {/* AI GLOW */}
                <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#55a98d]/20 blur-3xl" />

                <div className="relative">

                  {/* SCORE HEADER */}
                  <div className="flex items-start justify-between gap-5">

                    <div>

                      <p className="text-xs uppercase tracking-wider text-white/50">
                        {t("trendRadar.opportunity")}
                      </p>

                      <div className="mt-2 flex items-end gap-2">

                        <span className="text-5xl font-semibold tracking-tight">
                          {t("trendRadar.score")}
                        </span>

                        <span className="mb-2 text-sm text-white/50">
                          /100
                        </span>

                      </div>

                    </div>

                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-[5px] border-[#76c0a7] bg-white/5 text-sm font-bold">
                      91
                    </div>

                  </div>


                  {/* REASONS */}
                  <div className="mt-7">

                    <p className="text-sm font-semibold">
                      {t("trendRadar.why")}
                    </p>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">

                      <div className="rounded-xl bg-white/[0.07] p-3 text-sm text-white/80">
                        ✓ {t("trendRadar.reason1")}
                      </div>

                      <div className="rounded-xl bg-white/[0.07] p-3 text-sm text-white/80">
                        ✓ {t("trendRadar.reason2")}
                      </div>

                      <div className="rounded-xl bg-white/[0.07] p-3 text-sm text-white/80">
                        ✓ {t("trendRadar.reason3")}
                      </div>

                      <div className="rounded-xl bg-white/[0.07] p-3 text-sm text-white/80">
                        ✓ {t("trendRadar.reason4")}
                      </div>

                    </div>

                  </div>


                  <Link
  href={`/${locale}/register`}
  className="mt-6 block w-full rounded-full bg-white px-6 py-3.5 text-center text-sm font-semibold text-[#143d32] transition hover:-translate-y-0.5 hover:bg-[#eef5f2]"
>
  {t("trendRadar.analyze")} →
</Link>

                </div>

              </div>

            </div>

          </div>

        </div>
      </section>
     {/* AI VISUAL OPTIMIZER */}
<section className="relative overflow-hidden bg-white dark:bg-[#0d1b16]">

  {/* BACKGROUND GLOW */}
  <div className="pointer-events-none absolute -right-40 top-1/4 h-[500px] w-[500px] rounded-full bg-[#dff3ea]/60 blur-3xl dark:bg-[#174c3b]/25" />

  <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">

    <div className="grid items-center gap-14 lg:grid-cols-[0.82fr_1.18fr]">

      {/* LEFT CONTENT */}
      <div>
<div className="pointer-events-none absolute -left-20 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-[#38d39f]/[0.07] blur-[100px]" />
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#4b9b83]">
          {t("visualOptimizer.eyebrow")}
        </p>

        <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-[1.08] tracking-tight text-[#10231d] dark:text-[#f1f7f4] sm:text-5xl">
          {t("visualOptimizer.title")}
        </h2>

        <p className="mt-6 max-w-lg text-lg leading-8 text-[#697671] dark:text-[#9fb4ab]">
          {t("visualOptimizer.description")}
        </p>

        <Link
          href={`/${locale}/register`}
          className="mt-8 inline-flex items-center rounded-full bg-[#143d32] px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#1c5143]"
        >
          {t("visualOptimizer.analyzeImage")} →
        </Link>

      </div>


      {/* VISUAL DEMO */}
      <VisualBeforeAfter />

    </div>

  </div>
</section>
    {/* ===================================================== */}
{/* FEATURES */}
{/* ===================================================== */}

<section
  id="features"
  className="relative overflow-hidden bg-white dark:bg-[#0b1713]"
>
  {/* BACKGROUND GLOW */}
  <div
    className="
      pointer-events-none
      absolute
      -left-40
      top-10
      h-[380px]
      w-[380px]
      rounded-full
      bg-[#e4f5ee]/60
      blur-3xl
      dark:bg-[#174c3b]/20
    "
  />

  <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8">

    {/* ================================================= */}
    {/* HEADER */}
    {/* ================================================= */}

    <div className="mx-auto max-w-2xl text-center">

      <p
        className="
          text-xs
          font-semibold
          uppercase
          tracking-[0.2em]
          text-[#4b9b83]
        "
      >
        {t("features.eyebrow")}
      </p>

      <h2
        className="
          mt-3
          text-3xl
          font-semibold
          leading-tight
          tracking-tight
          text-[#14231e]
          dark:text-[#f1f7f4]
          sm:text-4xl
        "
      >
        {t("features.title")}
      </h2>

      <p
        className="
          mx-auto
          mt-4
          max-w-xl
          text-base
          leading-7
          text-[#697671]
          dark:text-[#9fb4ab]
        "
      >
        {t("features.description")}
      </p>

    </div>


    {/* ================================================= */}
    {/* FEATURE GRID */}
    {/* ================================================= */}

    <div className="relative mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-2">


      {/* ================================================= */}
      {/* STORE INTELLIGENCE */}
      {/* ================================================= */}

      <div
        className="
          group
          relative
          overflow-hidden
          rounded-2xl
          border
          border-[#dce8e3]
          bg-[#f7faf8]
          p-6
          shadow-[0_12px_35px_rgba(20,61,50,0.05)]
          transition-all
          duration-300
          hover:-translate-y-1
          hover:shadow-[0_20px_45px_rgba(20,61,50,0.09)]
          dark:border-[#29483d]
          dark:bg-[#14261f]
          dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.25)]
        "
      >

        {/* ICON */}
        <div
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            bg-[#e4f2ec]
            text-sm
            font-medium
            text-[#34745f]
            dark:bg-[#21483b]
            dark:text-[#79c2a9]
          "
        >
          ◉
        </div>

        <h3
          className="
            mt-5
            text-lg
            font-semibold
            tracking-tight
            text-[#14231e]
            dark:text-[#f1f7f4]
          "
        >
          {t("features.storeTitle")}
        </h3>

        <p
          className="
            mt-2
            max-w-md
            text-sm
            leading-6
            text-[#697671]
            dark:text-[#9fb4ab]
          "
        >
          {t("features.storeDescription")}
        </p>

        {/* FEATURES */}
        <div className="mt-5 space-y-2">

          <div
            className="
              rounded-xl
              border
              border-[#edf1ef]
              bg-white
              px-3.5
              py-2.5
              text-sm
              text-[#253630]
              dark:border-[#29483d]
              dark:bg-[#1b3028]
              dark:text-[#d5e3de]
            "
          >
            ✓ {t("features.audit")}
          </div>

          <div
            className="
              rounded-xl
              border
              border-[#edf1ef]
              bg-white
              px-3.5
              py-2.5
              text-sm
              text-[#253630]
              dark:border-[#29483d]
              dark:bg-[#1b3028]
              dark:text-[#d5e3de]
            "
          >
            ✓ {t("features.health")}
          </div>

          <div
            className="
              rounded-xl
              border
              border-[#edf1ef]
              bg-white
              px-3.5
              py-2.5
              text-sm
              text-[#253630]
              dark:border-[#29483d]
              dark:bg-[#1b3028]
              dark:text-[#d5e3de]
            "
          >
            ✓ {t("features.performance")}
          </div>

        </div>

      </div>


      {/* ================================================= */}
      {/* SEO & LISTING */}
      {/* ================================================= */}

      <div
        className="
          group
          relative
          overflow-hidden
          rounded-2xl
          border
          border-[#dce8e3]
          bg-[#f7faf8]
          p-6
          shadow-[0_12px_35px_rgba(20,61,50,0.05)]
          transition-all
          duration-300
          hover:-translate-y-1
          hover:shadow-[0_20px_45px_rgba(20,61,50,0.09)]
          dark:border-[#29483d]
          dark:bg-[#14261f]
          dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.25)]
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
            bg-[#e4f2ec]
            text-sm
            font-medium
            text-[#34745f]
            dark:bg-[#21483b]
            dark:text-[#79c2a9]
          "
        >
          Aa
        </div>

        <h3
          className="
            mt-5
            text-lg
            font-semibold
            tracking-tight
            text-[#14231e]
            dark:text-[#f1f7f4]
          "
        >
          {t("features.seoTitle")}
        </h3>

        <p
          className="
            mt-2
            max-w-md
            text-sm
            leading-6
            text-[#697671]
            dark:text-[#9fb4ab]
          "
        >
          {t("features.seoDescription")}
        </p>

        <div className="mt-5 space-y-2">

          <div
            className="
              rounded-xl
              border
              border-[#edf1ef]
              bg-white
              px-3.5
              py-2.5
              text-sm
              text-[#253630]
              dark:border-[#29483d]
              dark:bg-[#1b3028]
              dark:text-[#d5e3de]
            "
          >
            ✓ {t("features.listing")}
          </div>

          <div
            className="
              rounded-xl
              border
              border-[#edf1ef]
              bg-white
              px-3.5
              py-2.5
              text-sm
              text-[#253630]
              dark:border-[#29483d]
              dark:bg-[#1b3028]
              dark:text-[#d5e3de]
            "
          >
            ✓ {t("features.keywords")}
          </div>

          <div
            className="
              rounded-xl
              border
              border-[#edf1ef]
              bg-white
              px-3.5
              py-2.5
              text-sm
              text-[#253630]
              dark:border-[#29483d]
              dark:bg-[#1b3028]
              dark:text-[#d5e3de]
            "
          >
            ✓ {t("features.generator")}
          </div>

        </div>

      </div>


      {/* ================================================= */}
      {/* MARKET INTELLIGENCE */}
      {/* ================================================= */}

      <div
        className="
          group
          relative
          overflow-hidden
          rounded-2xl
          border
          border-[#dce8e3]
          bg-[#f7faf8]
          p-6
          shadow-[0_12px_35px_rgba(20,61,50,0.05)]
          transition-all
          duration-300
          hover:-translate-y-1
          hover:shadow-[0_20px_45px_rgba(20,61,50,0.09)]
          dark:border-[#29483d]
          dark:bg-[#14261f]
          dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.25)]
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
            bg-[#e4f2ec]
            text-sm
            font-medium
            text-[#34745f]
            dark:bg-[#21483b]
            dark:text-[#79c2a9]
          "
        >
          ↗
        </div>

        <h3
          className="
            mt-5
            text-lg
            font-semibold
            tracking-tight
            text-[#14231e]
            dark:text-[#f1f7f4]
          "
        >
          {t("features.marketTitle")}
        </h3>

        <p
          className="
            mt-2
            max-w-md
            text-sm
            leading-6
            text-[#697671]
            dark:text-[#9fb4ab]
          "
        >
          {t("features.marketDescription")}
        </p>

        <div className="mt-5 space-y-2">

          <div
            className="
              rounded-xl
              border
              border-[#edf1ef]
              bg-white
              px-3.5
              py-2.5
              text-sm
              text-[#253630]
              dark:border-[#29483d]
              dark:bg-[#1b3028]
              dark:text-[#d5e3de]
            "
          >
            ✓ {t("features.competitors")}
          </div>

          <div
            className="
              rounded-xl
              border
              border-[#edf1ef]
              bg-white
              px-3.5
              py-2.5
              text-sm
              text-[#253630]
              dark:border-[#29483d]
              dark:bg-[#1b3028]
              dark:text-[#d5e3de]
            "
          >
            ✓ {t("features.trends")}
          </div>

          <div
            className="
              rounded-xl
              border
              border-[#edf1ef]
              bg-white
              px-3.5
              py-2.5
              text-sm
              text-[#253630]
              dark:border-[#29483d]
              dark:bg-[#1b3028]
              dark:text-[#d5e3de]
            "
          >
            ✓ {t("features.opportunity")}
          </div>

        </div>

      </div>


      {/* ================================================= */}
      {/* VISUAL INTELLIGENCE */}
      {/* ================================================= */}

      <div
        className="
          group
          relative
          overflow-hidden
          rounded-2xl
          border
          border-[#dce8e3]
          bg-[#f7faf8]
          p-6
          shadow-[0_12px_35px_rgba(20,61,50,0.05)]
          transition-all
          duration-300
          hover:-translate-y-1
          hover:shadow-[0_20px_45px_rgba(20,61,50,0.09)]
          dark:border-[#29483d]
          dark:bg-[#14261f]
          dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.25)]
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
            bg-[#e4f2ec]
            text-sm
            font-medium
            text-[#34745f]
            dark:bg-[#21483b]
            dark:text-[#79c2a9]
          "
        >
          ◇
        </div>

        <h3
          className="
            mt-5
            text-lg
            font-semibold
            tracking-tight
            text-[#14231e]
            dark:text-[#f1f7f4]
          "
        >
          {t("features.visualTitle")}
        </h3>

        <p
          className="
            mt-2
            max-w-md
            text-sm
            leading-6
            text-[#697671]
            dark:text-[#9fb4ab]
          "
        >
          {t("features.visualDescription")}
        </p>

        <div className="mt-5 space-y-2">

          <div
            className="
              rounded-xl
              border
              border-[#edf1ef]
              bg-white
              px-3.5
              py-2.5
              text-sm
              text-[#253630]
              dark:border-[#29483d]
              dark:bg-[#1b3028]
              dark:text-[#d5e3de]
            "
          >
            ✓ {t("features.visualAudit")}
          </div>

          <div
            className="
              rounded-xl
              border
              border-[#edf1ef]
              bg-white
              px-3.5
              py-2.5
              text-sm
              text-[#253630]
              dark:border-[#29483d]
              dark:bg-[#1b3028]
              dark:text-[#d5e3de]
            "
          >
            ✓ {t("features.imageScore")}
          </div>

          <div
            className="
              rounded-xl
              border
              border-[#edf1ef]
              bg-white
              px-3.5
              py-2.5
              text-sm
              text-[#253630]
              dark:border-[#29483d]
              dark:bg-[#1b3028]
              dark:text-[#d5e3de]
            "
          >
            ✓ {t("features.recommendations")}
          </div>

        </div>

      </div>

    </div>


    {/* ================================================= */}
    {/* GROWTH COACH */}
    {/* ================================================= */}

    <div
      className="
        relative
        mx-auto
        mt-4
        max-w-5xl
        overflow-hidden
        rounded-2xl
        bg-[#143d32]
        px-6
        py-6
        text-white
        shadow-[0_20px_55px_rgba(20,61,50,0.14)]
        sm:px-7
      "
    >

      {/* GLOW */}
      <div
        className="
          pointer-events-none
          absolute
          -right-20
          -top-20
          h-48
          w-48
          rounded-full
          bg-[#55a98d]/20
          blur-3xl
        "
      />

      <div
        className="
          relative
          flex
          flex-col
          gap-6
          md:flex-row
          md:items-center
          md:justify-between
        "
      >

        {/* LEFT */}
        <div className="min-w-0">

          <div
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              bg-white/10
              text-sm
            "
          >
            ✦
          </div>

          <h3 className="mt-4 text-xl font-semibold tracking-tight">
            {t("features.coachTitle")}
          </h3>

          <p className="mt-2 max-w-xl text-sm leading-6 text-white/65">
            {t("features.coachDescription")}
          </p>

        </div>


        {/* STATS */}
        <div className="grid shrink-0 grid-cols-3 gap-2 md:w-[390px]">

          <div className="rounded-xl bg-white/[0.07] px-3 py-3">
            <p className="text-[10px] uppercase tracking-wide text-white/40">
              {t("features.priorities")}
            </p>

            <p className="mt-1.5 text-sm font-semibold">
              4 today
            </p>
          </div>

          <div className="rounded-xl bg-white/[0.07] px-3 py-3">
            <p className="text-[10px] uppercase tracking-wide text-white/40">
              {t("features.actions")}
            </p>

            <p className="mt-1.5 text-sm font-semibold">
              12 found
            </p>
          </div>

          <div className="rounded-xl bg-white/[0.07] px-3 py-3">
            <p className="text-[10px] uppercase tracking-wide text-white/40">
              {t("features.insights")}
            </p>

            <p className="mt-1.5 text-sm font-semibold">
              AI powered
            </p>
          </div>

        </div>

      </div>

    </div>

  </div>
</section>
      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="relative overflow-hidden border-y border-[#dfece6] bg-[#f1f8f5] dark:border-[#203b32] dark:bg-[#0f211a]"
      >
        <div className="pointer-events-none absolute -right-40 top-10 h-[420px] w-[420px] rounded-full bg-[#d8f1e8]/70 blur-3xl dark:bg-[#174c3b]/25" />

        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">

          {/* HEADER */}
          <div className="mx-auto max-w-3xl text-center">

            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4b9b83]">
              {t("howItWorks.eyebrow")}
            </p>

            <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-tight dark:text-[#f1f7f4] sm:text-5xl">
              {t("howItWorks.title")}
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#697671] dark:text-[#9fb4ab]">
              {t("howItWorks.description")}
            </p>

          </div>


          {/* STEPS */}
          <div className="relative mt-16">

            {/* CONNECTING LINE */}
            <div className="absolute left-[12.5%] right-[12.5%] top-7 hidden h-px bg-[#cfe0d9] dark:bg-[#315247] lg:block" />

            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">

              {/* STEP 1 */}
              <div className="relative rounded-3xl border border-transparent p-5 transition duration-300 hover:border-[#d5e5df] hover:bg-white/70 hover:shadow-sm dark:hover:border-[#29483d] dark:hover:bg-[#14261f]">

                <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#143d32] text-sm font-bold text-white shadow-lg shadow-[#143d32]/10">
                  01
                </div>

                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.15em] text-[#4b9b83]">
                  {t("howItWorks.step1Label")}
                </p>

                <h3 className="mt-2 text-xl font-semibold dark:text-[#f1f7f4]">
                  {t("howItWorks.step1Title")}
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#697671] dark:text-[#9fb4ab]">
                  {t("howItWorks.step1Description")}
                </p>

              </div>


              {/* STEP 2 */}
              <div className="relative rounded-3xl border border-transparent p-5 transition duration-300 hover:border-[#d5e5df] hover:bg-white/70 hover:shadow-sm dark:hover:border-[#29483d] dark:hover:bg-[#14261f]">

                <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#cfe0d9] bg-white text-sm font-bold text-[#34745f] shadow-sm transition hover:border-[#9fcdbd] dark:border-[#315247] dark:bg-[#172c24] dark:text-[#79c2a9] dark:hover:border-[#4b806d]">
                  02
                </div>

                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.15em] text-[#4b9b83]">
                  {t("howItWorks.step2Label")}
                </p>

                <h3 className="mt-2 text-xl font-semibold dark:text-[#f1f7f4]">
                  {t("howItWorks.step2Title")}
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#697671] dark:text-[#9fb4ab]">
                  {t("howItWorks.step2Description")}
                </p>

              </div>


              {/* STEP 3 */}
              <div className="relative rounded-3xl border border-transparent p-5 transition duration-300 hover:border-[#d5e5df] hover:bg-white/70 hover:shadow-sm dark:hover:border-[#29483d] dark:hover:bg-[#14261f]">

                <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#cfe0d9] bg-white text-sm font-bold text-[#34745f] shadow-sm transition hover:border-[#9fcdbd] dark:border-[#315247] dark:bg-[#172c24] dark:text-[#79c2a9] dark:hover:border-[#4b806d]">
                  03
                </div>

                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.15em] text-[#4b9b83]">
                  {t("howItWorks.step3Label")}
                </p>

                <h3 className="mt-2 text-xl font-semibold dark:text-[#f1f7f4]">
                  {t("howItWorks.step3Title")}
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#697671] dark:text-[#9fb4ab]">
                  {t("howItWorks.step3Description")}
                </p>

              </div>


              {/* STEP 4 */}
              <div className="relative rounded-3xl border border-transparent p-5 transition duration-300 hover:border-[#d5e5df] hover:bg-white/70 hover:shadow-sm dark:hover:border-[#29483d] dark:hover:bg-[#14261f]">

                <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#143d32] text-sm font-bold text-white shadow-lg shadow-[#143d32]/10">
                  04
                </div>

                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.15em] text-[#4b9b83]">
                  {t("howItWorks.step4Label")}
                </p>

                <h3 className="mt-2 text-xl font-semibold dark:text-[#f1f7f4]">
                  {t("howItWorks.step4Title")}
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#697671] dark:text-[#9fb4ab]">
                  {t("howItWorks.step4Description")}
                </p>

              </div>

            </div>
          </div>


          {/* MINI PRODUCT FLOW */}
          <div className="relative mt-16 overflow-hidden rounded-3xl bg-[#143d32] p-6 text-white shadow-[0_25px_70px_rgba(20,61,50,0.15)] sm:p-8">

            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#55a98d]/20 blur-3xl" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/45">
                  CraftPilot AI
                </p>

                <p className="mt-2 max-w-3xl text-lg font-semibold leading-8">
                  {t("howItWorks.flow")}
                </p>

              </div>

              <Link
  href={`/${locale}/register`}
  className="shrink-0 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[#143d32] transition hover:-translate-y-0.5 hover:bg-[#eef5f2]"
>
  {t("howItWorks.cta")} →
</Link>

            </div>
          </div>

        </div>
      </section>


      {/* PRICING */}
      <section
        id="pricing"
        className="relative overflow-hidden border-t border-[#dfece6] bg-[#f7faf8] dark:border-[#203b32] dark:bg-[#0d1b16]"
      >

        <div className="pointer-events-none absolute -right-40 top-20 h-[420px] w-[420px] rounded-full bg-[#e2f4ec]/60 blur-3xl dark:bg-[#174c3b]/25" />

        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">

          {/* HEADER */}
          <div className="mx-auto max-w-3xl text-center">

            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4b9b83]">
              {t("pricing.eyebrow")}
            </p>

            <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-tight dark:text-[#f1f7f4] sm:text-5xl">
              {t("pricing.title")}
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#697671] dark:text-[#9fb4ab]">
              {t("pricing.description")}
            </p>

            <div className="mt-7 inline-flex rounded-full border border-[#dfe9e4] bg-[#f7faf8] p-1 dark:border-[#29483d] dark:bg-[#14261f]">

              <span className="rounded-full bg-white px-5 py-2 text-sm font-semibold shadow-sm dark:bg-[#1c3028] dark:text-[#e4eee9]">
                {t("pricing.monthly")}
              </span>

            </div>
          </div>


          {/* PLANS */}
          <div className="relative mx-auto mt-14 grid max-w-6xl gap-6 lg:grid-cols-3">


            {/* FREE */}
            <div className="rounded-3xl border border-[#d5e5df] bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(20,61,50,0.08)] dark:border-[#29483d] dark:bg-[#14261f] dark:hover:shadow-[0_25px_60px_rgba(0,0,0,0.3)]">

              <h3 className="text-xl font-semibold dark:text-[#f1f7f4]">
                {t("pricing.free")}
              </h3>

              <p className="mt-3 min-h-[48px] text-sm leading-6 text-[#697671] dark:text-[#9fb4ab]">
                {t("pricing.freeDescription")}
              </p>

              <div className="mt-7 flex items-end gap-1">

                <span className="text-4xl font-semibold dark:text-[#f1f7f4]">
                  {t("pricing.freePrice")}
                </span>

                <span className="mb-1 text-sm text-[#929d99] dark:text-[#71877e]">
                  {t("pricing.freePeriod")}
                </span>

              </div>

              <Link
  href={`/${locale}/register`}
  className="mt-7 block w-full rounded-full border border-[#bcd3ca] bg-white px-5 py-3 text-center text-sm font-semibold text-[#143d32] transition hover:-translate-y-0.5 hover:bg-[#f0f7f4] dark:border-[#426659] dark:bg-[#1b3028] dark:text-[#b9d4c9] dark:hover:bg-[#234137]"
>
  {t("pricing.freeButton")}
</Link>

              <div className="mt-7 border-t border-[#e5ece9] pt-6 dark:border-[#29483d]">

                <p className="text-xs font-semibold uppercase tracking-wider text-[#929d99] dark:text-[#71877e]">
                  {t("pricing.credits")}
                </p>

                <p className="mt-2 text-sm font-semibold dark:text-[#e4eee9]">
                  100 credits
                </p>

                <div className="mt-5 space-y-3">

                  <div className="text-sm text-[#596762] dark:text-[#b4c6bf]">
                    ✓ {t("pricing.freeFeature1")}
                  </div>

                  <div className="text-sm text-[#596762] dark:text-[#b4c6bf]">
                    ✓ {t("pricing.freeFeature2")}
                  </div>

                  <div className="text-sm text-[#596762] dark:text-[#b4c6bf]">
                    ✓ {t("pricing.freeFeature3")}
                  </div>

                  <div className="text-sm text-[#596762] dark:text-[#b4c6bf]">
                    ✓ {t("pricing.freeFeature4")}
                  </div>

                </div>
              </div>
            </div>


            {/* PRO */}
            <div className="relative rounded-3xl border-2 border-[#143d32] bg-[#143d32] p-7 text-white shadow-[0_25px_70px_rgba(20,61,50,0.15)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_35px_90px_rgba(20,61,50,0.28)]">

              <div className="absolute right-6 top-6 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#143d32]">
                {t("pricing.popular")}
              </div>

              <h3 className="text-xl font-semibold">
                {t("pricing.pro")}
              </h3>

              <p className="mt-3 min-h-[48px] text-sm leading-6 text-white/60">
                {t("pricing.proDescription")}
              </p>

              <div className="mt-7 flex items-end gap-1">

                <span className="text-4xl font-semibold">
                  {t("pricing.proPrice")}
                </span>

                <span className="mb-1 text-sm text-white/50">
                  {t("pricing.freePeriod")}
                </span>

              </div>

              <Link
  href={`/${locale}/register`}
  className="mt-7 block w-full rounded-full bg-white px-5 py-3 text-center text-sm font-semibold text-[#143d32] transition hover:-translate-y-0.5 hover:bg-[#eef5f2]"
>
  {t("pricing.proButton")}
</Link>

              <div className="mt-7 border-t border-white/10 pt-6">

                <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
                  {t("pricing.credits")}
                </p>

                <p className="mt-2 text-sm font-semibold">
                  1,000 credits
                </p>

                <div className="mt-5 space-y-3">

                  <div className="text-sm text-white/75">
                    ✓ {t("pricing.proFeature1")}
                  </div>

                  <div className="text-sm text-white/75">
                    ✓ {t("pricing.proFeature2")}
                  </div>

                  <div className="text-sm text-white/75">
                    ✓ {t("pricing.proFeature3")}
                  </div>

                  <div className="text-sm text-white/75">
                    ✓ {t("pricing.proFeature4")}
                  </div>

                  <div className="text-sm text-white/75">
                    ✓ {t("pricing.proFeature5")}
                  </div>

                  <div className="text-sm text-white/75">
                    ✓ {t("pricing.proFeature6")}
                  </div>

                </div>
              </div>
            </div>


            {/* BUSINESS */}
            <div className="rounded-3xl border border-[#d5e5df] bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(20,61,50,0.08)] dark:border-[#29483d] dark:bg-[#14261f] dark:hover:shadow-[0_25px_60px_rgba(0,0,0,0.3)]">

              <h3 className="text-xl font-semibold dark:text-[#f1f7f4]">
                {t("pricing.business")}
              </h3>

              <p className="mt-3 min-h-[48px] text-sm leading-6 text-[#697671] dark:text-[#9fb4ab]">
                {t("pricing.businessDescription")}
              </p>

              <div className="mt-7 flex items-end gap-1">

                <span className="text-4xl font-semibold dark:text-[#f1f7f4]">
                  {t("pricing.businessPrice")}
                </span>

                <span className="mb-1 text-sm text-[#929d99] dark:text-[#71877e]">
                  {t("pricing.freePeriod")}
                </span>

              </div>

              <Link
  href={`/${locale}/register`}
  className="mt-7 block w-full rounded-full border border-[#bcd3ca] bg-white px-5 py-3 text-center text-sm font-semibold text-[#143d32] transition hover:-translate-y-0.5 hover:bg-[#f0f7f4] dark:border-[#426659] dark:bg-[#1b3028] dark:text-[#b9d4c9] dark:hover:bg-[#234137]"
>
  {t("pricing.businessButton")}
</Link>

              <div className="mt-7 border-t border-[#e5ece9] pt-6 dark:border-[#29483d]">

                <p className="text-xs font-semibold uppercase tracking-wider text-[#929d99] dark:text-[#71877e]">
                  {t("pricing.credits")}
                </p>

                <p className="mt-2 text-sm font-semibold dark:text-[#e4eee9]">
                  3,000 credits
                </p>

                <div className="mt-5 space-y-3">

                  <div className="text-sm text-[#596762] dark:text-[#b4c6bf]">
                    ✓ {t("pricing.businessFeature1")}
                  </div>

                  <div className="text-sm text-[#596762] dark:text-[#b4c6bf]">
                    ✓ {t("pricing.businessFeature2")}
                  </div>

                  <div className="text-sm text-[#596762] dark:text-[#b4c6bf]">
                    ✓ {t("pricing.businessFeature3")}
                  </div>

                  <div className="text-sm text-[#596762] dark:text-[#b4c6bf]">
                    ✓ {t("pricing.businessFeature4")}
                  </div>

                  <div className="text-sm text-[#596762] dark:text-[#b4c6bf]">
                    ✓ {t("pricing.businessFeature5")}
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
      {/* FAQ */}
      <section
        id="faq"
        className="relative overflow-hidden border-t border-[#dfece6] bg-[#f4f9f6] dark:border-[#203b32] dark:bg-[#0f211a]"
      >
        <div className="pointer-events-none absolute -right-40 top-10 h-[420px] w-[420px] rounded-full bg-[#dff3ea]/70 blur-3xl dark:bg-[#174c3b]/25" />

        <div className="relative mx-auto max-w-5xl px-6 py-24 lg:px-8">

          {/* HEADER */}
          <div className="mx-auto max-w-3xl text-center">

            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4b9b83]">
              {t("faq.eyebrow")}
            </p>

            <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-tight dark:text-[#f1f7f4] sm:text-5xl">
              {t("faq.title")}
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#697671] dark:text-[#9fb4ab]">
              {t("faq.description")}
            </p>

          </div>


          {/* QUESTIONS */}
          <div className="mx-auto mt-14 divide-y divide-[#dfe9e4] overflow-hidden rounded-3xl border border-[#d5e5df] bg-white px-6 shadow-sm dark:divide-[#29483d] dark:border-[#29483d] dark:bg-[#14261f] sm:px-8">

            {[
              ["q1", "a1"],
              ["q2", "a2"],
              ["q3", "a3"],
              ["q4", "a4"],
              ["q5", "a5"],
              ["q6", "a6"],
              ["q7", "a7"],
              ["q8", "a8"],
            ].map(([question, answer]) => (
              <details
                key={question}
                className="group py-6"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-left text-base font-semibold dark:text-[#f1f7f4]">

                  <span>
                    {t(`faq.${question}`)}
                  </span>

                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef6f2] text-[#34745f] transition duration-300 group-open:rotate-45 dark:bg-[#1d382e] dark:text-[#79c2a9]">
                    +
                  </span>

                </summary>

                <p className="mt-4 max-w-3xl pr-12 text-sm leading-7 text-[#697671] dark:text-[#9fb4ab]">
                  {t(`faq.${answer}`)}
                </p>

              </details>
            ))}

          </div>

        </div>
      </section>


     {/* FINAL CTA */}
<section className="relative overflow-hidden bg-white dark:bg-[#0d1b16]">

  <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">

    <div className="relative overflow-hidden rounded-[32px] bg-[#143d32] px-7 py-16 text-center text-white shadow-[0_30px_80px_rgba(20,61,50,0.15)] sm:px-12 lg:px-20">

      {/* GLOW */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#55a98d]/20 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#55a98d]/10 blur-3xl" />

      {/* CONTENT */}
      <div className="relative">

        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#79c2a9]">
          {t("finalCta.eyebrow")}
        </p>

        <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          {t("finalCta.title")}
        </h2>

        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/65">
          {t("finalCta.description")}
        </p>

        {/* FINAL CTA */}
        <Link
          href={`/${locale}/register`}
          className="mt-8 inline-flex rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#143d32] shadow-lg transition duration-300 hover:-translate-y-0.5 hover:bg-[#eef5f2]"
        >
          {t("finalCta.button")} →
        </Link>

        <p className="mt-4 text-xs text-white/40">
          {t("finalCta.note")}
        </p>

      </div>

    </div>

  </div>
</section>


{/* FOOTER */}
<footer className="border-t border-[#e5ece9] bg-white dark:border-[#203b32] dark:bg-[#0d1b16]">

  <div className="mx-auto max-w-7xl px-6 lg:py-12 lg:px-8">

    <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">

      {/* BRAND */}
      <div>

        <Link
          href={`/${locale}`}
          className="flex items-center gap-2"
        >

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#143d32] text-sm font-bold text-white">
            C
          </div>

          <span className="text-lg font-semibold tracking-tight dark:text-[#f1f7f4]">
            CraftPilot
          </span>

        </Link>

        <p className="mt-5 max-w-sm text-sm leading-6 text-[#697671] dark:text-[#9fb4ab]">
          {t("footer.description")}
        </p>

        <p className="mt-5 text-xs text-[#929d99] dark:text-[#71877e]">
          {t("footer.builtFor")}
        </p>

      </div>


      {/* PRODUCT */}
      {/* NAV LINKS */}
<div
  className="
    hidden
    items-center
    gap-2
    text-sm
    md:flex
    dark:text-[#9fb4ab]
  "
>
  <a
    href="#features"
    className="
      rounded-full
      border border-transparent
      px-4 py-2.5
      text-[#68756f]
      transition-all duration-200
      hover:border-[#dfe9e4]
      hover:bg-white
      hover:text-[#143d32]
      hover:shadow-[0_2px_8px_rgba(20,61,50,0.04)]
      dark:text-[#9fb4ab]
      dark:hover:border-[#24483c]
      dark:hover:bg-[#12251f]
      dark:hover:text-[#79c2a9]
    "
  >
    {t("nav.features")}
  </a>

  <a
    href="#how-it-works"
    className="
      rounded-full
      border border-transparent
      px-4 py-2.5
      text-[#68756f]
      transition-all duration-200
      hover:border-[#dfe9e4]
      hover:bg-white
      hover:text-[#143d32]
      hover:shadow-[0_2px_8px_rgba(20,61,50,0.04)]
      dark:text-[#9fb4ab]
      dark:hover:border-[#24483c]
      dark:hover:bg-[#12251f]
      dark:hover:text-[#79c2a9]
    "
  >
    {t("nav.howItWorks")}
  </a>

  <a
    href="#pricing"
    className="
      rounded-full
      border border-transparent
      px-4 py-2.5
      text-[#68756f]
      transition-all duration-200
      hover:border-[#dfe9e4]
      hover:bg-white
      hover:text-[#143d32]
      hover:shadow-[0_2px_8px_rgba(20,61,50,0.04)]
      dark:text-[#9fb4ab]
      dark:hover:border-[#24483c]
      dark:hover:bg-[#12251f]
      dark:hover:text-[#79c2a9]
    "
  >
    {t("nav.pricing")}
  </a>
</div>

      {/* RESOURCES */}
      <div>

        <p className="text-sm font-semibold dark:text-[#f1f7f4]">
          {t("footer.resources")}
        </p>

        <div className="mt-5 space-y-3">

          <a
            href="#faq"
            className="block text-sm text-[#697671] transition hover:text-[#143d32] dark:text-[#9fb4ab] dark:hover:text-[#79c2a9]"
          >
            {t("footer.faq")}
          </a>

          <a
            href="#"
            className="block text-sm text-[#697671] transition hover:text-[#143d32] dark:text-[#9fb4ab] dark:hover:text-[#79c2a9]"
          >
            {t("footer.support")}
          </a>

        </div>

      </div>


      {/* LEGAL */}
      <div>

        <p className="text-sm font-semibold dark:text-[#f1f7f4]">
          {t("footer.legal")}
        </p>

        <div className="mt-5 space-y-3">

          <a
            href="#"
            className="block text-sm text-[#697671] transition hover:text-[#143d32] dark:text-[#9fb4ab] dark:hover:text-[#79c2a9]"
          >
            {t("footer.privacy")}
          </a>

          <a
            href="#"
            className="block text-sm text-[#697671] transition hover:text-[#143d32] dark:text-[#9fb4ab] dark:hover:text-[#79c2a9]"
          >
            {t("footer.terms")}
          </a>

        </div>

      </div>

    </div>


    {/* BOTTOM */}
    <div className="mt-12 flex flex-col gap-3 border-t border-[#e5ece9] pt-7 text-xs text-[#929d99] dark:border-[#29483d] dark:text-[#71877e] sm:flex-row sm:items-center sm:justify-between">

      <p>
        {t("footer.copyright")}
      </p>

      <p>
        CraftPilot AI
      </p>

    </div>

  </div>
</footer>
</main> 
); 
}
