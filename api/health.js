export default function handler(request, response) {
  if (request.method !== "GET") {
    return response.status(405).json({
      ok: false,
      error: "Method not allowed",
    });
  }

  return response.status(200).json({
    ok: true,
    service: "ISTe API",
    time: new Date().toISOString(),
  });
}
