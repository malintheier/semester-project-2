export async function post<TResponse, TBody>(
  url: string,
  body: TBody,
  token?: string,
): Promise<TResponse> {
  const headers = new Headers({
    Accept: "application/json",
    "Content-Type": "application/json",
  });

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`POST request failed with status ${response.status}`);
  }

  return response.json() as Promise<TResponse>;
}
