export async function get<T>(url: string, token?: string): Promise<T> {
  const headers = new Headers({
    Accept: "application/json",
  });

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
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
