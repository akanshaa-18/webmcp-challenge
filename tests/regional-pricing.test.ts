import { describe, expect, it } from "vitest";
import { clearRegionalPricingCache, resolvePlanPrice } from "@/lib/regional-pricing";

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("regional pricing provider", () => {
  it("resolves IN and US prices from MAS->WCS without conversion", async () => {
    clearRegionalPricingCache();
    const fetchImpl = async (input: RequestInfo | URL) => {
      const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url);
      if (url.pathname === "/mas/io/fragment") {
        return jsonResponse({ fields: { osi: "A_mock_osi_12345678901234567890" } });
      }
      if (url.pathname === "/web_commerce_artifact") {
        const country = url.searchParams.get("country");
        if (country === "IN") {
          return jsonResponse({
            resolvedOffers: [
              {
                term: "MONTHLY",
                priceDetails: { price: 1834.9 },
                priceInfo: { price: "&#8377;1,834.90" },
                analytics: "{\"currencyCode\":\"INR\"}",
              },
            ],
          });
        }
        return jsonResponse({
          resolvedOffers: [
            {
              term: "MONTHLY",
              priceDetails: { price: 22.99 },
              priceInfo: { price: "US$22.99" },
              analytics: "{\"currencyCode\":\"USD\"}",
            },
          ],
        });
      }
      return new Response("", { status: 404 });
    };

    const inPrice = await resolvePlanPrice(
      { planId: "adobe-student-cc-in", country: "IN" },
      { fetchImpl },
    );
    expect(inPrice.status).toBe("ok");
    if (inPrice.status === "ok") {
      expect(inPrice.data.currency).toBe("INR");
      expect(inPrice.data.amount).toBe(1834.9);
      expect(inPrice.data.formattedPrice).toBe("₹1,834.90");
    }

    const usPrice = await resolvePlanPrice(
      { planId: "adobe-student-cc-in", country: "US" },
      { fetchImpl },
    );
    expect(usPrice.status).toBe("ok");
    if (usPrice.status === "ok") {
      expect(usPrice.data.currency).toBe("USD");
      expect(usPrice.data.amount).toBe(22.99);
      expect(usPrice.data.formattedPrice).toBe("US$22.99");
    }
  });

  it("returns explicit failure when fragment is unavailable", async () => {
    clearRegionalPricingCache();
    const result = await resolvePlanPrice(
      { planId: "adobe-student-cc-in", country: "IN" },
      {
        fetchImpl: async (input: RequestInfo | URL) => {
          const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url);
          if (url.pathname === "/mas/io/fragment") {
            return new Response("", { status: 404 });
          }
          return new Response("", { status: 500 });
        },
      },
    );
    expect(result.status).toBe("price_unavailable");
    if (result.status === "price_unavailable") {
      expect(result.data.reason).toBe("fragment_unavailable");
    }
  });

  it("returns explicit failure when OSI is missing", async () => {
    clearRegionalPricingCache();
    const result = await resolvePlanPrice(
      { planId: "adobe-student-cc-in", country: "IN" },
      {
        fetchImpl: async (input: RequestInfo | URL) => {
          const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url);
          if (url.pathname === "/mas/io/fragment") {
            return jsonResponse({ fields: {} });
          }
          return jsonResponse({ resolvedOffers: [] });
        },
      },
    );
    expect(result.status).toBe("price_unavailable");
    if (result.status === "price_unavailable") {
      expect(result.data.reason).toBe("osi_unavailable");
    }
  });

  it("returns explicit failure for unavailable or malformed pricing response", async () => {
    clearRegionalPricingCache();
    const unavailable = await resolvePlanPrice(
      { planId: "adobe-student-cc-in", country: "IN" },
      {
        fetchImpl: async (input: RequestInfo | URL) => {
          const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url);
          if (url.pathname === "/mas/io/fragment") {
            return jsonResponse({ fields: { osi: "A_mock_osi_12345678901234567890" } });
          }
          return new Response("", { status: 503 });
        },
      },
    );
    expect(unavailable.status).toBe("price_unavailable");
    if (unavailable.status === "price_unavailable") {
      expect(unavailable.data.reason).toBe("upstream_unavailable");
    }

    clearRegionalPricingCache();
    const malformed = await resolvePlanPrice(
      { planId: "adobe-student-cc-in", country: "IN" },
      {
        fetchImpl: async (input: RequestInfo | URL) => {
          const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url);
          if (url.pathname === "/mas/io/fragment") {
            return jsonResponse({ fields: { osi: "A_mock_osi_12345678901234567890" } });
          }
          return jsonResponse({ resolvedOffers: [{ priceDetails: {}, priceInfo: {} }] });
        },
      },
    );
    expect(malformed.status).toBe("price_unavailable");
    if (malformed.status === "price_unavailable") {
      expect(malformed.data.reason).toBe("contract_error");
    }
  });
});

