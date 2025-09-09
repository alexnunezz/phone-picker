// app/api/iphone-models/route.ts
export async function GET() {
  const data = {
    month: "2025-08",
    models: [
      { model: "iPhone 13", share: 16.03 },
      { model: "iPhone 15", share: 10.2 },
      { model: "iPhone 15 Pro", share: 10.0 },
    ],
  };
  return new Response(JSON.stringify(data), {
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
    },
  });
}
