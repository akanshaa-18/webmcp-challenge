const PUBLIC_API_KEY = "wcms-commerce-ims-ro-user-milo";
const MAS_FRAGMENT_ENDPOINT = "https://www.adobe.com/mas/io/fragment";
const WCS_ENDPOINT = "https://www.adobe.com/web_commerce_artifact";

const planToFragment = {
  "adobe-student-cc-in": "2bee9d3e-55ae-4701-b946-44b32fa5d9fa",
};

const countryToLocale = {
  IN: "en_IN",
  US: "en_US",
};

function decodeHtmlEntities(text) {
  return text
    .replaceAll("&#8377;", "₹")
    .replaceAll("&euro;", "€")
    .replaceAll("&pound;", "£")
    .replaceAll("&yen;", "¥")
    .replaceAll("&amp;", "&")
    .replaceAll("&nbsp;", " ");
}

async function resolvePrice(planId, country) {
  const fragmentId = planToFragment[planId];
  const locale = countryToLocale[country];
  if (!fragmentId || !locale) {
    throw new Error(`Unsupported plan/country combo: ${planId}/${country}`);
  }

  const fragmentUrl = new URL(MAS_FRAGMENT_ENDPOINT);
  fragmentUrl.searchParams.set("id", fragmentId);
  fragmentUrl.searchParams.set("locale", locale);
  fragmentUrl.searchParams.set("api_key", PUBLIC_API_KEY);

  const fragmentResponse = await fetch(fragmentUrl);
  if (!fragmentResponse.ok) {
    throw new Error(`Fragment lookup failed (${fragmentResponse.status})`);
  }
  const fragmentJson = await fragmentResponse.json();
  const osi = fragmentJson?.fields?.osi;
  if (!osi) {
    throw new Error("Fragment response missing OSI");
  }

  const wcsUrl = new URL(WCS_ENDPOINT);
  wcsUrl.searchParams.set("offer_selector_ids", osi);
  wcsUrl.searchParams.set("country", country);
  wcsUrl.searchParams.set("locale", locale);
  wcsUrl.searchParams.set("landscape", "PUBLISHED");
  wcsUrl.searchParams.set("api_key", PUBLIC_API_KEY);
  wcsUrl.searchParams.set("language", "MULT");

  const wcsResponse = await fetch(wcsUrl);
  if (!wcsResponse.ok) {
    throw new Error(`Pricing lookup failed (${wcsResponse.status})`);
  }
  const wcsJson = await wcsResponse.json();
  const offer = wcsJson?.resolvedOffers?.[0];
  if (!offer?.priceDetails?.price || !offer?.priceInfo?.price) {
    throw new Error("Pricing response missing expected fields");
  }
  const analytics = typeof offer.analytics === "string" ? JSON.parse(offer.analytics) : {};

  return {
    planId,
    country,
    locale,
    amount: offer.priceDetails.price,
    currency: analytics.currencyCode ?? "UNKNOWN",
    formattedPrice: decodeHtmlEntities(offer.priceInfo.price),
  };
}

async function main() {
  const regions = ["IN", "US"];
  for (const country of regions) {
    const result = await resolvePrice("adobe-student-cc-in", country);
    console.log(JSON.stringify(result));
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

