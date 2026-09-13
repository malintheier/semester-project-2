import type { UserState } from "../types";
import { renderFooter } from "../components/footer";
import { renderHeader } from "../components/header";
import "../styles/tailwind.css";

export const TOKEN_STORAGE_KEY = "arthaus_access_token";
export const API_KEY_STORAGE_KEY = "arthaus_api_key";
export const USER_STORAGE_KEY = "arthaus_user";
export const FULL_NAME_STORAGE_KEY = "arthaus_full_names";
export const CUSTOM_AVATAR_STORAGE_KEY = "arthaus_custom_avatars";
export const CUSTOM_BANNER_STORAGE_KEY = "arthaus_custom_banners";
export const STARTING_CREDITS = 1000;

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function normalizeEmailKey(email: string | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

export function resolveDisplayName(
  preferredFullName?: string,
  profileEmail?: string,
  profileName?: string,
): string {
  const normalizedProfileName = profileName?.trim().toLowerCase();
  const candidates = [
    preferredFullName,
    getFullName(profileEmail || ""),
    profileName,
  ].filter(
    (value) => !!value && value.trim().toLowerCase() !== normalizedProfileName,
  );

  const resolved = candidates.find(
    (value): value is string => !!value && value.trim().length > 0,
  );

  return resolved?.trim() || "";
}

export function getUserState(): UserState | null {
  localStorage.removeItem("arthaus_custom_avatars");
  localStorage.removeItem("arthaus_custom_banners");
  localStorage.removeItem("arthaus_full_names");

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

function getFullNameDirectory(): Record<string, string> {
  const raw = localStorage.getItem(FULL_NAME_STORAGE_KEY);

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

export function saveFullName(email: string, fullName: string): void {
  saveFullNameForProfile(email, fullName);
}

export function saveFullNameForProfile(
  email: string,
  fullName: string,
  profileName?: string,
): void {
  const normalizedEmail = normalizeEmailKey(email);

  if (!normalizedEmail || !fullName.trim()) {
    return;
  }

  const names = getFullNameDirectory();
  names[normalizedEmail] = fullName.trim();

  if (profileName?.trim()) {
    names[`profile:${profileName.trim().toLowerCase()}`] = fullName.trim();
  }

  localStorage.setItem(FULL_NAME_STORAGE_KEY, JSON.stringify(names));
}

export function getFullName(
  email: string,
  profileName?: string,
): string | undefined {
  const names = getFullNameDirectory();
  const normalizedEmail = normalizeEmailKey(email);

  if (!normalizedEmail) {
    return undefined;
  }

  return (
    names[normalizedEmail] ||
    (profileName?.trim()
      ? names[`profile:${profileName.trim().toLowerCase()}`]
      : undefined)
  );
}

function getCustomAvatarDirectory(): Record<string, string> {
  const raw = localStorage.getItem(CUSTOM_AVATAR_STORAGE_KEY);

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

export function saveCustomAvatar(
  email: string,
  avatarUrl: string,
  profileName?: string,
): void {
  const avatars = getCustomAvatarDirectory();
  const keys = [email.toLowerCase(), profileName?.toLowerCase()].filter(
    Boolean,
  ) as string[];

  for (const key of keys) {
    avatars[key] = avatarUrl;
  }

  localStorage.setItem(CUSTOM_AVATAR_STORAGE_KEY, JSON.stringify(avatars));
}

export function getCustomAvatar(
  email: string,
  profileName?: string,
): string | undefined {
  const avatars = getCustomAvatarDirectory();
  const keys = [email.toLowerCase(), profileName?.toLowerCase()].filter(
    Boolean,
  ) as string[];

  for (const key of keys) {
    const avatarUrl = avatars[key];
    if (avatarUrl) {
      return avatarUrl;
    }
  }

  return undefined;
}

export function deleteCustomAvatar(email: string, profileName?: string): void {
  const avatars = getCustomAvatarDirectory();
  const keys = [email.toLowerCase(), profileName?.toLowerCase()].filter(
    Boolean,
  ) as string[];

  let deleted = false;

  for (const key of keys) {
    if (key in avatars) {
      delete avatars[key];
      deleted = true;
    }
  }

  if (!deleted) {
    return;
  }

  if (Object.keys(avatars).length === 0) {
    localStorage.removeItem(CUSTOM_AVATAR_STORAGE_KEY);
    return;
  }

  localStorage.setItem(CUSTOM_AVATAR_STORAGE_KEY, JSON.stringify(avatars));
}

export function clearOtherProfileMedia(
  currentEmail: string,
  currentProfileName?: string,
): void {
  const avatars = getCustomAvatarDirectory();
  const banners = getCustomBannerDirectory();
  const currentKeys = [
    normalizeEmailKey(currentEmail),
    currentProfileName?.trim().toLowerCase(),
  ].filter(Boolean) as string[];

  const filteredAvatars = Object.fromEntries(
    Object.entries(avatars).filter(([key]) => currentKeys.includes(key)),
  );
  const filteredBanners = Object.fromEntries(
    Object.entries(banners).filter(([key]) => currentKeys.includes(key)),
  );

  if (Object.keys(filteredAvatars).length) {
    localStorage.setItem(
      CUSTOM_AVATAR_STORAGE_KEY,
      JSON.stringify(filteredAvatars),
    );
  } else {
    localStorage.removeItem(CUSTOM_AVATAR_STORAGE_KEY);
  }

  if (Object.keys(filteredBanners).length) {
    localStorage.setItem(
      CUSTOM_BANNER_STORAGE_KEY,
      JSON.stringify(filteredBanners),
    );
  } else {
    localStorage.removeItem(CUSTOM_BANNER_STORAGE_KEY);
  }
}

function getCustomBannerDirectory(): Record<string, string> {
  const raw = localStorage.getItem(CUSTOM_BANNER_STORAGE_KEY);

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

export function saveCustomBanner(
  email: string,
  bannerUrl: string,
  profileName?: string,
): void {
  const banners = getCustomBannerDirectory();
  const keys = [email.toLowerCase(), profileName?.toLowerCase()].filter(
    Boolean,
  ) as string[];

  for (const key of keys) {
    banners[key] = bannerUrl;
  }

  localStorage.setItem(CUSTOM_BANNER_STORAGE_KEY, JSON.stringify(banners));
}

export function getCustomBanner(
  email: string,
  profileName?: string,
): string | undefined {
  const banners = getCustomBannerDirectory();
  const keys = [email.toLowerCase(), profileName?.toLowerCase()].filter(
    Boolean,
  ) as string[];

  for (const key of keys) {
    const bannerUrl = banners[key];
    if (bannerUrl) {
      return bannerUrl;
    }
  }

  return undefined;
}

export function deleteCustomBanner(email: string, profileName?: string): void {
  const banners = getCustomBannerDirectory();
  const keys = [email.toLowerCase(), profileName?.toLowerCase()].filter(
    Boolean,
  ) as string[];

  let deleted = false;

  for (const key of keys) {
    if (key in banners) {
      delete banners[key];
      deleted = true;
    }
  }

  if (!deleted) {
    return;
  }

  if (Object.keys(banners).length === 0) {
    localStorage.removeItem(CUSTOM_BANNER_STORAGE_KEY);
    return;
  }

  localStorage.setItem(CUSTOM_BANNER_STORAGE_KEY, JSON.stringify(banners));
}

export function clearUserState(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(API_KEY_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(CUSTOM_AVATAR_STORAGE_KEY);
  localStorage.removeItem(CUSTOM_BANNER_STORAGE_KEY);
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
  renderHeader(loggedIn ? getUserState() : null, loggedIn, clearUserState);
  renderFooter();
}

window.addEventListener("storage", (event) => {
  if (event.key === USER_STORAGE_KEY || event.key === TOKEN_STORAGE_KEY) {
    renderAppHeader();
  }
});

window.addEventListener("arthaus:user-state-updated", renderAppHeader);

renderAppHeader();
