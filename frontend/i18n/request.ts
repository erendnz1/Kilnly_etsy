import { getRequestConfig } from "next-intl/server";

const locales = ["en", "tr"] as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;

  console.log("🌍 REQUESTED:", requested);

  const locale = locales.includes(
    requested as (typeof locales)[number],
  )
    ? requested
    : "en";

  console.log("🌍 ACTIVE:", locale);

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});