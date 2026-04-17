import { describe, expect, it, vi } from "vitest";

import { buildExpediaRapidAuthorizationHeader, createExpediaRapidBookingProvider } from "./index";

describe("expedia rapid provider", () => {
  it("builds the official signature-auth header format", () => {
    expect(
      buildExpediaRapidAuthorizationHeader({
        apiKey: "rapid-key",
        sharedSecret: "shared-secret",
        timestamp: 1_700_000_000,
      }),
    ).toBe(
      "EAN APIKey=rapid-key,Signature=641f3babef6d33a352ed59b23bffa719cd5158738ba60d9641fb1901906d08b2520e300bc0e10b6e616cd4857e157d47d55c7603ad5424dac2f2cf26a9946cde,timestamp=1700000000",
    );
  });

  it("loads region property ids from a curated geography mapping", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "179898",
          property_ids_expanded: [{ property_id: "1" }, { property_id: "2" }, { property_id: "2" }],
        }),
      ),
    );
    const provider = createExpediaRapidBookingProvider({
      env: {
        EXPEDIA_RAPID_API_KEY: "rapid-key",
        EXPEDIA_RAPID_SHARED_SECRET: "shared-secret",
        EXPEDIA_RAPID_BASE_URL: "https://test.ean.com",
      },
      fetchImpl,
      now: () => 1_700_000_000_000,
    });

    await expect(provider.listRegionPropertyIds("179898", { limit: 1 })).resolves.toEqual(["1"]);

    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/v3/regions/179898?");
    expect(url).toContain("include=property_ids");
    expect(url).toContain("include=property_ids_expanded");
    expect(init.headers).toMatchObject({
      Accept: "application/json",
      "Accept-Encoding": "gzip",
    });
  });

  it("normalizes property catalog records", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          "1337": {
            property_id: "1337",
            name: "Hyatt Regency Paris Etoile",
            address: {
              line_1: "3 Place du General Koenig",
              city: "Paris",
              country_code: "FR",
            },
            images: {
              property_image: [
                {
                  links: {
                    hero_image: {
                      href: "https://images.example.test/1337.jpg",
                    },
                  },
                },
              ],
            },
            ratings: {
              property: {
                rating: 4,
              },
              guest: {
                overall: 8.7,
              },
            },
            amenities: {
              "1": {
                id: "1",
                name: "Concierge services",
              },
            },
          },
        }),
      ),
    );
    const provider = createExpediaRapidBookingProvider({
      env: {
        EXPEDIA_RAPID_API_KEY: "rapid-key",
        EXPEDIA_RAPID_SHARED_SECRET: "shared-secret",
        EXPEDIA_RAPID_BASE_URL: "https://test.ean.com",
      },
      fetchImpl,
    });

    await expect(provider.loadPropertyCatalog(["1337"])).resolves.toEqual({
      "1337": {
        propertyId: "1337",
        propertyName: "Hyatt Regency Paris Etoile",
        imageUrl: "https://images.example.test/1337.jpg",
        addressLine1: "3 Place du General Koenig",
        city: "Paris",
        countryCode: "FR",
        starRating: 4,
        reviewScore: 8.7,
        amenities: ["Concierge services"],
      },
    });
  });

  it("builds a mobile-app availability request and normalizes rates", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            property_id: "19248",
            score: 10052,
            rooms: [
              {
                id: "123abc",
                room_name: "Fancy Queen Room",
                rates: [
                  {
                    id: "333abc",
                    current_refundability: "partially_refundable",
                    cancel_penalties: [
                      {
                        start: "2026-05-08",
                      },
                    ],
                    occupancy_pricing: {
                      "2": {
                        nightly: [
                          {
                            inclusive: {
                              billable_currency: {
                                value: "180.00",
                                currency: "USD",
                              },
                            },
                          },
                        ],
                        totals: {
                          inclusive: {
                            billable_currency: {
                              value: "540.00",
                              currency: "USD",
                            },
                          },
                        },
                      },
                    },
                  },
                ],
              },
            ],
          },
        ]),
      ),
    );
    const provider = createExpediaRapidBookingProvider({
      env: {
        EXPEDIA_RAPID_API_KEY: "rapid-key",
        EXPEDIA_RAPID_SHARED_SECRET: "shared-secret",
        EXPEDIA_RAPID_BASE_URL: "https://test.ean.com",
      },
      fetchImpl,
    });

    await expect(
      provider.searchAvailability({
        propertyIds: ["19248"],
        checkin: "2026-05-02",
        checkout: "2026-05-05",
        adults: 2,
      }),
    ).resolves.toEqual([
      {
        propertyId: "19248",
        offers: [
          expect.objectContaining({
            roomId: "123abc",
            rateId: "333abc",
            roomName: "Fancy Queen Room",
            totalPrice: 540,
            nightlyPrice: 180,
            currency: "USD",
            currentRefundability: "partially_refundable",
            cancellationSummary: "Partially refundable until 2026-05-08",
            propertyScore: 10052,
          }),
        ],
      },
    ]);

    const [url] = fetchImpl.mock.calls[0] as [string];
    expect(url).toContain("/v3/properties/availability?");
    expect(url).toContain("sales_channel=mobile_app");
    expect(url).toContain("sales_environment=hotel_only");
    expect(url).toContain("travel_purpose=leisure");
    expect(url).toContain("property_id=19248");
    expect(url).toContain("occupancy=2");
  });
});
