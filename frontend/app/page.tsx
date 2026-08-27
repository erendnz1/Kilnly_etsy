const features = [
  {
    title: "AI Listing Generator",
    description:
      "Create optimized titles, descriptions, tags and attributes from a simple product idea.",
  },
  {
    title: "Keyword Intelligence",
    description:
      "Discover relevant keywords and understand where your listings can compete.",
  },
  {
    title: "Store Health",
    description:
      "Find weak listings, SEO problems and growth opportunities across your shop.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fafcfb] text-[#14201c]">
      {/* NAVBAR */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#143d32] text-sm font-bold text-white">
            C
          </div>

          <span className="text-xl font-semibold tracking-tight">
            CraftPilot
          </span>
        </div>

        <div className="hidden items-center gap-8 text-sm text-[#68756f] md:flex">
          <a
            href="#features"
            className="transition hover:text-[#143d32]"
          >
            Features
          </a>

          <a
            href="#how-it-works"
            className="transition hover:text-[#143d32]"
          >
            How it works
          </a>

          <a
            href="#pricing"
            className="transition hover:text-[#143d32]"
          >
            Pricing
          </a>
        </div>

        <div className="flex items-center gap-3">
          <button className="hidden text-sm font-medium text-[#46534f] sm:block">
            Log in
          </button>

          <button className="rounded-full bg-[#143d32] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1c5143]">
            Start free
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute left-1/2 top-10 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#d8f1e8] opacity-60 blur-3xl" />

        <div className="mx-auto max-w-7xl px-6 pb-24 pt-20 lg:px-8 lg:pb-32 lg:pt-28">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#d7e5df] bg-white px-4 py-2 text-sm text-[#596861] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#55a98d]" />
              AI-powered Etsy growth platform
            </div>

            {/* Main heading */}
            <h1 className="text-5xl font-semibold leading-[1.03] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
              Turn your Etsy data
              <br />
              into your{" "}
              <span className="text-[#4a9c82]">
                next best move.
              </span>
            </h1>

            {/* Description */}
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-[#697671] sm:text-xl">
              CraftPilot analyzes your listings, SEO and store performance
              and turns the data into clear, actionable recommendations.
            </p>

            {/* CTA */}
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <button className="rounded-full bg-[#143d32] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#143d32]/10 transition hover:-translate-y-0.5 hover:bg-[#1c5143]">
                Analyze my store →
              </button>

              <button className="rounded-full border border-[#d8e2de] bg-white px-7 py-3.5 text-sm font-semibold text-[#30413b] transition hover:bg-[#f4f8f6]">
                See how it works
              </button>
            </div>

            <p className="mt-4 text-xs text-[#8c9894]">
              Start free · No credit card required
            </p>
          </div>

          {/* PRODUCT PREVIEW */}
          <div className="mx-auto mt-20 max-w-6xl">
            <div className="rounded-[28px] border border-[#dce8e3] bg-white p-2 shadow-[0_35px_100px_rgba(20,61,50,0.12)]">
              <div className="overflow-hidden rounded-[22px] border border-[#e7eeeb]">
                {/* Browser bar */}
                <div className="flex items-center gap-2 border-b border-[#edf1ef] bg-[#fbfcfb] px-5 py-4">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#d9e1de]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#d9e1de]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#d9e1de]" />

                  <div className="mx-auto hidden rounded-full bg-[#f0f4f2] px-24 py-1.5 text-xs text-[#9aa6a1] sm:block">
                    app.craftpilot.ai
                  </div>
                </div>

                {/* Dashboard */}
                <div className="grid min-h-[430px] md:grid-cols-[190px_1fr]">
                  {/* Sidebar */}
                  <aside className="hidden border-r border-[#edf1ef] bg-[#fbfcfb] p-5 md:block">
                    <div className="mb-9 flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-[#143d32]" />

                      <div className="h-3 w-20 rounded-full bg-[#dce6e2]" />
                    </div>

                    <div className="space-y-2">
                      <div className="rounded-xl bg-[#e5f2ed] px-3 py-2.5 text-xs font-semibold text-[#286653]">
                        Overview
                      </div>

                      <div className="px-3 py-2.5 text-xs text-[#87938e]">
                        AI Listings
                      </div>

                      <div className="px-3 py-2.5 text-xs text-[#87938e]">
                        Keywords
                      </div>

                      <div className="px-3 py-2.5 text-xs text-[#87938e]">
                        Store Health
                      </div>

                      <div className="px-3 py-2.5 text-xs text-[#87938e]">
                        AI Coach
                      </div>
                    </div>
                  </aside>

                  {/* Main dashboard */}
                  <div className="bg-white p-6 sm:p-8">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-[#9aa6a1]">
                          Store overview
                        </p>

                        <h3 className="mt-1 text-2xl font-semibold">
                          Good morning 👋
                        </h3>
                      </div>

                      <div className="rounded-full bg-[#edf7f3] px-3 py-1.5 text-xs font-semibold text-[#367861]">
                        850 credits
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="mt-7 grid gap-4 sm:grid-cols-3">
                      <div className="rounded-2xl bg-[#f6f9f7] p-4">
                        <p className="text-xs text-[#8b9792]">
                          Store health
                        </p>

                        <div className="mt-3 flex items-end gap-1">
                          <span className="text-3xl font-semibold">
                            82
                          </span>

                          <span className="mb-1 text-xs text-[#65a48f]">
                            /100
                          </span>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-[#f6f9f7] p-4">
                        <p className="text-xs text-[#8b9792]">
                          Listings
                        </p>

                        <p className="mt-3 text-3xl font-semibold">
                          47
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#f6f9f7] p-4">
                        <p className="text-xs text-[#8b9792]">
                          Opportunities
                        </p>

                        <p className="mt-3 text-3xl font-semibold">
                          12
                        </p>
                      </div>
                    </div>

                    {/* AI recommendation */}
                    <div className="mt-5 rounded-2xl border border-[#e4ebe8] p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-[#55a98d]" />

                            <p className="text-sm font-semibold">
                              AI opportunity detected
                            </p>
                          </div>

                          <p className="mt-3 max-w-lg text-sm leading-6 text-[#717e79]">
                            Your &quot;Personalized Necklace&quot; listing
                            gets views but has room for improvement in its
                            title and primary keyword.
                          </p>
                        </div>

                        <div className="hidden rounded-full bg-[#143d32] px-4 py-2 text-xs font-semibold text-white sm:block">
                          Fix with AI
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl bg-[#f7f9f8] p-3">
                          <p className="text-[11px] text-[#929d99]">
                            Priority
                          </p>

                          <p className="mt-1 text-sm font-semibold">
                            High
                          </p>
                        </div>

                        <div className="rounded-xl bg-[#f7f9f8] p-3">
                          <p className="text-[11px] text-[#929d99]">
                            Impact
                          </p>

                          <p className="mt-1 text-sm font-semibold">
                            SEO
                          </p>
                        </div>

                        <div className="rounded-xl bg-[#f7f9f8] p-3">
                          <p className="text-[11px] text-[#929d99]">
                            Action
                          </p>

                          <p className="mt-1 text-sm font-semibold">
                            Optimize
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        className="border-y border-[#e5ece9] bg-white"
      >
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4b9b83]">
              Everything in one place
            </p>

            <h2 className="mt-3 text-4xl font-semibold tracking-tight">
              Less guessing. More growing.
            </h2>

            <p className="mt-5 leading-7 text-[#697671]">
              Instead of switching between different Etsy tools, CraftPilot
              brings the most important parts of your store growth workflow
              together.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="rounded-3xl border border-[#e3ebe7] bg-[#fbfcfb] p-7 transition hover:-translate-y-1 hover:border-[#cbded6] hover:shadow-xl hover:shadow-[#143d32]/5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e7f3ee] text-sm font-bold text-[#34745f]">
                  0{index + 1}
                </div>

                <h3 className="mt-8 text-xl font-semibold">
                  {feature.title}
                </h3>

                <p className="mt-3 leading-7 text-[#6c7974]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="bg-[#f4f8f6]">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4b9b83]">
                How it works
              </p>

              <h2 className="mt-3 text-4xl font-semibold tracking-tight">
                Your store has data.
                <br />
                We turn it into action.
              </h2>

              <p className="mt-5 max-w-lg leading-7 text-[#697671]">
                CraftPilot continuously turns your Etsy data into simple
                recommendations you can actually act on.
              </p>
            </div>

            <div className="space-y-4">
              {[
                [
                  "01",
                  "Connect your store",
                  "Bring your Etsy store into CraftPilot.",
                ],
                [
                  "02",
                  "Let AI analyze it",
                  "CraftPilot looks for SEO, listing and growth opportunities.",
                ],
                [
                  "03",
                  "Take action",
                  "Improve your listings with AI-powered recommendations.",
                ],
              ].map(([number, title, description]) => (
                <div
                  key={number}
                  className="flex gap-5 rounded-2xl border border-[#dfe9e4] bg-white p-5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e7f3ee] text-sm font-semibold text-[#34745f]">
                    {number}
                  </div>

                  <div>
                    <h3 className="font-semibold">{title}</h3>

                    <p className="mt-1 text-sm leading-6 text-[#77837f]">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section id="pricing">
        <div className="mx-auto max-w-4xl px-6 py-28 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4b9b83]">
            Start growing smarter
          </p>

          <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Stop guessing what to improve.
          </h2>

          <p className="mx-auto mt-5 max-w-xl leading-7 text-[#697671]">
            Let CraftPilot find the opportunities hiding inside your Etsy
            store.
          </p>

          <button className="mt-9 rounded-full bg-[#143d32] px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-[#143d32]/10 transition hover:-translate-y-0.5 hover:bg-[#1c5143]">
            Start for free →
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#e5ece9]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-[#7a8782] sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <span>© 2026 CraftPilot AI</span>

          <span>Built for Etsy sellers.</span>
        </div>
      </footer>
    </main>
  );
}