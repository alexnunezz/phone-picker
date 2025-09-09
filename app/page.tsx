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

// ---------- Safe fetch helper (never throws) ----------
async function safeFetch<T>(path: string, fallback: T): Promise<{ data: T; error?: string }> {
  try {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) {
      const body = await res.text();
      return { data: fallback, error: `GET ${path} → ${res.status} ${body.slice(0, 120)}` };
    }
    const json = (await res.json()) as T;
    return { data: json };
  } catch (e) {
    return { data: fallback, error: `GET ${path} failed: ${String(e)}` };
  }
}

// ---------- Page ----------
export default async function Page() {
  // Use *relative* paths so this works locally and on Vercel
  const [iphoneR, vendorsR] = await Promise.all([
    safeFetch<IPhoneModelsResp>("/api/iphone-models", FALLBACK_IPHONE),
    safeFetch<VendorsResp>("/api/us-vendors", FALLBACK_VENDORS),
  ]);

  const iphone = iphoneR.data;
  const vendors = vendorsR.data;
  const errors = [iphoneR.error, vendorsR.error].filter(Boolean) as string[];

  // Policy anchors (edit when new models launch)
  const anchors = {
    latestIphone: "iPhone 16",
    latestGalaxy: "Galaxy S25",
    previousPixel: "Pixel 8",
    currentPixel: "Pixel 9",
  };

  // Build recommendations
  const recommended: Recommendation[] = [
    { platform: "iOS",     model: anchors.latestIphone,  why: "Always support latest standard iPhone" },
    { platform: "Android", model: anchors.latestGalaxy,  why: "Always support latest standard Galaxy S" },
    { platform: "Android", model: anchors.previousPixel, why: "Always support previous-gen Pixel" },
    { platform: "Android", model: anchors.currentPixel,  why: "Broaden Android coverage (stock Android)" },
  ];

  // Add popular iPhones (avoid duplicates)
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
    <main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui" }}>
      <h1 style={{ fontSize: 28, fontWeight: 600 }}>US Popular Phones — Test Device Picker</h1>

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

      {/* Recommended devices */}
      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Recommended Test Devices</h2>
        <table style={{ marginTop: 8, width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 8 }}>Platform</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 8 }}>Model</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 8 }}>Why</th>
            </tr>
          </thead>
          <tbody>
            {recommended.map((d, i) => (
              <tr key={`${d.model}-${i}`}>
                <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{d.platform}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", fontWeight: 500 }}>{d.model}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{d.why}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* iPhone data */}
      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Top iPhone Models (snapshot)</h2>
        <ul style={{ marginTop: 8, lineHeight: 1.8 }}>
          {iphone.models.map((m) => (
            <li key={m.model}>
              {m.model}: {m.share}%
            </li>
          ))}
        </ul>
        <p style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>Source: /api/iphone-models</p>
      </section>

      {/* Vendor share */}
      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>US Vendor Share (snapshot)</h2>
        <table style={{ marginTop: 8, width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 8 }}>Vendor</th>
              <th style={{ textAlign: "right", borderBottom: "1px solid #e5e7eb", padding: 8 }}>Share</th>
            </tr>
          </thead>
          <tbody>
            {vendors.vendors.map((v) => (
              <tr key={v.vendor}>
                <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{v.vendor}</td>
                <td style={{ padding: 8, textAlign: "right", borderBottom: "1px solid #f3f4f6" }}>
                  {v.share.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>Source: /api/us-vendors</p>
      </section>
    </main>
  );
}
