import type { UserState } from "../types";
import { renderHeader } from "../components/header";
import "../styles/tailwind.css";

export const TOKEN_STORAGE_KEY = "arthaus_access_token";
export const API_KEY_STORAGE_KEY = "arthaus_api_key";
export const USER_STORAGE_KEY = "arthaus_user";
export const STARTING_CREDITS = 1000;

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function getUserState(): UserState | null {
  const raw = localStorage.getItem(USER_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as UserState;
  } catch {
    return null;
  }
}

export function setUserState(user: UserState): void {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  window.dispatchEvent(
    new CustomEvent<UserState>("arthaus:user-state-updated", {
      detail: user,
    }),
  );
}

export function clearUserState(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(API_KEY_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(API_KEY_STORAGE_KEY);
  sessionStorage.removeItem(USER_STORAGE_KEY);
  window.dispatchEvent(
    new CustomEvent<null>("arthaus:user-state-updated", {
      detail: null,
    }),
  );
}

function isLoggedIn(): boolean {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const user = getUserState();
  const hasIdentity = Boolean(user?.email || user?.name);
  return Boolean(token && hasIdentity);
}

function shouldRenderCreditsOnPage(): boolean {
  const path = window.location.pathname.toLowerCase();
  return !path.endsWith("/login.html") && !path.endsWith("/register.html");
}

export function getUserCredits(): number {
  const user = getUserState();

  if (!user) {
    return 0;
  }

  return toNumber(user.credits ?? STARTING_CREDITS);
}

export function updateUserCredits(credits: number): void {
  const user = getUserState();

  if (!user) {
    return;
  }

  setUserState({
    ...user,
    credits: toNumber(credits),
  });
}

function renderAppHeader(): void {
  const loggedIn = isLoggedIn();
  renderHeader(loggedIn ? getUserState() : null, loggedIn);
}

window.addEventListener("storage", (event) => {
  if (event.key === USER_STORAGE_KEY || event.key === TOKEN_STORAGE_KEY) {
    renderAppHeader();
  }
});

window.addEventListener("arthaus:user-state-updated", renderAppHeader);

renderAppHeader();
