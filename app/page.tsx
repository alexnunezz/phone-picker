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

// ---------- Safe fetch (returns fallback on error) ----------
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

// ---------- DEFAULT EXPORT: the page component ----------
export default async function Page() {
  const { data, error } = await getRecommendations();

  return (
    <main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui", color: "#e5e7eb", background: "#0b0b0b" }}>
      <h1 style={{ fontSize: 28, fontWeight: 600, color: "#fff" }}>
        US Popular Phones — Test Device Picker
      </h1>

      {error && (
        <div style={{
          marginTop: 16, padding: 12, borderRadius: 8,
          background: "#FEF3C7", color: "#78350F", border: "1px solid #FDE68A"
        }}>
          <strong>Note:</strong> Using fallback data because: {error}
        </div>
      )}

      {/* Recommended devices */}
      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>Recommended Test Devices</h2>
        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>
          Confidence: <strong>{data.confidence.label.toUpperCase()}</strong> ({data.confidence.score})
          {" · "}Anchors updated {data.freshnessDays}d ago
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
            {data.recommendations.map((r, i) => (
              <tr key={`${r.model}-${i}`}>
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
        <p style={{ marginTop: 6, fontSize: 12, color: "#9ca3af" }}>
          Month: {data.iphoneModels.month}
        </p>
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
        <p style={{ marginTop: 6, fontSize: 12, color: "#9ca3af" }}>
          Month: {data.vendorShare.month}
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
