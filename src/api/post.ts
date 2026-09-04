export async function post<TResponse, TBody>(
  url: string,
  body: TBody,
  token?: string,
  apiKey?: string,
): Promise<TResponse> {
  const headers = new Headers({
    Accept: "application/json",
    "Content-Type": "application/json",
  });

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (apiKey) {
    headers.set("X-Noroff-API-Key", apiKey);
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorResponse = (await response.json().catch(() => null)) as {
      errors?: Array<{ message?: string; path?: string[] }>;
      message?: string;
      status?: string;
    } | null;
    const messages = errorResponse?.errors
      ?.map((error) => {
        const path = error.path?.join(".");
        return error.message
          ? `${path ? `${path}: ` : ""}${error.message}`
          : "";
      })
      .filter(Boolean);
    const message =
      messages?.join(" ") || errorResponse?.message || errorResponse?.status;

    throw new Error(
      message || `POST request failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<TResponse>;
}
