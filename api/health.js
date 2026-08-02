export default function handler(request, response) {
  if (request.method !== "GET") {
    return response.status(405).json({
      ok: false,
      error: "Method not allowed",
    });
  }

  const configuration = {
    supabaseUrl: Boolean(process.env.SUPABASE_URL),
    supabasePublishableKey: Boolean(
      process.env.SUPABASE_PUBLISHABLE_KEY,
    ),
    appOrigin: Boolean(process.env.APP_ORIGIN),
  };

  const isConfigured = Object.values(configuration).every(Boolean);

  return response.status(isConfigured ? 200 : 500).json({
    ok: isConfigured,
    service: "ISTe API",
    configuration,
    time: new Date().toISOString(),
  });
}
