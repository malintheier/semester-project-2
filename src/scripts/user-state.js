export const TOKEN_STORAGE_KEY = "arthaus_access_token";
export const USER_STORAGE_KEY = "arthaus_user";
export const STARTING_CREDITS = 1000;

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function getUserState() {
  const raw = localStorage.getItem(USER_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setUserState(user) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  window.dispatchEvent(
    new CustomEvent("arthaus:user-state-updated", {
      detail: user,
    }),
  );
}

export function clearUserState() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(USER_STORAGE_KEY);
  window.dispatchEvent(
    new CustomEvent("arthaus:user-state-updated", {
      detail: null,
    }),
  );
}

function isLoggedIn() {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const user = getUserState();
  const hasIdentity = Boolean(user?.email || user?.name);
  return Boolean(token && hasIdentity);
}

function shouldRenderCreditsOnPage() {
  const path = window.location.pathname.toLowerCase();
  return !path.endsWith("/login.html") && !path.endsWith("/register.html");
}

export function getUserCredits() {
  const user = getUserState();

  if (!user) {
    return 0;
  }

  return toNumber(user?.credits ?? STARTING_CREDITS);
}

export function updateUserCredits(credits) {
  const user = getUserState() || {};
  setUserState({
    ...user,
    credits: toNumber(credits),
  });
}

function ensureCreditsElement() {
  const existing = document.querySelector("[data-user-credits]");

  if (existing) {
    return existing;
  }

  const wrapper = document.createElement("p");
  wrapper.id = "global-credits";
  wrapper.textContent = "Credits: ";

  const value = document.createElement("span");
  value.setAttribute("data-user-credits", "");
  value.textContent = "0";
  wrapper.appendChild(value);

  const header = document.querySelector("header");

  if (header) {
    header.appendChild(wrapper);
  } else {
    document.body.prepend(wrapper);
  }

  return value;
}

function removeCreditsElement() {
  const wrapper = document.querySelector("#global-credits");

  if (wrapper) {
    wrapper.remove();
  }
}

function renderCredits() {
  if (!shouldRenderCreditsOnPage()) {
    removeCreditsElement();
    return;
  }

  if (!isLoggedIn()) {
    removeCreditsElement();
    return;
  }

  const creditsElement = ensureCreditsElement();
  creditsElement.textContent = String(getUserCredits());
}

window.addEventListener("storage", (event) => {
  if (event.key === USER_STORAGE_KEY || event.key === TOKEN_STORAGE_KEY) {
    renderCredits();
  }
});

window.addEventListener("arthaus:user-state-updated", () => {
  renderCredits();
});

renderCredits();
