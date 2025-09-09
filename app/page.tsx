// app/page.tsx

// ---------- Types ----------
type IPhoneModel = { model: string; share: number };
type IPhoneModelsResp = { month: string; models: IPhoneModel[] };

type VendorShare = { vendor: string; share: number };
type VendorsResp = { month: string; vendors: VendorShare[] };

type Recommendation = {
  platform: "iOS" | "Android";
  model: string;
  why: string;
};

// ---------- Fallback data (used if an API fails) ----------
const FALLBACK_IPHONE: IPhoneModelsResp = {
  month: "2025-08",
  models: [
    { model: "iPhone 13", share: 16.03 },
    { model: "iPhone 15", share: 10.2 },
    { model: "iPhone 15 Pro", share: 10.0 },
  ],
};

const FALLBACK_VENDORS: VendorsResp = {
  month: "2025-08",
  vendors: [
    { vendor: "Apple", share: 57.24 },
    { vendor: "Samsung", share: 22.25 },
    { vendor: "Google", share: 6.21 },
    { vendor: "Motorola", share: 3.68 },
  ],
};

// ---------- Base URL helper (absolute URL for prod & dev) ----------
function getBaseUrl() {
  // Recommended: set NEXT_PUBLIC_SITE_URL in Vercel → Settings → Environment Variables
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

// ---------- Safe fetch helper (never throws) ----------
async function safeFetch<T>(path: string, fallback: T): Promise<{ data: T; error?: string }> {
  const url = `${getBaseUrl()}${path}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      const body = await res.text();
      return { data: fallback, error: `GET ${url} → ${res.status} ${body.slice(0, 120)}` };
    }
    const json = (await res.json()) as T;
    return { data: json };
  } catch (e) {
    return { data: fallback, error: `GET ${url} failed: ${String(e)}` };
  }
}

// ---------- Page ----------
export default async function Page() {
  const [iphoneR, vendorsR] = await Promise.all([
    safeFetch<IPhoneModelsResp>("/api/iphone-models", FALLBACK_IPHONE),
    safeFetch<VendorsResp>("/api/us-vendors", FALLBACK_VENDORS),
  ]);

  const iphone = iphoneR.data;
  const vendors = vendorsR.data;
  const errors = [iphoneR.error, vendorsR.error].filter(Boolean) as string[];

  // ===== Policy anchors =====
  const anchors = {
    // Latest standard devices (must-have)
    latestStandardIphone: "iPhone 16",
    latestStandardGalaxy: "Galaxy S25",

    // Last-year flagships (must-have)
    iphoneMaxPrevYear: "iPhone 15 Pro Max",
    galaxyUltraPrevYear: "Galaxy S24 Ultra",

    // Pixel policy
    pixelPrevGen: "Pixel 8",
    pixelCurrentGen: "Pixel 9", // optional for stock-Android coverage
  };

  // Build recommendations (policy first)
  const recommended: Recommendation[] = [
    { platform: "iOS",     model: anchors.latestStandardIphone,  why: "Policy: latest standard iPhone" },
    { platform: "Android", model: anchors.latestStandardGalaxy,  why: "Policy: latest standard Galaxy S" },
    { platform: "iOS",     model: anchors.iphoneMaxPrevYear,     why: "Policy: last year's iPhone Pro/Pro Max (Max model)" },
    { platform: "Android", model: anchors.galaxyUltraPrevYear,   why: "Policy: last year's Samsung Galaxy S Ultra" },
    { platform: "Android", model: anchors.pixelPrevGen,          why: "Policy: previous-generation Google Pixel" },
    { platform: "Android", model: anchors.pixelCurrentGen,       why: "Broaden Android coverage (stock Android)" },
  ];

  // Add popular iPhones from data (avoid duplicates)
  const seen = new Set<string>(recommended.map((d) => d.model));
  iphone.models.forEach((m) => {
    if (!seen.has(m.model)) {
      recommended.push({
        platform: "iOS",
        model: m.model,
        why: `Popular iPhone in US (~${m.share}%)`,
      });
      seen.add(m.model);
    }
  });

  return (
    <main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui", color: "#e5e7eb", background: "#0b0b0b" }}>
      <h1 style={{ fontSize: 28, fontWeight: 600, color: "#fff" }}>US Popular Phones — Test Device Picker</h1>

      {errors.length > 0 && (
        <div style={{
          marginTop: 16, padding: 12, borderRadius: 8,
          background: "#FEF3C7", color: "#78350F", border: "1px solid #FDE68A"
        }}>
          <strong>Note:</strong> Using fallback data because:
          <ul style={{ margin: "8px 0 0 20px" }}>
            {errors.map((e, i) => <li key={i} style={{ lineHeight: 1.4 }}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* Recommended devices (policy first) */}
      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>Recommended Test Devices</h2>
        <table style={{ marginTop: 8, width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #374151", padding: 8 }}>Platform</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #374151", padding: 8 }}>Model</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #374151", padding: 8 }}>Why</th>
            </tr>
          </thead>
          <tbody>
            {recommended.map((d, i) => (
              <tr key={`${d.model}-${i}`}>
                <td style={{ padding: 8, borderBottom: "1px solid #262626" }}>{d.platform}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #262626", fontWeight: 600 }}>{d.model}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #262626" }}>{d.why}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* iPhone data */}
      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>Top iPhone Models (snapshot)</h2>
        <ul style={{ marginTop: 8, lineHeight: 1.8 }}>
          {iphone.models.map((m) => (
            <li key={m.model}>
              {m.model}: {m.share}%
            </li>
          ))}
        </ul>
        <p style={{ marginTop: 6, fontSize: 12, color: "#9ca3af" }}>Source: /api/iphone-models</p>
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
            {vendors.vendors.map((v) => (
              <tr key={v.vendor}>
                <td style={{ padding: 8, borderBottom: "1px solid #262626" }}>{v.vendor}</td>
                <td style={{ padding: 8, textAlign: "right", borderBottom: "1px solid #262626" }}>
                  {v.share.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginTop: 6, fontSize: 12, color: "#9ca3af" }}>Source: /api/us-vendors</p>
      </section>

      {/* Sources & Methodology */}
      <section style={{ marginTop: 36 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>Sources & Methodology</h2>
        <ul style={{ marginTop: 8, lineHeight: 1.8 }}>
          <li>
            <strong>Policy rules:</strong> Always test on <em>latest standard iPhone</em> and <em>latest standard Galaxy S</em>, plus last year’s <em>iPhone Pro/Pro Max</em> and <em>Galaxy S Ultra</em>, and the <em>previous-generation Pixel</em>. These cover mainstream + high-end device classes likely to expose layout/perf issues early.
          </li>
          <li>
            <strong>Vendor share:</strong> StatCounter GlobalStats (US, mobile vendors). We snapshot monthly to provide iOS/Android vendor context.
          </li>
          <li>
            <strong>iPhone model usage:</strong> TelemetryDeck iOS device model charts (opt-in telemetry, directional popularity).
          </li>
          <li>
            <strong>Android model detail:</strong> Public, free model-level US data is limited; for high-confidence breakdowns, use paid panels (Counterpoint, IDC, Canalys) or your own GA4/Firebase/Mixpanel.
          </li>
        </ul>
      </section>
    </main>
  );
}
