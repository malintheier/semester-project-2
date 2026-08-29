import { post } from "../api/post";
import type { ApiResponse, RegisterBody } from "../types";

const API_REGISTER_URL = "https://v2.api.noroff.dev/auth/register";
const STUDENT_EMAIL_PATTERN = /^[^\s@]+@stud\.noroff\.no$/i;

const formElement = document.querySelector<HTMLFormElement>("#register-form");
const messageElement =
  document.querySelector<HTMLParagraphElement>("#register-message");

if (!formElement || !messageElement) {
  throw new Error("Register form markup is missing required elements.");
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
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!name || !email || !password) {
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
    const body: RegisterBody = { name, email, password };
    await post<ApiResponse<unknown>, RegisterBody>(API_REGISTER_URL, body);
    setMessage("Registration successful. You can now log in.");
    form.reset();
  } catch (error) {
    const text =
      error instanceof Error
        ? error.message
        : "Registration failed unexpectedly.";
    setMessage(text, true);
  }
});
