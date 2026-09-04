import { get } from "../api/get";
import { post } from "../api/post";
import { put } from "../api/put";
import { deleteRequest } from "../api/delete";
import type { ApiResponse, Bid, Listing } from "../types";
import { getOrCreateApiKey } from "./api-key";
import {
  getUserCredits,
  getUserState,
  TOKEN_STORAGE_KEY,
  updateUserCredits,
} from "./user-state";
import "../styles/tailwind.css";

const API_BASE_URL = "https://v2.api.noroff.dev/auction/listings";
const CATEGORIES = ["oil", "acrylic", "watercolor"] as const;
const APP_TAG = "arthaus";

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Place bid markup is missing ${selector}.`);
  }

  return element;
}

const statusElement = requireElement<HTMLParagraphElement>("#listing-status");
const contentElement = requireElement<HTMLDivElement>("#listing-content");
const imageElement = requireElement<HTMLImageElement>("#listing-image");
const categoryElement = requireElement<HTMLSpanElement>("#listing-category");
const thumbnailElement = requireElement<HTMLDivElement>("#thumbnail-strip");
const titleElement = requireElement<HTMLHeadingElement>("#listing-title");
const artistElement = requireElement<HTMLAnchorElement>("#listing-artist");
const descriptionElement = requireElement<HTMLParagraphElement>(
  "#listing-description",
);
const detailArtistElement = requireElement<HTMLElement>("#detail-artist");
const detailMediumElement = requireElement<HTMLElement>("#detail-medium");
const detailDimensionsElement =
  requireElement<HTMLElement>("#detail-dimensions");
const detailSurfaceElement = requireElement<HTMLElement>("#detail-surface");
const detailDeadlineElement = requireElement<HTMLElement>("#detail-deadline");
const detailBidsElement = requireElement<HTMLElement>("#detail-bids");
const currentBidElement = requireElement<HTMLParagraphElement>("#current-bid");
const creditsElement = requireElement<HTMLSpanElement>("#your-credits");
const bidHistoryElement = requireElement<HTMLOListElement>("#bid-history");
const bidForm = requireElement<HTMLFormElement>("#bid-form");
const bidAmountElement = requireElement<HTMLInputElement>("#bid-amount");
const bidMessageElement = requireElement<HTMLParagraphElement>("#bid-message");
const bidActionsElement = requireElement<HTMLDivElement>("#bid-actions");
const listingManagementElement = requireElement<HTMLElement>(
  "#listing-management",
);
const openEditListingButton =
  requireElement<HTMLButtonElement>("#open-edit-listing");
const editListingForm = requireElement<HTMLFormElement>("#edit-listing-form");
const cancelEditListingButton = requireElement<HTMLButtonElement>(
  "#cancel-edit-listing",
);
const editTitleElement = requireElement<HTMLInputElement>(
  "#edit-listing-title",
);
const editDescriptionElement = requireElement<HTMLTextAreaElement>(
  "#edit-listing-description",
);
const editCategoryButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>(".edit-category-option"),
);
const editSurfaceElement = requireElement<HTMLInputElement>(
  "#edit-listing-surface",
);
const editMediaElement = requireElement<HTMLTextAreaElement>(
  "#edit-listing-media",
);
const deleteListingButton = requireElement<HTMLButtonElement>(
  "#delete-listing-button",
);
const daysElement = requireElement<HTMLSpanElement>("#countdown-days");
const hoursElement = requireElement<HTMLSpanElement>("#countdown-hours");
const minutesElement = requireElement<HTMLSpanElement>("#countdown-minutes");
const secondsElement = requireElement<HTMLSpanElement>("#countdown-seconds");

let currentListing: Listing | null = null;
let countdownTimer: number | undefined;
let selectedEditCategory = "";

function setStatus(text: string, isError = false): void {
  statusElement.textContent = text;
  statusElement.className = isError
    ? "mt-6 text-sm text-[#c0392b]"
    : "mt-6 text-sm";
}

function setBidMessage(text: string, isError = false): void {
  bidMessageElement.textContent = text;
  bidMessageElement.className = isError
    ? "mt-6 border border-[#c0392b] bg-[#c0392b]/10 px-4 py-3 text-sm text-[#c0392b]"
    : "mt-6 border border-success bg-success/10 px-4 py-3 text-sm text-success";
}

function getListingId(): string | null {
  return new URLSearchParams(window.location.search).get("id");
}

function getCategory(listing: Listing): string | null {
  const tags = Array.isArray(listing.tags) ? listing.tags : [];
  const category = tags
    .map((tag) => tag.toLowerCase())
    .find((tag) => CATEGORIES.includes(tag as (typeof CATEGORIES)[number]));

  return category || null;
}

function getTagValue(listing: Listing, key: string): string | null {
  const tags = Array.isArray(listing.tags) ? listing.tags : [];
  const prefix = `${key.toLowerCase()}:`;
  const tag = tags.find((item) => item.toLowerCase().startsWith(prefix));

  return tag ? tag.slice(prefix.length).trim() || null : null;
}

function getHighestBid(listing: Listing): number {
  return (listing.bids || []).reduce((highest, bid) => {
    const amount = Number(bid.amount || 0);
    return amount > highest ? amount : highest;
  }, 0);
}

function formatDate(value?: string): string {
  const date = new Date(value || "");
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleDateString();
}

function formatCategory(category: string): string {
  return `${category[0].toUpperCase()}${category.slice(1)}`;
}

function capitalize(value: string): string {
  return `${value[0].toUpperCase()}${value.slice(1)}`;
}

function isListingCreator(listing: Listing): boolean {
  const user = getUserState();
  return Boolean(user?.name && listing.seller?.name === user.name);
}

function renderListingManagement(listing: Listing): void {
  const isCreator = isListingCreator(listing);
  bidActionsElement.classList.toggle("hidden", isCreator);
  listingManagementElement.classList.toggle("hidden", !isCreator);

  if (!isCreator) {
    return;
  }

  editTitleElement.value = listing.title || "";
  editDescriptionElement.value = listing.description || "";
  selectedEditCategory = getCategory(listing) || "";
  editCategoryButtons.forEach((button) => {
    const isSelected = button.dataset.category === selectedEditCategory;
    button.className = isSelected
      ? "edit-category-option border border-auction-red bg-auction-red px-3 py-2 text-xs font-medium uppercase tracking-[0.15em] text-paper"
      : "edit-category-option border border-line bg-card px-3 py-2 text-xs font-medium uppercase tracking-[0.15em] text-muted-ink";
  });
  editSurfaceElement.value = getTagValue(listing, "surface") || "";
  editMediaElement.value = (listing.media || [])
    .map((media) => media.url || "")
    .filter(Boolean)
    .join("\n");
}

function toggleEditListing(show: boolean): void {
  editListingForm.classList.toggle("hidden", !show);
  openEditListingButton.classList.toggle("hidden", show);
}

editCategoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedEditCategory = button.dataset.category || "";
    editCategoryButtons.forEach((categoryButton) => {
      const isSelected = categoryButton === button;
      categoryButton.className = isSelected
        ? "edit-category-option border border-auction-red bg-auction-red px-3 py-2 text-xs font-medium uppercase tracking-[0.15em] text-paper"
        : "edit-category-option border border-line bg-card px-3 py-2 text-xs font-medium uppercase tracking-[0.15em] text-muted-ink";
    });
  });
});

function renderMedia(listing: Listing): void {
  const media = Array.isArray(listing.media)
    ? listing.media.filter((item) => item.url)
    : [];
  const primary = media[0];

  imageElement.src = primary?.url || "";
  imageElement.alt = primary?.alt || listing.title || "Artwork image";
  thumbnailElement.innerHTML = "";

  media.forEach((item, index) => {
    const button = document.createElement("button");
    button.className = `h-[52px] w-[52px] overflow-hidden ${index === 0 ? "border-2 border-ink" : "border border-line"}`;
    button.type = "button";

    const thumbnail = document.createElement("img");
    thumbnail.className = "h-full w-full object-cover";
    thumbnail.src = item.url || "";
    thumbnail.alt = item.alt || listing.title || "Artwork image";

    button.appendChild(thumbnail);
    button.addEventListener("click", () => {
      imageElement.src = item.url || "";
      imageElement.alt = item.alt || listing.title || "Artwork image";
      thumbnailElement.querySelectorAll("button").forEach((buttonElement) => {
        buttonElement.className =
          "h-[52px] w-[52px] overflow-hidden border border-line";
      });
      button.className =
        "h-[52px] w-[52px] overflow-hidden border-2 border-ink";
    });
    thumbnailElement.appendChild(button);
  });
}

function formatBidTimestamp(created?: string): string {
  const date = new Date(created || "");

  if (Number.isNaN(date.getTime())) {
    return "Time unknown";
  }

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function renderBidHistory(bids: Bid[]): void {
  bidHistoryElement.innerHTML = "";

  if (!bids.length) {
    const item = document.createElement("li");
    item.className = "border-b border-line py-3 text-sm text-muted-ink";
    item.textContent = "No bids yet.";
    bidHistoryElement.appendChild(item);
    return;
  }

  [...bids]
    .sort(
      (first, second) =>
        new Date(second.created || "").getTime() -
        new Date(first.created || "").getTime(),
    )
    .forEach((bid) => {
      const item = document.createElement("li");
      item.className =
        "flex items-center justify-between gap-4 border-b border-line py-3 text-sm";

      const bidderDetails = document.createElement("div");

      const bidder = document.createElement("span");
      bidder.className = "block font-medium";
      bidder.textContent = bid.bidder?.name || "Anonymous bidder";

      const timestamp = document.createElement("time");
      timestamp.className = "mt-1 block text-xs text-muted-ink";
      timestamp.dateTime = bid.created || "";
      timestamp.textContent = formatBidTimestamp(bid.created);

      bidderDetails.append(bidder, timestamp);

      const amount = document.createElement("span");
      amount.className = "font-semibold";
      amount.textContent = `${Number(bid.amount || 0)} credits`;

      item.append(bidderDetails, amount);
      bidHistoryElement.appendChild(item);
    });
}

function updateCountdown(): void {
  const endTime = new Date(currentListing?.endsAt || "").getTime();
  const remaining = Math.max(0, endTime - Date.now());
  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  daysElement.textContent = String(days).padStart(2, "0");
  hoursElement.textContent = String(hours).padStart(2, "0");
  minutesElement.textContent = String(minutes).padStart(2, "0");
  secondsElement.textContent = String(seconds).padStart(2, "0");
}

function renderListing(listing: Listing): void {
  currentListing = listing;
  const category = getCategory(listing);
  const highestBid = getHighestBid(listing);

  titleElement.textContent = listing.title || "Untitled artwork";
  artistElement.textContent = listing.seller?.name || "Arthaus artist";
  artistElement.href = `./public-profile.html?name=${encodeURIComponent(listing.seller?.name || "")}`;
  descriptionElement.textContent =
    listing.description || "No description has been provided.";
  detailArtistElement.textContent = listing.seller?.name || "Unknown";
  detailMediumElement.textContent = category
    ? formatCategory(category)
    : "Not specified";
  const dimensions = getTagValue(listing, "dimensions");
  const surface = getTagValue(listing, "surface");
  detailDimensionsElement.textContent = dimensions
    ? `${dimensions} cm`
    : "Not specified";
  detailSurfaceElement.textContent = surface
    ? capitalize(surface)
    : "Not specified";
  detailDeadlineElement.textContent = formatDate(listing.endsAt);
  detailBidsElement.textContent = String(
    listing._count?.bids ?? listing.bids?.length ?? 0,
  );
  currentBidElement.textContent = String(highestBid);
  creditsElement.textContent = String(getUserCredits());

  if (category) {
    categoryElement.textContent = formatCategory(category);
    categoryElement.classList.remove("hidden");
  }

  renderMedia(listing);
  renderListingManagement(listing);
  renderBidHistory(listing.bids || []);
  updateCountdown();
  window.clearInterval(countdownTimer);
  countdownTimer = window.setInterval(updateCountdown, 1000);
  contentElement.classList.remove("hidden");
}

async function loadListing(): Promise<void> {
  const listingId = getListingId();

  if (!listingId) {
    setStatus("Select a listing from Browse before placing a bid.", true);
    return;
  }

  setStatus("Loading artwork...");

  try {
    const response = await get<ApiResponse<Listing>>(
      `${API_BASE_URL}/${encodeURIComponent(listingId)}?_seller=true&_bids=true`,
    );
    renderListing(response.data);
    setStatus("");
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : "Could not load this artwork.",
      true,
    );
  }
}

bidForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setBidMessage("", false);

  if (!currentListing?.id) {
    setBidMessage("Artwork details are not available.", true);
    return;
  }

  const token = localStorage.getItem(TOKEN_STORAGE_KEY);

  if (!token) {
    setBidMessage("Log in before placing a bid.", true);
    return;
  }

  const amount = Number(bidAmountElement.value);
  const currentBid = getHighestBid(currentListing);
  const credits = getUserCredits();

  if (!Number.isFinite(amount) || amount <= currentBid) {
    setBidMessage(`Your bid must be higher than ${currentBid} credits.`, true);
    return;
  }

  if (amount > credits) {
    setBidMessage("You do not have enough credits for this bid.", true);
    return;
  }

  try {
    const apiKey = await getOrCreateApiKey(token);
    const response = await post<ApiResponse<Listing>, { amount: number }>(
      `${API_BASE_URL}/${encodeURIComponent(currentListing.id)}/bids`,
      { amount },
      token,
      apiKey,
    );
    currentListing = response.data;
    updateUserCredits(credits - amount);
    renderListing(currentListing);
    bidAmountElement.value = "";
    setBidMessage("Bid placed successfully.");
  } catch (error) {
    setBidMessage(
      error instanceof Error ? error.message : "Could not place bid.",
      true,
    );
  }
});

editListingForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentListing?.id || !isListingCreator(currentListing)) {
    setBidMessage("You can only update your own listings.", true);
    return;
  }

  const token = localStorage.getItem(TOKEN_STORAGE_KEY);

  if (!token) {
    setBidMessage("Log in before updating this listing.", true);
    return;
  }

  const title = editTitleElement.value.trim();
  const description = editDescriptionElement.value.trim();
  const surface = editSurfaceElement.value.trim();

  if (!title) {
    setBidMessage("Listing title is required.", true);
    return;
  }

  const tags = [
    APP_TAG,
    selectedEditCategory,
    surface ? `surface:${surface}` : "",
    ...(currentListing.tags || []).filter((tag) => {
      const normalizedTag = tag.toLowerCase();
      return (
        normalizedTag !== APP_TAG &&
        !CATEGORIES.includes(normalizedTag as (typeof CATEGORIES)[number]) &&
        !normalizedTag.startsWith("surface:") &&
        !normalizedTag.startsWith("reserve:")
      );
    }),
  ].filter(Boolean);
  const media = editMediaElement.value
    .split("\n")
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url) => ({ url, alt: title }));

  try {
    const apiKey = await getOrCreateApiKey(token);
    const response = await put<
      ApiResponse<Listing>,
      {
        title: string;
        description: string;
        tags: string[];
        media: { url: string; alt: string }[];
      }
    >(
      `${API_BASE_URL}/${encodeURIComponent(currentListing.id)}`,
      { title, description, tags, media },
      token,
      apiKey,
    );
    currentListing = {
      ...currentListing,
      ...response.data,
      seller: response.data.seller || currentListing.seller,
      bids: response.data.bids || currentListing.bids,
    };
    renderListing(currentListing);
    toggleEditListing(false);
    setBidMessage("Listing updated successfully.");
  } catch (error) {
    setBidMessage(
      error instanceof Error ? error.message : "Could not update listing.",
      true,
    );
  }
});

openEditListingButton.addEventListener("click", () => {
  toggleEditListing(true);
});

cancelEditListingButton.addEventListener("click", () => {
  if (currentListing) {
    renderListingManagement(currentListing);
  }
  toggleEditListing(false);
});

deleteListingButton.addEventListener("click", async () => {
  if (!currentListing?.id || !isListingCreator(currentListing)) {
    setBidMessage("You can only delete your own listings.", true);
    return;
  }

  if (!window.confirm("Delete this listing permanently?")) {
    return;
  }

  const token = localStorage.getItem(TOKEN_STORAGE_KEY);

  if (!token) {
    setBidMessage("Log in before deleting this listing.", true);
    return;
  }

  try {
    const apiKey = await getOrCreateApiKey(token);
    await deleteRequest<void>(
      `${API_BASE_URL}/${encodeURIComponent(currentListing.id)}`,
      token,
      apiKey,
    );
    window.location.href = "./profile.html";
  } catch (error) {
    setBidMessage(
      error instanceof Error ? error.message : "Could not delete listing.",
      true,
    );
  }
});

loadListing();
