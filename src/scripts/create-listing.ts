import { post } from "../api/post";
import type { ApiResponse, Listing, MediaItem } from "../types";
import { getOrCreateApiKey } from "./api-key";
import { getUserState, TOKEN_STORAGE_KEY } from "./user-state";
import "../styles/tailwind.css";

const API_LISTINGS_URL = "https://v2.api.noroff.dev/auction/listings";

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Create listing markup is missing ${selector}.`);
  }

  return element;
}

const form = requireElement<HTMLFormElement>("#create-listing-form");
const messageElement = requireElement<HTMLParagraphElement>("#listing-message");
const artistElement = requireElement<HTMLInputElement>("#listing-artist");
const titleElement = requireElement<HTMLInputElement>("#listing-title");
const descriptionElement = requireElement<HTMLTextAreaElement>(
  "#listing-description",
);
const deadlineElement = requireElement<HTMLInputElement>("#listing-deadline");
const yearElement = requireElement<HTMLInputElement>("#listing-year");
const surfaceElement = requireElement<HTMLInputElement>("#listing-surface");
const dimensionsElement = requireElement<HTMLInputElement>(
  "#listing-dimensions",
);
const reserveElement = requireElement<HTMLInputElement>("#listing-reserve");
const mediaUrlElement = requireElement<HTMLInputElement>("#media-url");
const addMediaButton = requireElement<HTMLButtonElement>("#add-media");
const mediaPreviewElement = requireElement<HTMLDivElement>("#media-preview");
const mediumButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>(".medium-option"),
);

if (!mediumButtons.length) {
  throw new Error("Create listing markup is missing medium options.");
}

let selectedMedium = "";
let mediaUrls: string[] = [];

function setMessage(text: string, isError = false): void {
  messageElement.textContent = text;
  messageElement.className = isError
    ? "mb-8 border border-[#c0392b] bg-[#c0392b]/10 p-4 text-sm font-medium text-[#c0392b]"
    : "mb-8 border border-success bg-success/10 p-4 text-sm font-medium text-success";
}

function renderMediaPreviews(): void {
  mediaPreviewElement.innerHTML = "";

  mediaUrls.forEach((url) => {
    const wrapper = document.createElement("div");
    wrapper.className = "relative aspect-square overflow-hidden bg-stone-200";

    const image = document.createElement("img");
    image.className = "h-full w-full object-cover";
    image.src = url;
    image.alt = "Listing preview";

    const removeButton = document.createElement("button");
    removeButton.className =
      "absolute right-1 top-1 flex h-5 w-5 items-center justify-center bg-ink/70 text-xs text-white";
    removeButton.type = "button";
    removeButton.textContent = "x";
    removeButton.setAttribute("aria-label", "Remove image");
    removeButton.addEventListener("click", () => {
      mediaUrls = mediaUrls.filter((mediaUrl) => mediaUrl !== url);
      renderMediaPreviews();
    });

    wrapper.append(image, removeButton);
    mediaPreviewElement.appendChild(wrapper);
  });
}

function addMedia(): void {
  const url = mediaUrlElement.value.trim();

  if (!url || mediaUrls.includes(url)) {
    return;
  }

  mediaUrls = [...mediaUrls, url];
  mediaUrlElement.value = "";
  renderMediaPreviews();
}

function getTags(): string[] {
  const values = [
    selectedMedium,
    yearElement.value.trim() ? `year:${yearElement.value.trim()}` : "",
    surfaceElement.value.trim() ? `surface:${surfaceElement.value.trim()}` : "",
    dimensionsElement.value.trim()
      ? `dimensions:${dimensionsElement.value.trim()}`
      : "",
    reserveElement.value.trim() ? `reserve:${reserveElement.value.trim()}` : "",
  ];

  return values.filter(Boolean);
}

function validateForm(): string | null {
  if (!titleElement.value.trim()) {
    return "Title is required.";
  }

  if (!selectedMedium) {
    return "Please select a medium.";
  }

  if (!descriptionElement.value.trim()) {
    return "Description is required.";
  }

  if (!deadlineElement.value) {
    return "Auction deadline is required.";
  }

  if (new Date(deadlineElement.value).getTime() <= Date.now()) {
    return "Auction deadline must be in the future.";
  }

  return null;
}

function setMedium(medium: string, selectedButton: HTMLButtonElement): void {
  selectedMedium = medium;
  mediumButtons.forEach((button) => {
    button.className =
      button === selectedButton
        ? "medium-option border border-auction-red bg-auction-red px-4 py-2 text-xs font-medium uppercase tracking-[0.15em] text-white"
        : "medium-option border border-line bg-white px-4 py-2 text-xs font-medium uppercase tracking-[0.15em] text-muted-ink";
  });
}

mediumButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setMedium(button.dataset.medium || "", button);
  });
});

addMediaButton.addEventListener("click", addMedia);
mediaUrlElement.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addMedia();
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const validationError = validateForm();

  if (validationError) {
    setMessage(validationError, true);
    return;
  }

  const user = getUserState();
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);

  if (!user || !token) {
    setMessage("Log in before submitting work.", true);
    return;
  }

  const body: {
    title: string;
    description: string;
    tags: string[];
    media: MediaItem[];
    endsAt: string;
  } = {
    title: titleElement.value.trim(),
    description: descriptionElement.value.trim(),
    tags: getTags(),
    media: mediaUrls.map((url) => ({ url, alt: titleElement.value.trim() })),
    endsAt: new Date(deadlineElement.value).toISOString(),
  };

  try {
    const apiKey = await getOrCreateApiKey(token);
    await post<ApiResponse<Listing>, typeof body>(
      API_LISTINGS_URL,
      body,
      token,
      apiKey,
    );
    form.classList.add("hidden");
    setMessage("Listing created. Redirecting to your profile.");
    window.setTimeout(() => {
      window.location.href = "./profile.html";
    }, 1500);
  } catch (error) {
    setMessage(
      error instanceof Error ? error.message : "Could not create listing.",
      true,
    );
  }
});

const user = getUserState();
artistElement.value = user?.name || "";
