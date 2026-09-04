import { post } from "../api/post";
import type { ApiResponse, RegisterBody } from "../types";
import { saveFullName } from "./user-state";

const API_REGISTER_URL = "https://v2.api.noroff.dev/auth/register";
const STUDENT_EMAIL_PATTERN = /^[^\s@]+@stud\.noroff\.no$/i;

const formElement = document.querySelector<HTMLFormElement>("#register-form");
const messageElement =
  document.querySelector<HTMLParagraphElement>("#register-message");
const successElement =
  document.querySelector<HTMLDivElement>("#register-success");

if (!formElement || !messageElement || !successElement) {
  throw new Error("Register form markup is missing required elements.");
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
  const fullName = String(formData.get("full-name") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!fullName || !name || !email || !password) {
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
    saveFullName(email, fullName);
    form.classList.add("hidden");
    success.classList.remove("hidden");
    window.setTimeout(() => {
      window.location.href = "./login.html";
    }, 1200);
  } catch (error) {
    const text =
      error instanceof Error
        ? error.message
        : "Registration failed unexpectedly.";
    setMessage(text, true);
  }
});
