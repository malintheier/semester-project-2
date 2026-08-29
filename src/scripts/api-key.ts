import { post } from "../api/post";
import type { ApiKey, ApiResponse } from "../types";
import { API_KEY_STORAGE_KEY } from "./user-state";

const API_KEY_URL = "https://v2.api.noroff.dev/auth/create-api-key";

export async function getOrCreateApiKey(token: string): Promise<string> {
  const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);

  if (storedKey) {
    return storedKey;
  }

  const response = await post<ApiResponse<ApiKey>, { name: string }>(
    API_KEY_URL,
    { name: "Arthaus" },
    token,
  );
  const apiKey = response.data.key;

  if (!apiKey) {
    throw new Error("API key is missing from the response.");
  }

  localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
  return apiKey;
}
