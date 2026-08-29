export async function deleteRequest<TResponse>(
  url: string,
  token?: string,
  apiKey?: string,
): Promise<TResponse | undefined> {
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
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    throw new Error(`DELETE request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined;
  }

  return response.json() as Promise<TResponse>;
}
