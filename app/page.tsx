// app/page.tsx
import { headers, cookies } from "next/headers";


// ---------- Types (match /api/recommendations) ----------
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

// ---------- "What's Next" (static) ----------
type UpcomingRelease = {
  brand: "Apple" | "Google" | "Samsung";
  model: string;
  expected: string; // e.g., "2025 · Q3"
  note?: string;
};

const UPCOMING_RELEASES: UpcomingRelease[] = [
  { brand: "Apple",   model: "iPhone 17",              expected: "2025 · Q3", note: "Typical September launch" },
  { brand: "Google",  model: "Pixel 10",               expected: "2025 · Q4", note: "Typical October launch" },
  { brand: "Samsung", model: "Galaxy S26 / S26 Ultra", expected: "2026 · Q1", note: "Typical Jan–Feb launch" },
];

// ---------- Server fetch ----------
// ---------- Server fetch ----------
// ---------- Server fetch ----------
import { headers } from "next/headers";

// ---------- Server fetch ----------
// ---------- Server fetch ----------
async function getRecommendations(): Promise<{ data: ApiPayload; error?: string }> {
  // Build absolute URL for the current request (works local + Vercel)
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const url = `${proto}://${host}/api/recommendations`;

  // Forward viewer cookies (includes Vercel protection cookie, if present)
  const cookieHeader = cookies().getAll().map(c => `${c.name}=${c.value}`).join("; ");

  // Optional: add protection bypass header if you set the env var in Vercel
  const hdrs: Record<string, string> = { cookie: cookieHeader };
  if (process.env.VERCEL_DEPLOYMENT_PROTECTION_BYPASS) {
    hdrs["x-vercel-protection-bypass"] =
      process.env.VERCEL_DEPLOYMENT_PROTECTION_BYPASS as string;
  }

  try {
    const res = await fetch(url, { cache: "no-store", headers: hdrs });
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


  // Forward the viewer's cookies (includes the protection cookie if present)
  const cookieHeader = cookies().getAll().map(c => `${c.name}=${c.value}`).join("; ");

  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        cookie: cookieHeader,
      },
    });

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


  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: process.env.VERCEL_DEPLOYMENT_PROTECTION_BYPASS
        ? { "x-vercel-protection-bypass": process.env.VERCEL_DEPLOYMENT_PROTECTION_BYPASS as string }
        : undefined,
    });

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

function readInt(params: Search | undefined, key: string, def: number, min = 1, max = 10): number {
  const raw = params?.[key];
  const v = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function isPolicy(rec: Recommendation): boolean {
  return rec.why.toLowerCase().startsWith("policy");
}

function selectPerPlatform(
  recs: Recommendation[],
  iosTarget: number,
  androidTarget: number
): { selected: Recommendation[]; iosCount: number; androidCount: number } {
  const iosAll = recs.filter((r) => r.platform === "iOS");
  const androidAll = recs.filter((r) => r.platform === "Android");

  const iosQueue = [...iosAll.filter(isPolicy), ...iosAll.filter((r) => !isPolicy(r))];
  const androidQueue = [...androidAll.filter(isPolicy), ...androidAll.filter((r) => !isPolicy(r))];

  const iosSel = iosQueue.splice(0, iosTarget);
  const andSel = androidQueue.splice(0, androidTarget);

  // No cross-fill; show what each platform has.
  const selected: Recommendation[] = [...iosSel, ...andSel];

  return { selected, iosCount: iosSel.length, androidCount: andSel.length };
}

// ---------- Page (default export) ----------
export default async function Page({
  searchParams,
}: {
  searchParams?: Search;
}) {
  // Defaults 4/4, user may request up to 10 each: ?ios=7&android=9
  const iosTarget = readInt(searchParams, "ios", 4, 1, 10);
  const androidTarget = readInt(searchParams, "android", 4, 1, 10);

  const { data, error } = await getRecommendations();
  const { selected, iosCount, androidCount } = selectPerPlatform(
    data.recommendations,
    iosTarget,
    androidTarget
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

      {error ? (
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
      ) : null}

      {/* Controls */}
      <form method="GET" style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <label htmlFor="ios" style={{ fontSize: 13, color: "#cbd5e1" }}>
          iOS (1–10):
        </label>
        <input
          id="ios"
          name="ios"
          type="number"
          min={1}
          max={10}
          defaultValue={iosTarget}
          style={{
            width: 70,
            padding: "6px 8px",
            borderRadius: 6,
            border: "1px solid #334155",
            background: "#111827",
            color: "#e5e7eb",
          }}
        />

        <label htmlFor="android" style={{ fontSize: 13, color: "#cbd5e1" }}>
          Android (1–10):
        </label>
        <input
          id="android"
          name="android"
          type="number"
          min={1}
          max={10}
          defaultValue={androidTarget}
          style={{
            width: 90,
            padding: "6px 8px",
            borderRadius: 6,
            border: "1px solid #334155",
            background: "#111827",
            color: "#e5e7eb",
          }}
        />

        <button
          type="submit"
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #334155",
            background: "#1f2937",
            color: "#e5e7eb",
            cursor: "pointer",
          }}
        >
          Apply
        </button>

        <div style={{ fontSize: 12, color: "#9ca3af" }}>
          Quick:{" "}
          <a href="?ios=4&android=4" style={{ color: "#93c5fd" }}>4/4</a>{" · "}
          <a href="?ios=5&android=5" style={{ color: "#93c5fd" }}>5/5</a>{" · "}
          <a href="?ios=10&android=10" style={{ color: "#93c5fd" }}>10/10</a>
        </div>
      </form>

      {/* Recommended devices */}
      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>Recommended Test Devices</h2>
        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>
          Confidence: <strong>{data.confidence.label.toUpperCase()}</strong> ({data.confidence.score})
          {" · "}Anchors updated {data.freshnessDays}d ago
          {" · "}Showing iOS {iosCount} / Android {androidCount} (requested iOS {iosTarget}, Android {androidTarget})
        </div>
        <table style={{ marginTop: 8, width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #374151", padding: 8 }}>Platform</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #374151", padding: 8 }}>Model</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #374151", padding: 8 }}>Why</th>
            </tr>
          </thead>
          <tbody>
            {selected.map((r, i) => (
              <tr key={`${r.platform}-${r.model}-${i}`}>
                <td style={{ padding: 8, borderBottom: "1px solid #262626" }}>{r.platform}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #262626", fontWeight: 600 }}>{r.model}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #262626" }}>{r.why}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 10 }}>
          <a href="/api/recommendations?format=csv" style={{ fontSize: 13, color: "#93c5fd", textDecoration: "underline" }}>
            Download CSV
          </a>
        </div>
      </section>

      {/* iPhone models */}
      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>Top iPhone Models (snapshot)</h2>
        <ul style={{ marginTop: 8, lineHeight: 1.8 }}>
          {data.iphoneModels.models.map((m) => (
            <li key={m.model}>
              {m.model}: {m.share}%
            </li>
          ))}
        </ul>
        <p style={{ marginTop: 6, fontSize: 12, color: "#9ca3af" }}>Month: {data.iphoneModels.month}</p>
      </section>

      {/* Vendor share */}
      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>US Vendor Share (snapshot)</h2>
        <table style={{ marginTop: 8, width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #374151", padding: 8 }}>Vendor</th>
              <th style={{ textAlign: "right", borderBottom: "1px solid #374151", padding: 8 }}>Share</th>
            </tr>
          </thead>
          <tbody>
            {data.vendorShare.vendors.map((v) => (
              <tr key={v.vendor}>
                <td style={{ padding: 8, borderBottom: "1px solid #262626" }}>{v.vendor}</td>
                <td style={{ padding: 8, textAlign: "right", borderBottom: "1px solid #262626" }}>
                  {v.share.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginTop: 6, fontSize: 12, color: "#9ca3af" }}>Month: {data.vendorShare.month}</p>
      </section>

      {/* What's Next */}
      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>What’s Next (upcoming releases)</h2>
        <table style={{ marginTop: 8, width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #374151", padding: 8 }}>Brand</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #374151", padding: 8 }}>Model</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #374151", padding: 8 }}>Expected</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #374151", padding: 8 }}>Note</th>
            </tr>
          </thead>
          <tbody>
            {UPCOMING_RELEASES.map((u, i) => (
              <tr key={`${u.brand}-${u.model}-${i}`}>
                <td style={{ padding: 8, borderBottom: "1px solid #262626" }}>{u.brand}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #262626", fontWeight: 600 }}>{u.model}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #262626" }}>{u.expected}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #262626" }}>{u.note ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginTop: 6, fontSize: 12, color: "#9ca3af" }}>
          Dates are indicative based on typical launch windows and may change.
        </p>
      </section>

      {/* Sources */}
      <section style={{ marginTop: 36 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>Sources & Methodology</h2>
        <ul style={{ marginTop: 8, lineHeight: 1.8 }}>
          <li>StatCounter – US mobile vendors (monthly snapshot)</li>
          <li>TelemetryDeck – iOS model popularity (opt-in telemetry)</li>
          <li>Apple / Samsung / Google official launch posts (release timing)</li>
          <li>Optional paid panels for higher confidence: Counterpoint, IDC, Canalys</li>
        </ul>
      </section>
    </main>
  );
}
