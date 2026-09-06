export async function askSupportAi(
  message,
  locale = "en",
  history = [],
) {
  const response = await fetch("/api/support", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      locale,
      history: Array.isArray(history)
        ? history.slice(-8).map((item) => ({
            role: item.role,
            text: item.text,
          }))
        : [],
    }),
  });

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("Support service returned an invalid response.");
  }

  if (!response.ok || result?.ok !== true) {
    throw new Error(
      result?.message || "Could not contact ISTe Support."
    );
  }

  return result;
}
