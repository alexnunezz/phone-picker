// app/api/recommendations/route.ts

// ---------- Types ----------
type IPhoneModel = { model: string; share: number };
type VendorShare = { vendor: string; share: number };
type Recommendation = { platform: "iOS" | "Android"; model: string; why: string };

type Anchors = {
  latestStandardIphone: string;
  latestStandardGalaxy: string;
  iphoneMaxPrevYear: string;
  galaxyUltraPrevYear: string;
  pixelPrevGen: string;
  pixelCurrentGen?: string;
  updatedAt: string;
};

type ApiPayload = {
  anchors: Anchors;
  recommendations: Recommendation[];
  iphoneModels: { month: string; models: IPhoneModel[] };
  vendorShare: { month: string; vendors: VendorShare[] };
  sources: { label: string; url: string; note?: string }[];
  confidence: { score: number; label: "high" | "medium" | "low" };
  freshnessDays: number;
};

// ---------- Static data ----------
const IPHONE_MODELS: ApiPayload["iphoneModels"] = {
  month: "2025-08",
  models: [
    { model: "iPhone 13", share: 16.03 },
    { model: "iPhone 15", share: 10.2 },
    { model: "iPhone 15 Pro", share: 10.0 },
  ],
};

const VENDOR_SHARE: ApiPayload["vendorShare"] = {
  month: "2025-08",
  vendors: [
    { vendor: "Apple", share: 57.24 },
    { vendor: "Samsung", share: 22.25 },
    { vendor: "Google", share: 6.21 },
    { vendor: "Motorola", share: 3.68 },
  ],
};

const ANCHORS: Anchors = {
  latestStandardIphone: "iPhone 16",
  latestStandardGalaxy: "Galaxy S25",
  iphoneMaxPrevYear: "iPhone 15 Pro Max",
  galaxyUltraPrevYear: "Galaxy S24 Ultra",
  pixelPrevGen: "Pixel 8",
  pixelCurrentGen: "Pixel 9",
  updatedAt: "2025-08-15T00:00:00.000Z",
};

// ---------- Helpers ----------
function daysSince(iso: string) {
  return Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 86_400_000));
}

function buildRecommendations(a: Anchors, iphone: IPhoneModel[]): Recommendation[] {
  const base: Recommendation[] = [
    { platform: "iOS",     model: a.latestStandardIphone,  why: "Policy: latest standard iPhone" },
    { platform: "Android", model: a.latestStandardGalaxy,  why: "Policy: latest standard Galaxy S" },
    { platform: "iOS",     model: a.iphoneMaxPrevYear,     why: "Policy: last year's iPhone Pro/Pro Max" },
    { platform: "Android", model: a.galaxyUltraPrevYear,   why: "Policy: last year's Samsung Galaxy S Ultra" },
    { platform: "Android", model: a.pixelPrevGen,          why: "Policy: previous-generation Google Pixel" },
  ];
  if (a.pixelCurrentGen) {
    base.push({ platform: "Android", model: a.pixelCurrentGen, why: "Broaden Android coverage (stock Android)" });
  }

  const seen = new Set(base.map(r => r.model));
  for (const m of iphone) {
    if (!seen.has(m.model)) {
      base.push({ platform: "iOS", model: m.model, why: `Popular iPhone in US (~${m.share}%)` });
      seen.add(m.model);
    }
  }
  return base;
}

// ---------- GET handler ----------
export async function GET(req: Request) {
  const payload: ApiPayload = {
    anchors: ANCHORS,
    recommendations: buildRecommendations(ANCHORS, IPHONE_MODELS.models),
    iphoneModels: IPHONE_MODELS,
    vendorShare: VENDOR_SHARE,
    sources: [
      {
        label: "StatCounter – US mobile vendors",
        url: "https://gs.statcounter.com/vendor-market-share/mobile/united-states-of-america",
      },
      { label: "TelemetryDeck – iOS model popularity", url: "https://telemetrydeck.com" },
      { label: "Apple Newsroom – iPhone launches", url: "https://www.apple.com/newsroom/" },
      { label: "Samsung Newsroom – Galaxy launches", url: "https://news.samsung.com/global/" },
      { label: "Google – Pixel releases", url: "https://blog.google/products/pixel/" },
      { label: "Counterpoint Research", url: "https://www.counterpointresearch.com" },
      { label: "IDC", url: "https://www.idc.com" },
      { label: "Canalys", url: "https://www.canalys.com" },
    ],
    confidence: { score: 70, label: "medium" },
    freshnessDays: daysSince(ANCHORS.updatedAt),
  };

  const url = new URL(req.url);
  const wantsCsv =
    url.searchParams.get("format") === "csv" ||
    (req.headers.get("accept") || "").includes("text/csv");

  if (wantsCsv) {
    const rows = [
      ["Platform", "Model", "Why"],
      ...payload.recommendations.map(r => [r.platform, r.model, r.why]),
    ];
    const csv = rows
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");

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
