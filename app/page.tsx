// app/page.tsx

// ---------- Types matching /api/recommendations ----------
type Platform = "iOS" | "Android";

type Recommendation = {
  platform: Platform;
  model: string;
  why: string;
};

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
function getBaseUrl(): string {
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

// ---------- Data fetch ----------
async function getRecommendations(): Promise<{ data: ApiPayload; error?: string }> {
  const url = `${getBaseUrl()}/api/recommendations`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      const body = await res.text();
      return { data: FALLBACK, error: `GET ${url} → ${res.status} ${body.slice(0, 120)}` };
    }
    const json = (await res.json()) as ApiPayload;
    return { data: json };
  } catch (e) {
    return { data: FALLBACK, error: `GET ${url} failed: ${String(e)}` };
  }
}

// ---------- Helpers ----------
type Search = Record<string, string | string[] | undefined>;

function readTotal(params?: Search): number {
  const raw = params?.total;
  const v = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(v);
  if (!Number.isFinite(n)) return 8; // default total
  return Math.max(8, Math.min(10, Math.floor(n))); // clamp 8..10
}

function isPolicy(rec: Recommendation): boolean {
  return rec.why.toLowerCase().startsWith("policy");
}

function pickByPlatform(
  recs: Recommendation[],
  total: number,
  iosBase: number,
  androidBase: number
): { selected: Recommendation[]; iosCount: number; androidCount: number } {
  const iosAll = recs.filter((r) => r.platform === "iOS");
  const androidAll = recs.filter((r) => r.platform === "Android");

  const iosQueue = [...iosAll.filter(isPolicy), ...iosAll.filter((r) => !isPolicy(r))];
  const androidQueue = [...androidAll.filter(isPolicy), ...androidAll.filter((r) => !isPolicy(r))];

  // Base: 4 + 4
  let iosTarget = iosBase;
  let androidTarget = androidBase;

  // Distribute extras: total 9 => 5+4, total 10 => 5+5
  const extra = total - (iosBase + androidBase);
  if (extra > 0) iosTarget += 1;
  if (extra > 1) androidTarget += 1;

  const iosSel = iosQueue.splice(0, iosTarget);
  const andSel = androidQueue.splice(0, androidTarget);

  const selected: Recommendation[] = [...iosSel, ...andSel];

  // Fill remaining if we still haven't reached total
  while (selected.length < total && (iosQueue.length || androidQueue.length)) {
    if (iosQueue.length) selected.push(iosQueue.shift()!);
    if (selected.length >= total) break;
    if (androidQueue.length) selected.push(androidQueue.shift()!);
  }

  return { selected, iosCount: iosSel.length, androidCount: andSel.length };
}

// ---------- DEFAULT EXPORT: the page component ----------
export default async function Page({
  searchParams,
}: {
  searchParams?: Search;
}) {
  const total = readTotal(searchParams);
  const { data, error } = await getRecommendations();

  const { selected, iosCount, androidCount } = pickByPlatform(
    data.recommendations,
    total,
    /* iosBase */ 4,
    /* androidBase */ 4
  );

  return (
  <main
    style={{
      padding: 24,
      fontFamily: "ui-sans-serif, system-ui",
      color: "#e5e7eb",
      background: "#0b0b0b",
    }}
  >
    <h1 style={{ fontSize: 28, fontWeight: 600, color: "#fff" }}>
      US Popular Phones — Test Device Picker
    </h1>

    {error && (
      <div
        style={{
          marginTop: 16,
          padding: 12,
          borderRadius: 8,
          background: "#FEF3C7",
          color: "#78350F",
          border: "1px solid #FDE68A",
        }}
      >
        <strong>Note:</strong> Using fallback data because: {error}
      </div>
    )}

    {/* …keep the rest of the sections exactly as in the file I sent (Controls, Recommended table, iPhone/Vendor sections, Sources)… */}

  </main>
);

