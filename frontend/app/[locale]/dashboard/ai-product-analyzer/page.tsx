"use client";

import UrlProductAnalyzer from "../products/components/UrlProductAnalyzer";

export default function AIProductAnalyzerPage() {
  return (
    <div className="min-h-screen">
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
            AI Product Analyzer
          </h1>

          <p
            className="
              mt-2
              text-sm
              text-[#899690]
            "
          >
            Turn any product URL into an Etsy-ready listing.
          </p>
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
      </main>
    </div>
  );
}