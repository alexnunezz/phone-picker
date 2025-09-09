// app/page.tsx
import { headers } from "next/headers";

// Build a base URL that works in dev/prod
function getBaseUrl() {
  const host = headers().get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  return `${protocol}://${host}`;
}

async function getIphoneModels() {
  const res = await fetch(`${getBaseUrl()}/api/iphone-models`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load /api/iphone-models");
  return res.json();
}

async function getUsVendors() {
  const res = await fetch(`${getBaseUrl()}/api/us-vendors`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load /api/us-vendors");
  return res.json();
}

export default async function Page() {
  const [iphone, vendors] = await Promise.all([getIphoneModels(), getUsVendors()]);

  // ---- Policy anchors (edit these when new models launch) ----
  const anchors = {
    latestIphone: "iPhone 16",
    latestGalaxy: "Galaxy S25",
    previousPixel: "Pixel 8",
    currentPixel: "Pixel 9", // optional add for coverage
  };

  // ---- Start with policy devices ----
  const recommended = [
    { platform: "iOS", model: anchors.latestIphone, why: "Always support latest standard iPhone" },
    { platform: "Android", model: anchors.latestGalaxy, why: "Always support latest standard Galaxy S" },
    { platform: "Android", model: anchors.previousPixel, why: "Always support previous-gen Pixel" },
  ];

  // Optionally add current Pixel for stock-Android coverage
  recommended.push({
    platform: "Android",
    model: anchors.currentPixel,
    why: "Broaden Android coverage with current-gen Pixel (stock Android)",
  });

  // ---- Add top iPhone models from data (avoid duplicates) ----
  const seen = new Set(recommended.map((d) => d.model));
  iphone.models.forEach((m: any) => {
    if (!seen.has(m.model)) {
      recommended.push({
        platform: "iOS",
        model: m.model,
        why: `Popular iPhone in US (~${m.share}%)`,
      });
      seen.add(m.model);
    }
  });

  // ---- (Optional) Use vendor share to explain Android focus ----
  // We’ll display the vendor snapshot below the table for context.

  return (
    <main style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui" }}>
      <h1 style={{ fontSize: 28, fontWeight: 600 }}>US Popular Phones — Test Device Picker</h1>

      {/* Recommended devices table */}
      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Recommended Test Devices</h2>
        <table
          style={{ marginTop: 8, width: "100%", borderCollapse: "collapse", fontSize: 14 }}
        >
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 8 }}>
                Platform
              </th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 8 }}>
                Model
              </th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 8 }}>
                Why
              </th>
            </tr>
          </thead>
          <tbody>
            {recommended.map((d, i) => (
              <tr key={i}>
                <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{d.platform}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6", fontWeight: 500 }}>
                  {d.model}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{d.why}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* iPhone model data (from API) */}
      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Top iPhone Models (snapshot)</h2>
        <ul style={{ marginTop: 8, lineHeight: 1.8 }}>
          {iphone.models.map((m: any) => (
            <li key={m.model}>
              {m.model}: {m.share}%
            </li>
          ))}
        </ul>
        <p style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
          Source: placeholder API /api/iphone-models
        </p>
      </section>

      {/* Android/iOS vendor share (from API) */}
      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>US Vendor Share (snapshot)</h2>
        <table
          style={{ marginTop: 8, width: "100%", borderCollapse: "collapse", fontSize: 14 }}
        >
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 8 }}>
                Vendor
              </th>
              <th style={{ textAlign: "right", borderBottom: "1px solid #e5e7eb", padding: 8 }}>
                Share
              </th>
            </tr>
          </thead>
          <tbody>
            {vendors.vendors.map((v: any) => (
              <tr key={v.vendor}>
                <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{v.vendor}</td>
                <td style={{ padding: 8, textAlign: "right", borderBottom: "1px solid #f3f4f6" }}>
                  {v.share.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
          Source: placeholder API /api/us-vendors
        </p>
      </section>
    </main>
  );
}
