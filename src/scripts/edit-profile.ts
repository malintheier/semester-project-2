import { get } from "../api/get";
import { put } from "../api/put";
import type { ApiResponse, Profile } from "../types";
import { getOrCreateApiKey } from "./api-key";
import { getUserState, setUserState, TOKEN_STORAGE_KEY } from "./user-state";
import "../styles/tailwind.css";

const API_BASE_URL = "https://v2.api.noroff.dev/auction/profiles";

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Edit profile markup is missing ${selector}.`);
  }

  return element;
}

const form = requireElement<HTMLFormElement>("#edit-profile-form");
const statusElement = requireElement<HTMLParagraphElement>("#edit-status");
const displayNameElement = requireElement<HTMLInputElement>("#display-name");
const bioElement = requireElement<HTMLTextAreaElement>("#bio");
const avatarUrlElement = requireElement<HTMLInputElement>("#avatar-url");
const bannerUrlElement = requireElement<HTMLInputElement>("#banner-url");
const avatarPreviewElement =
  requireElement<HTMLImageElement>("#avatar-preview");
const avatarInitialsElement =
  requireElement<HTMLSpanElement>("#avatar-initials");
const bannerPreviewWrapElement = requireElement<HTMLDivElement>(
  "#banner-preview-wrap",
);
const bannerPreviewElement =
  requireElement<HTMLImageElement>("#banner-preview");

let profile: Profile | null = null;

function setStatus(text: string, isError = false): void {
  statusElement.textContent = text;
  statusElement.className = isError
    ? "mb-8 border border-[#c0392b] bg-[#c0392b]/10 p-4 text-sm font-medium text-[#c0392b]"
    : "mb-8 border border-success bg-success/10 p-4 text-sm font-medium text-success";
}

function getInitials(name: string): string {
  return name
    .split(/[._\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function updateAvatarPreview(): void {
  const url = avatarUrlElement.value.trim();

  if (!url) {
    avatarPreviewElement.classList.add("hidden");
    avatarInitialsElement.classList.remove("hidden");
    return;
  }

  avatarPreviewElement.src = url;
  avatarPreviewElement.classList.remove("hidden");
  avatarInitialsElement.classList.add("hidden");
}

function updateBannerPreview(): void {
  const url = bannerUrlElement.value.trim();

  if (!url) {
    bannerPreviewWrapElement.classList.add("hidden");
    bannerPreviewElement.removeAttribute("src");
    return;
  }

  bannerPreviewElement.src = url;
  bannerPreviewWrapElement.classList.remove("hidden");
}

function populateForm(data: Profile): void {
  displayNameElement.value = data.name;
  bioElement.value = data.bio || "";
  avatarUrlElement.value = data.avatar?.url || "";
  bannerUrlElement.value = data.banner?.url || "";
  avatarInitialsElement.textContent = getInitials(data.name);
  updateAvatarPreview();
  updateBannerPreview();
}

async function loadProfile(): Promise<void> {
  const user = getUserState();
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);

  if (!user || !token) {
    setStatus("Log in to edit your profile.", true);
    return;
  }

  try {
    const apiKey = await getOrCreateApiKey(token);
    const response = await get<ApiResponse<Profile>>(
      `${API_BASE_URL}/${encodeURIComponent(user.name)}`,
      token,
      apiKey,
    );
    profile = response.data;
    populateForm(profile);
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : "Could not load your profile.",
      true,
    );
  }
}

avatarUrlElement.addEventListener("input", updateAvatarPreview);
bannerUrlElement.addEventListener("input", updateBannerPreview);

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!profile) {
    setStatus("Your profile is not available yet.", true);
    return;
  }

  const token = localStorage.getItem(TOKEN_STORAGE_KEY);

  if (!token) {
    setStatus("Log in to save profile changes.", true);
    return;
  }

  const bio = bioElement.value.trim();
  const avatarUrl = avatarUrlElement.value.trim();
  const bannerUrl = bannerUrlElement.value.trim();

  if (bio.length > 160) {
    setStatus("Bio must be 160 characters or fewer.", true);
    return;
  }

  try {
    const apiKey = await getOrCreateApiKey(token);
    const response = await put<
      ApiResponse<Profile>,
      {
        bio: string;
        avatar?: { url: string; alt: string };
        banner?: { url: string; alt: string };
      }
    >(
      `${API_BASE_URL}/${encodeURIComponent(profile.name)}`,
      {
        bio,
        ...(avatarUrl ? { avatar: { url: avatarUrl, alt: "" } } : {}),
        ...(bannerUrl ? { banner: { url: bannerUrl, alt: "" } } : {}),
      },
      token,
      apiKey,
    );

    profile = response.data;
    setUserState({
      name: profile.name,
      email: profile.email,
      credits: Number(profile.credits ?? 0),
      avatarUrl: profile.avatar?.url,
    });
    setStatus("Profile saved.");
    window.setTimeout(() => {
      window.location.href = "./profile.html";
    }, 1200);
  } catch (error) {
    setStatus(
      error instanceof Error
        ? error.message
        : "Could not save profile changes.",
      true,
    );
  }
});

loadProfile();
