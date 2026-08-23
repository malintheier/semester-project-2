const API_REGISTER_URL = "https://v2.api.noroff.dev/auth/register";
const STUDENT_EMAIL_PATTERN = /^[^\s@]+@stud\.noroff\.no$/i;

const form = document.querySelector("#register-form");
const message = document.querySelector("#register-message");

if (!form || !message) {
  throw new Error("Register form markup is missing required elements.");
}

function setMessage(text, isError = false) {
  message.textContent = text;
  message.style.color = isError ? "#b00020" : "#0f5132";
}

form.addEventListener("submit", async (event) => {
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
    const response = await fetch(API_REGISTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage =
        json?.errors?.[0]?.message ||
        json?.message ||
        `Registration failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

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
