import { post } from "../api/post";
import type { ApiResponse, LoginBody, LoginResponse } from "../types";
import { getOrCreateApiKey } from "./api-key";
import {
  STARTING_CREDITS,
  TOKEN_STORAGE_KEY,
  setUserState,
} from "./user-state";

const API_LOGIN_URL = "https://v2.api.noroff.dev/auth/login";
const STUDENT_EMAIL_PATTERN = /^[^\s@]+@stud\.noroff\.no$/i;
const REDIRECT_URL = "./profile.html";

const formElement = document.querySelector<HTMLFormElement>("#login-form");
const messageElement =
  document.querySelector<HTMLParagraphElement>("#login-message");
const successElement = document.querySelector<HTMLDivElement>("#login-success");

if (!formElement || !messageElement || !successElement) {
  throw new Error("Login form markup is missing required elements.");
}

const form = formElement;
const message = messageElement;
const success = successElement;

function setMessage(text: string, isError = false): void {
  message.textContent = text;
  message.className = text
    ? isError
      ? "border border-[#c0392b]/30 bg-[#c0392b]/10 p-3 text-xs text-[#c0392b]"
      : "border border-success/30 bg-success/10 p-3 text-xs text-success"
    : "hidden";
}

form.addEventListener("submit", async (event: SubmitEvent) => {
  event.preventDefault();
  setMessage("");

  const formData = new FormData(form);
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    setMessage("Please fill in all required fields.", true);
    return;
  }

  if (!STUDENT_EMAIL_PATTERN.test(email)) {
    setMessage("Email must end with @stud.noroff.no.", true);
    return;
  }

  if (password.length < 8) {
    setMessage("Password must be at least 8 characters.", true);
    return;
  }

  try {
    const body: LoginBody = { email, password };
    const response = await post<ApiResponse<LoginResponse>, LoginBody>(
      API_LOGIN_URL,
      body,
    );
    const accessToken = response.data.accessToken;

    if (!accessToken) {
      throw new Error("Login succeeded, but token is missing from response.");
    }

    await getOrCreateApiKey(accessToken);
    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
    setUserState({
      name: response.data.name || "",
      email: response.data.email || email,
      credits: Number(response.data.credits ?? STARTING_CREDITS),
    });

    form.classList.add("hidden");
    success.classList.remove("hidden");
    window.setTimeout(() => {
      window.location.href = REDIRECT_URL;
    }, 1200);
  } catch (error) {
    const text =
      error instanceof Error ? error.message : "Login failed unexpectedly.";
    setMessage(text, true);
  }
});
