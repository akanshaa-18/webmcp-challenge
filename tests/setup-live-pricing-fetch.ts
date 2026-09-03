import { afterAll, beforeAll, beforeEach, vi } from "vitest";

const FRAGMENT_TO_OSI: Record<string, string> = {
  "2bee9d3e-55ae-4701-b946-44b32fa5d9fa": "A_mock_student_plan_osi_0000000000000001",
  "86248907-1cb6-4d1e-8b3f-a42dee95d9bc": "A_mock_photography_plan_osi_0000000000002",
  "2c5cd672-1db8-409c-96ff-46b1a1dfb7dc": "A_mock_all_apps_plan_osi_0000000000000003",
};

const PRICE_FIXTURES: Record<string, Record<string, { amount: number; currency: string; formattedPrice: string }>> = {
  A_mock_student_plan_osi_0000000000000001: {
    IN: { amount: 1599, currency: "INR", formattedPrice: "₹1,599.00" },
    US: { amount: 19.99, currency: "USD", formattedPrice: "US$19.99" },
  },
  A_mock_photography_plan_osi_0000000000002: {
    IN: { amount: 799, currency: "INR", formattedPrice: "₹799.00" },
    US: { amount: 9.99, currency: "USD", formattedPrice: "US$9.99" },
  },
  A_mock_all_apps_plan_osi_0000000000000003: {
    IN: { amount: 4599, currency: "INR", formattedPrice: "₹4,599.00" },
    US: { amount: 54.99, currency: "USD", formattedPrice: "US$54.99" },
  },
};

const mockFetch = vi.fn(async (input: RequestInfo | URL) => {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url);

  if (url.pathname === "/mas/io/fragment") {
    const fragmentId = url.searchParams.get("id");
    const locale = url.searchParams.get("locale");
    const apiKey = url.searchParams.get("api_key");
    if (!fragmentId || !locale || !apiKey) {
      return new Response("", { status: 400 });
    }
    if (apiKey !== "wcms-commerce-ims-ro-user-milo") {
      return new Response("", { status: 401 });
    }
    const osi = FRAGMENT_TO_OSI[fragmentId];
    if (!osi) {
      return new Response("", { status: 404 });
    }
    return new Response(
      JSON.stringify({
        id: fragmentId,
        fields: {
          osi,
          prices: { value: `<span is="inline-price" data-wcs-osi="${osi}"></span>` },
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  if (url.pathname === "/web_commerce_artifact") {
    const apiKey = url.searchParams.get("api_key");
    const osi = url.searchParams.get("offer_selector_ids");
    const country = (url.searchParams.get("country") ?? "").toUpperCase();
    if (apiKey !== "wcms-commerce-ims-ro-user-milo") {
      return new Response("", { status: 401 });
    }
    if (!osi || !country) {
      return new Response("", { status: 400 });
    }
    const fixture = PRICE_FIXTURES[osi]?.[country];
    if (!fixture) {
      return new Response("", { status: 404 });
    }
    return new Response(
      JSON.stringify({
        resolvedOffers: [
          {
            term: "MONTHLY",
            priceDetails: {
              price: fixture.amount,
              formatString: fixture.currency === "INR" ? "'&#8377;'#,##,##0.00" : "'US$'#,##0.00",
            },
            priceInfo: { price: fixture.formattedPrice },
            analytics: JSON.stringify({ currencyCode: fixture.currency }),
          },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response("", { status: 404 });
});

beforeAll(() => {
  vi.stubGlobal("fetch", mockFetch);
});

beforeEach(() => {
  mockFetch.mockClear();
});

afterAll(() => {
  vi.unstubAllGlobals();
});

