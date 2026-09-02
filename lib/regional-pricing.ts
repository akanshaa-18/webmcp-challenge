"use client";

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export type PricingUnavailableReason =
  | "unsupported_region"
  | "fragment_unavailable"
  | "osi_unavailable"
  | "pricing_unavailable"
  | "upstream_unavailable"
  | "contract_error";

export interface RegionalPriceSuccess {
  status: "ok";
  data: {
    planId: string;
    country: string;
    locale: string;
    currency: string;
    amount: number;
    formattedPrice: string;
    billingPeriod: "month" | "year" | "unknown";
    source: "live_regional_pricing";
    retrievedAt: string;
  };
}

export interface RegionalPriceUnavailable {
  status: "price_unavailable";
  data: {
    planId: string;
    country: string;
    locale: string;
    reason: PricingUnavailableReason;
    source: "live_regional_pricing";
    retrievedAt: string;
  };
}

export type RegionalPriceResult = RegionalPriceSuccess | RegionalPriceUnavailable;

interface ResolvePriceInput {
  planId: string;
  country: string;
  locale?: string;
}

interface ResolvePriceOptions {
  signal?: AbortSignal;
  fetchImpl?: FetchLike;
}

interface CacheEntry {
  result: RegionalPriceResult;
  expiresAt: number;
}

const MAS_FRAGMENT_ENDPOINT = "https://www.adobe.com/mas/io/fragment";
const WCS_ARTIFACT_ENDPOINT = "https://www.adobe.com/web_commerce_artifact";
const PUBLIC_WEB_API_KEY = "wcms-commerce-ims-ro-user-milo";
const CACHE_TTL_MS = 5 * 60 * 1000;

const COUNTRY_TO_LOCALE: Record<string, string> = {
  IN: "en_IN",
  US: "en_US",
};

/**
 * Fragment IDs are centrally mapped to plan IDs to keep pricing internals out of
 * tool handlers and UI components.
 *
 * Provenance:
 * - `adobe-student-cc-in` appears in public Adobe plans merch references.
 * - Remaining IDs align with the same public plans merch card family used for pricing.
 */
const PLAN_TO_MAS_FRAGMENT_ID: Record<string, string> = {
  "adobe-student-cc-in": "2bee9d3e-55ae-4701-b946-44b32fa5d9fa",
  "adobe-photography-in": "86248907-1cb6-4d1e-8b3f-a42dee95d9bc",
  "adobe-all-apps-in": "2c5cd672-1db8-409c-96ff-46b1a1dfb7dc",
};

const cache = new Map<string, CacheEntry>();

function nowIso() {
  return new Date().toISOString();
}

function decodeHtmlEntities(text: string): string {
  return text
    .replaceAll("&#8377;", "₹")
    .replaceAll("&euro;", "€")
    .replaceAll("&pound;", "£")
    .replaceAll("&yen;", "¥")
    .replaceAll("&amp;", "&")
    .replaceAll("&nbsp;", " ");
}

function toBillingPeriod(term: unknown): "month" | "year" | "unknown" {
  if (term === "MONTHLY") return "month";
  if (term === "YEARLY" || term === "ANNUAL") return "year";
  return "unknown";
}

function unavailable(
  planId: string,
  country: string,
  locale: string,
  reason: PricingUnavailableReason,
): RegionalPriceUnavailable {
  return {
    status: "price_unavailable",
    data: {
      planId,
      country,
      locale,
      reason,
      source: "live_regional_pricing",
      retrievedAt: nowIso(),
    },
  };
}

function resolveLocale(country: string, locale?: string): string | null {
  if (locale && locale.trim()) {
    return locale.trim();
  }
  return COUNTRY_TO_LOCALE[country] ?? null;
}

function extractOsi(fragmentPayload: unknown): string | null {
  if (!fragmentPayload || typeof fragmentPayload !== "object") {
    return null;
  }
  const payload = fragmentPayload as {
    fields?: unknown;
  };

  if (payload.fields && typeof payload.fields === "object" && !Array.isArray(payload.fields)) {
    const fields = payload.fields as Record<string, unknown>;
    if (typeof fields.osi === "string" && fields.osi.trim()) {
      return fields.osi.trim();
    }
    const inlinePriceHtml = fields.prices;
    if (inlinePriceHtml && typeof inlinePriceHtml === "object" && "value" in inlinePriceHtml) {
      const html = (inlinePriceHtml as { value?: unknown }).value;
      if (typeof html === "string") {
        const match = html.match(/data-wcs-osi="([^"]+)"/);
        if (match?.[1]) return match[1];
      }
    }
  }

  if (Array.isArray(payload.fields)) {
    for (const field of payload.fields) {
      if (!field || typeof field !== "object") continue;
      const item = field as { name?: unknown; values?: unknown };
      if (item.name === "osi" && Array.isArray(item.values) && typeof item.values[0] === "string") {
        return item.values[0];
      }
    }
  }

  return null;
}

function parseCurrencyCode(analyticsValue: unknown, formatStringValue: unknown): string | null {
  if (typeof analyticsValue === "string") {
    try {
      const analytics = JSON.parse(analyticsValue) as { currencyCode?: unknown };
      if (typeof analytics.currencyCode === "string" && analytics.currencyCode.trim()) {
        return analytics.currencyCode.trim();
      }
    } catch {
      return null;
    }
  }

  if (typeof formatStringValue === "string") {
    if (formatStringValue.includes("&#8377;")) return "INR";
    if (formatStringValue.includes("US$")) return "USD";
    if (formatStringValue.includes("&euro;")) return "EUR";
    if (formatStringValue.includes("&pound;")) return "GBP";
    if (formatStringValue.includes("&yen;")) return "JPY";
    const quoted = formatStringValue.match(/'([^']+)'/);
    if (quoted?.[1]) {
      return quoted[1];
    }
  }

  return null;
}

async function fetchMasFragment(
  fragmentId: string,
  locale: string,
  fetchImpl: FetchLike,
  signal?: AbortSignal,
) {
  const url = new URL(MAS_FRAGMENT_ENDPOINT);
  url.searchParams.set("id", fragmentId);
  url.searchParams.set("locale", locale);
  url.searchParams.set("api_key", PUBLIC_WEB_API_KEY);
  return fetchImpl(url, { method: "GET", signal });
}

async function fetchWcsOffer(
  osi: string,
  country: string,
  locale: string,
  fetchImpl: FetchLike,
  signal?: AbortSignal,
) {
  const url = new URL(WCS_ARTIFACT_ENDPOINT);
  url.searchParams.set("offer_selector_ids", osi);
  url.searchParams.set("country", country);
  url.searchParams.set("locale", locale);
  url.searchParams.set("landscape", "PUBLISHED");
  url.searchParams.set("api_key", PUBLIC_WEB_API_KEY);
  url.searchParams.set("language", "MULT");
  return fetchImpl(url, { method: "GET", signal });
}

export async function extractPlanOsi(
  planId: string,
  country: string,
  fetchImpl?: FetchLike,
): Promise<{ status: "ok"; osi: string } | { status: "error"; reason: string }> {
  const resolvedCountry = (country || "").toUpperCase();
  const resolvedLocale = resolveLocale(resolvedCountry);
  if (!resolvedLocale) {
    return { status: "error", reason: `unsupported_region:${resolvedCountry}` };
  }

  const fragmentId = PLAN_TO_MAS_FRAGMENT_ID[planId];
  if (!fragmentId) {
    return { status: "error", reason: `fragment_unavailable:${planId}` };
  }

  const url = `${MAS_FRAGMENT_ENDPOINT}?ids=${fragmentId}&locale=${resolvedLocale}`;
  try {
    const response = await (fetchImpl || fetch)(url);
    if (!response.ok) {
      return { status: "error", reason: `mas_upstream_error:${response.status}` };
    }
    const json = await response.json();
    const osi = extractOsi(json);
    if (!osi) {
      return { status: "error", reason: "osi_not_found_in_fragment" };
    }
    return { status: "ok", osi };
  } catch (e) {
    return { status: "error", reason: `fetch_failed:${e instanceof Error ? e.message : String(e)}` };
  }
}

export async function resolvePlanPrice(
  input: ResolvePriceInput,
  options: ResolvePriceOptions = {},
): Promise<RegionalPriceResult> {
  const country = (input.country || "").toUpperCase();
  const locale = resolveLocale(country, input.locale);
  if (!locale) {
    return unavailable(input.planId, country || "UNKNOWN", input.locale ?? "unknown", "unsupported_region");
  }

  const fragmentId = PLAN_TO_MAS_FRAGMENT_ID[input.planId];
  if (!fragmentId) {
    return unavailable(input.planId, country, locale, "fragment_unavailable");
  }

  const cacheKey = `${input.planId}|${country}|${locale}`;
  const now = Date.now();
  const existing = cache.get(cacheKey);
  if (existing && existing.expiresAt > now) {
    return existing.result;
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const storeAndReturn = (result: RegionalPriceResult) => {
    cache.set(cacheKey, { result, expiresAt: now + CACHE_TTL_MS });
    return result;
  };

  let fragmentResponse: Response;
  try {
    fragmentResponse = await fetchMasFragment(fragmentId, locale, fetchImpl, options.signal);
  } catch {
    return storeAndReturn(unavailable(input.planId, country, locale, "upstream_unavailable"));
  }

  if (!fragmentResponse.ok) {
    return storeAndReturn(
      unavailable(
        input.planId,
        country,
        locale,
        fragmentResponse.status === 404 ? "fragment_unavailable" : "upstream_unavailable",
      ),
    );
  }

  let fragmentJson: unknown;
  try {
    fragmentJson = await fragmentResponse.json();
  } catch {
    return storeAndReturn(unavailable(input.planId, country, locale, "contract_error"));
  }

  const osi = extractOsi(fragmentJson);
  if (!osi || !/^[A-Za-z0-9_-]{20,}$/.test(osi)) {
    return storeAndReturn(unavailable(input.planId, country, locale, "osi_unavailable"));
  }

  let pricingResponse: Response;
  try {
    pricingResponse = await fetchWcsOffer(osi, country, locale, fetchImpl, options.signal);
  } catch {
    return storeAndReturn(unavailable(input.planId, country, locale, "upstream_unavailable"));
  }

  if (!pricingResponse.ok) {
    return storeAndReturn(
      unavailable(
        input.planId,
        country,
        locale,
        pricingResponse.status === 404 ? "pricing_unavailable" : "upstream_unavailable",
      ),
    );
  }

  let pricingJson: unknown;
  try {
    pricingJson = await pricingResponse.json();
  } catch {
    return storeAndReturn(unavailable(input.planId, country, locale, "contract_error"));
  }

  const offers = (pricingJson as { resolvedOffers?: unknown })?.resolvedOffers;
  if (!Array.isArray(offers) || offers.length === 0 || !offers[0] || typeof offers[0] !== "object") {
    return storeAndReturn(unavailable(input.planId, country, locale, "pricing_unavailable"));
  }

  const offer = offers[0] as {
    analytics?: unknown;
    term?: unknown;
    priceDetails?: {
      price?: unknown;
      formatString?: unknown;
    };
    priceInfo?: {
      price?: unknown;
    };
  };
  const amount = offer.priceDetails?.price;
  const formattedPrice = offer.priceInfo?.price;
  const currency = parseCurrencyCode(offer.analytics, offer.priceDetails?.formatString);
  if (typeof amount !== "number" || !Number.isFinite(amount) || typeof formattedPrice !== "string" || !currency) {
    return storeAndReturn(unavailable(input.planId, country, locale, "contract_error"));
  }

  const result: RegionalPriceSuccess = {
    status: "ok",
    data: {
      planId: input.planId,
      country,
      locale,
      currency,
      amount,
      formattedPrice: decodeHtmlEntities(formattedPrice),
      billingPeriod: toBillingPeriod(offer.term),
      source: "live_regional_pricing",
      retrievedAt: nowIso(),
    },
  };
  return storeAndReturn(result);
}

export function clearRegionalPricingCache() {
  cache.clear();
}
