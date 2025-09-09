// app/api/us-vendors/route.ts
export async function GET() {
  // Snapshot sample — replace later with a real feed or proxy
  const data = {
    month: "2025-08",
    vendors: [
      { vendor: "Apple", share: 57.24 },
      { vendor: "Samsung", share: 22.25 },
      { vendor: "Google", share: 6.21 },
      { vendor: "Motorola", share: 3.68 },
    ],
  };
  return new Response(JSON.stringify(data), {
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
    },
  });
}
