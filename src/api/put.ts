export async function put<TResponse, TBody>(
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
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`PUT request failed with status ${response.status}`);
  }

  return response.json() as Promise<TResponse>;
}
