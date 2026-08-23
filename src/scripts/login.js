const API_LOGIN_URL = "https://v2.api.noroff.dev/auth/login";
const STUDENT_EMAIL_PATTERN = /^[^\s@]+@stud\.noroff\.no$/i;
const TOKEN_STORAGE_KEY = "arthaus_access_token";
const USER_STORAGE_KEY = "arthaus_user";
const REDIRECT_URL = "./profile.html";

const form = document.querySelector("#login-form");
const message = document.querySelector("#login-message");

if (!form || !message) {
  throw new Error("Login form markup is missing required elements.");
}

function setMessage(text, isError = false) {
  message.textContent = text;
  message.style.color = isError ? "#b00020" : "#0f5132";
}

form.addEventListener("submit", async (event) => {
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
    const response = await fetch(API_LOGIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage =
        json?.errors?.[0]?.message ||
        json?.message ||
        `Login failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    const accessToken = json?.data?.accessToken;

    if (!accessToken) {
      throw new Error("Login succeeded, but token is missing from response.");
    }

    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
    localStorage.setItem(
      USER_STORAGE_KEY,
      JSON.stringify({
        name: json?.data?.name || "",
        email: json?.data?.email || email,
      }),
    );

    setMessage("Login successful. Redirecting...");
    window.location.href = REDIRECT_URL;
  } catch (error) {
    const text =
      error instanceof Error ? error.message : "Login failed unexpectedly.";
    setMessage(text, true);
  }
});
