export async function get<T>(
  url: string,
  token?: string,
  apiKey?: string,
): Promise<T> {
  const headers = new Headers({
    Accept: "application/json",
  });

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (apiKey) {
    headers.set("X-Noroff-API-Key", apiKey);
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error(`GET request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}
