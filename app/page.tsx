// app/page.tsx
import { headers } from "next/headers";

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

// ---------- Helpers ----------
function getBaseUrl() {
  const host = headers().get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  return `${protocol}://${host}`;
}

async function getIphoneModels(): Promise<IPhoneModelsResp> {
  const res = await fetch(`${getBaseUrl()}/api/iphone-models`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load /api/iphone-models: ${res.status}`);
  return res.json() as Promise<IPhoneModelsResp>;
}

async function getUsVendors(): Promise<VendorsResp> {
  const res = await fetch(`${getBaseUrl()}/api/us-vendors`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load /api/us-vendors: ${res.status}`);
  return res.json() as Promise<VendorsResp>;
}

// ---------- Page ----------
export default async function Page() {
  const [iphone, vendors] = await Promise.all([getIphoneModels(), getUsVendors()]);

  // Policy anchors
  const anchors = {
    latestIphone: "iPhone 16",
    latestGalaxy: "Galaxy S25",
    previousPixel: "Pixel 8",
    currentPixel: "Pixel 9",
  };

  const recommended: Recommendation[] = [
    { platform: "iOS",     model: anchors.latestIphone,  why: "Always support latest standard iPhone" },
    { platform: "Android", model: anchors.latestGalaxy,  why: "Always support latest standard Galaxy S" },
    { platform: "Android", model: anchors.previousPixel, why: "Always support previous-gen Pixel" },
    { platform: "Android", model: anchors.currentPixel,  why: "Broaden Android coverage (stock Android)" },
  ];

  // Add top iPhone models (avoid duplicates)
  const seen = new Set<string>(recommended.map((d) => d.model));
  iphone.models.forEach((m: IPhoneModel) => {
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
          {iphone.models.map((m: IPhoneModel) => (
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
            {vendors.vendors.map((v: VendorShare) => (
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
