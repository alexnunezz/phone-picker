// app/page.tsx

// ---------- Types matching /api/recommendations ----------
type Recommendation = { platform: "iOS" | "Android"; model: string; why: string };
type IPhoneModel = { model: string; share: number };
type VendorShare = { vendor: string; share: number };
type ApiPayload = {
  anchors: {
    latestStandardIphone: string;
    latestStandardGalaxy: string;
    iphoneMaxPrevYear: string;
    galaxyUltraPrevYear: string;
    pixelPrevGen: string;
    pixelCurrentGen?: string;
    updatedAt: string; // ISO
  };
  recommendations: Recommendation[];
  iphoneModels: { month: string; models: IPhoneModel[] };
  vendorShare: { month: string; vendors: VendorShare[] };
  sources: { label: string; url: string; note?: string }[];
  confidence: { score: number; label: "high" | "medium" | "low" };
  freshnessDays: number;
};

// ---------- Base URL helper (works on Vercel & locally) ----------
function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

// ---------- Fallback payload (if API fails) ----------
const FALLBACK: ApiPayload = {
  anchors: {
    latestStandardIphone: "iPhone 16",
    latestStandardGalaxy: "Galaxy S25",
    iphoneMaxPrevYear: "iPhone 15 Pro Max",
    galaxyUltraPrevYear: "Galaxy S24 Ultra",
    pixelPrevGen: "Pixel 8",
    pixelCurrentGen: "Pixel 9",
    updatedAt: new Date().toISOString(),
  },
  recommendations: [
    { platform: "iOS", model: "iPhone 16", why: "Policy: latest standard iPhone" },
    { platform: "Android", model: "Galaxy S25", why: "Policy: latest standard Galaxy S" },
    { platform: "iOS", model: "iPhone 15 Pro Max", why: "Policy: last year's iPhone Pro/Pro Max" },
    { platform: "Android", model: "Galaxy S24 Ultra", why: "Policy: last year's Samsung Galaxy S Ultra" },
    { platform: "Android", model: "Pixel 8", why: "Policy: previous-generation Google Pixel" },
    { platform: "Android", model: "Pixel 9", why: "Broaden Android coverage (stock Android)" },
    { platform: "iOS", model: "iPhone 13", why: "Popular iPhone in US (~16.03%)" },
    { platform: "iOS", model: "iPhone 15", why: "Popular iPhone in US (~10.2%)" },
    { platform: "iOS", model: "iPhone 15 Pro", why: "Popular iPhone in US (~10%)" },
  ],
  iphoneModels: {
    month: "2025-08",
    models: [
      { model: "iPhone 13", share: 16.03 },
      { model: "iPhone 15", share: 10.2 },
      { model: "iPhone 15 Pro", share: 10.0 },
    ],
  },
  vendorShare: {
    month: "2025-08",
    vendors: [
      { vendor: "Apple", share: 57.24 },
      { vendor: "Samsung", share: 22.25 },
      { vendor: "Google", share: 6.21 },
      { vendor: "Motorola", share: 3.68 },
    ],
  },
  sources: [],
  confidence: { score: 70, label: "medium" },
  freshnessDays: 0,
};

async function getRecommendations(): Promise<{ data: ApiPayload; error?: string }> {
  const url = `${getBaseUrl()}/api/recommendations`;
  try {
