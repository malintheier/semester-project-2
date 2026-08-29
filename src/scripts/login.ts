import { post } from "../api/post";
import type { ApiResponse, LoginBody, LoginResponse } from "../types";
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

if (!formElement || !messageElement) {
  throw new Error("Login form markup is missing required elements.");
}

const form = formElement;
const message = messageElement;

function setMessage(text: string, isError = false): void {
  message.textContent = text;
  message.style.color = isError ? "#b00020" : "#0f5132";
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

    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
    setUserState({
      name: response.data.name || "",
      email: response.data.email || email,
      credits: Number(response.data.credits ?? STARTING_CREDITS),
    });

    setMessage("Login successful. Redirecting...");
    window.location.href = REDIRECT_URL;
  } catch (error) {
    const text =
      error instanceof Error ? error.message : "Login failed unexpectedly.";
    setMessage(text, true);
  }
});
