// app/api/recommendations/route.ts

// ---------- Types ----------
type IPhoneModel = { model: string; share: number };
type VendorShare = { vendor: string; share: number };
type Recommendation = { platform: "iOS" | "Android"; model: string; why: string };

type Anchors = {
  // Your rules (latest standard + last-year flagships + Pixel)
  latestStandardIphone: string;
  latestStandardGalaxy: string;
  iphoneMaxPrevYear: string;
  galaxyUltraPrevYear: string;
  pixelPrevGen: string;
  pixelCurrentGen?: string;
  updatedAt: string; // ISO
};

type ApiPayload = {
  anchors: Anchors;
  recommendations: Recommendation[];
  iphoneModels: { month: string; models: IPhoneModel[] };
  vendorShare: { month: string; vendors: VendorShare[] };
  sources: { label: string; url: string; note?: string }[];
  confidence: { score: number; label: "high" | "medium" | "low" };
  freshnessDays: number; // days since anchors.updatedAt
};

// ---------- Static snapshots (you can swap to real feeds later) ----------
const IPHONE_MODELS: { month: string; models: IPhoneModel[] } = {
  month: "2025-08",
  models: [
    { model: "iPhone 13", share: 16.03 },
    { model: "iPhone 15", share: 10.2 },
    { model: "iPhone 15 Pro", share: 10.0 },
  ],
};

const VENDOR_SHARE: { month: string; vendors: VendorShare[] } = {
  month: "2025-08",
  vendors: [
    { vendor: "Apple",    share: 57.24 },
    { vendor: "Samsung",  share: 22.25 },
    { vendor: "Google",   share: 6.21  },
    { vendor: "Motorola", share: 3.68  },
  ],
};

// ---------- Policy anchors (single source of truth) ----------
const ANCHORS: Anchors = {
  // Must-have: latest standard models
  latestStandardIphone: "iPhone 16",
  latestStandardGalaxy: "Galaxy S25",

  // Must-have: last-year flagships
  iphoneMaxPrevYear: "iPhone 15 Pro Max",
  galaxyUltraPrevYear: "Galaxy S24 Ultra",

  // Pixel policy
  pixelPrevGen: "Pixel 8",
  pixelCurrentGen: "Pixel 9",

  updatedAt: "2025-08-15T00:00:00.000Z",
};

// ---------- Helpers ----------
function buildRecommendations(anchors: Anchors, iphone: IPhoneModel[]): Recommendation[] {
  const recs: Recommendation[] = [
    { platform: "iOS",     model: anchors.latestStandardIphone,  why: "Policy: latest standard iPhone" },
    { platform: "Android", model: anchors.latestStandardGalaxy,  why: "Policy: latest standard Galaxy S" },
    { platform: "iOS",     model: anchors.iphoneMaxPrevYear,     why: "Policy: last year's iPhone Pro/Pro Max (Max model)" },
    { platform: "Android", model: anchors.galaxyUltraPrevYear,   why: "Policy: last year's Samsung Galaxy S Ultra" },
    { platform: "Android", model: anchors.pixelPrevGen,          why: "Policy: previous-generation Google Pixel" },
  ];

  if (anchors.pixelCurrentGen) {
    recs.push({ platform: "Android", model: anchors.pixelCurrentGen, why: "Broaden Android coverage (stock Android)" });
  }

  // Add popular iPhones from snapshot (avoid duplicates)
  const seen = new Set(recs.map(r => r.model));
  for (const m of iphone) {
    if (!seen.has(m.model)) {
      recs.push({ platform: "iOS", model: m.model, why: `Popular iPhone in US (~${m.share}%)` });
      seen.add(m.model);
    }
  }
  return recs;
}

function daysSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 86_400_000));
}

function confidenceScore(): { score: number; label: "high" | "medium" | "low" } {
  // We’re using public aggregators here (no 1P/paid panels), so call it Medium.
  return { score: 70, label: "medium" };
}

function toCsv(rows: string[][]): string {
  return rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(",")).join("\r\n");
}

// ---------- Handler ----------
export async function GET(request: Request) {
  // Build unified payload
  const recommendations = buildRecommendations(ANCHORS, IPHONE_MODELS.models);
  const payload: ApiPayload = {
    anchors: ANCHORS,
    recommendations,
    iphoneModels: IPHONE_MODELS,
    vendorShare: VENDOR_SHARE,
    sources: [
      { label: "StatCounter – US mobile vendors", url: "https://gs.statcounter.com/vendor-market-share/mobile/united-states-of-america", note: "Monthly vendor share snapshot" },
      { label: "TelemetryDeck – iOS device models", url: "https://telemetrydeck.com", note: "Directional popularity from opt-in telemetry" },
      { label: "Apple Newsroom – iPhone launches", url: "https://www.apple.com/newsroom/", note: "Release timing & specs" },
      { label: "Samsung Newsroom – Galaxy S launches", url: "https://news.samsung.com/global/", note: "Release timing & specs" },
      { label: "Google – Pixel releases", url: "https://blog.google/products/pixel/", note: "Release timing & specs" },
      // Paid panels that many retailers rely on:
      { label: "Counterpoint Research", url: "https://www.counterpointresearch.com" },
      { label: "IDC", url: "https://www.idc.com" },
      { label: "Canalys", url: "https://www.canalys.com" },
    ],
    confidence: confidenceScore(),
    freshnessDays: daysSince(ANCHORS.updatedAt),
  };

  // Format switching
  const { searchParams } = new URL(request.url);
  const wantsCsv = searchParams.get("format") === "csv" ||
                   (request.headers.get("accept") || "").includes("text/csv");

  if (wantsCsv) {
    const rows = [
      ["Platform", "Model", "Why"],
      ...payload.recommendations.map(r => [r.platform, r.model, r.why]),
    ];
    const csv = toCsv(rows);
    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="recommended_devices.csv"',
        "access-control-allow-origin": "*",
        "cache-control": "no-store",
      },
    });
  }

  return new Response(JSON.stringify(payload), {
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "cache-control": "no-store",
    },
  });
}
