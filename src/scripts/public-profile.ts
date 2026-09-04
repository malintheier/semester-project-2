import { get } from "../api/get";
import type { ApiResponse, Bid, Listing, Profile } from "../types";
import { getOrCreateApiKey } from "./api-key";
import { getUserState, TOKEN_STORAGE_KEY } from "./user-state";
import "../styles/tailwind.css";

const API_BASE_URL = "https://v2.api.noroff.dev/auction/profiles";

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Public profile markup is missing ${selector}.`);
  }

  return element;
}

const statusElement = requireElement<HTMLParagraphElement>(
  "#public-profile-status",
);
const contentElement = requireElement<HTMLDivElement>(
  "#public-profile-content",
);
const bannerElement = requireElement<HTMLImageElement>(
  "#public-profile-banner",
);
const avatarElement = requireElement<HTMLImageElement>(
  "#public-profile-avatar",
);
const initialsElement = requireElement<HTMLSpanElement>(
  "#public-profile-initials",
);
const nameElement = requireElement<HTMLHeadingElement>("#public-profile-name");
const metaElement = requireElement<HTMLParagraphElement>(
  "#public-profile-meta",
);
const bioElement = requireElement<HTMLParagraphElement>("#public-profile-bio");
const creditsElement = requireElement<HTMLParagraphElement>(
  "#public-profile-credits",
);
const listingsTab = requireElement<HTMLButtonElement>("#public-listings-tab");
const bidsTab = requireElement<HTMLButtonElement>("#public-bids-tab");
const listingsPanel = requireElement<HTMLElement>("#public-listings-panel");
const bidsPanel = requireElement<HTMLElement>("#public-bids-panel");
const listingsElement = requireElement<HTMLUListElement>(
  "#public-profile-listings",
);
const bidsElement = requireElement<HTMLOListElement>("#public-profile-bids");

function setStatus(text: string, isError = false): void {
  statusElement.textContent = text;
  statusElement.className = text
    ? isError
      ? "mx-auto max-w-6xl px-4 pt-6 text-sm text-[#c0392b] sm:px-6 lg:px-10"
      : "mx-auto max-w-6xl px-4 pt-6 text-sm sm:px-6 lg:px-10"
    : "hidden";
}

function getInitials(name: string): string {
  return name
    .split(/[._\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function getImage(listing?: Listing): { url: string; alt: string } {
  const media = listing?.media?.find((item) => item.url);
  return {
    url: media?.url || "",
    alt: media?.alt || listing?.title || "Artwork image",
  };
}

function getHighestBid(listing?: Listing): number {
  return (listing?.bids || []).reduce(
    (highest, bid) => Math.max(highest, Number(bid.amount || 0)),
    0,
  );
}

function openListing(listing: Listing): void {
  const id = listing.id ? `?id=${encodeURIComponent(listing.id)}` : "";
  window.location.href = `./place-bid.html${id}`;
}

function renderProfile(profile: Profile): void {
  nameElement.textContent = profile.name;
  metaElement.textContent = `@${profile.name}`;
  bioElement.textContent = profile.bio || "No bio added yet.";
  creditsElement.textContent = String(profile.credits ?? 0);
  initialsElement.textContent = getInitials(profile.name);

  if (profile.avatar?.url) {
    avatarElement.src = profile.avatar.url;
    avatarElement.alt = profile.avatar.alt || `${profile.name}'s avatar`;
    avatarElement.onerror = () => {
      avatarElement.classList.add("hidden");
      initialsElement.classList.remove("hidden");
    };
    avatarElement.classList.remove("hidden");
    initialsElement.classList.add("hidden");
  }

  if (profile.banner?.url) {
    bannerElement.src = profile.banner.url;
    bannerElement.alt = profile.banner.alt || `${profile.name}'s banner`;
    bannerElement.classList.remove("hidden");
  }
}

function renderListings(listings: Listing[]): void {
  listingsElement.innerHTML = "";

  if (!listings.length) {
    listingsElement.innerHTML =
      '<li class="col-span-full border-b border-line py-5 text-sm text-muted-ink">No listings yet.</li>';
    return;
  }

  listings.forEach((listing) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.className = "w-full text-left";
    button.type = "button";
    button.addEventListener("click", () => openListing(listing));

    const image = document.createElement("img");
    const artwork = getImage(listing);
    image.className = "aspect-[3/4] w-full bg-muted object-cover";
    image.src = artwork.url;
    image.alt = artwork.alt;

    const title = document.createElement("h2");
    title.className = "mt-3 font-display text-base font-bold italic sm:text-lg";
    title.textContent = listing.title || "Untitled artwork";

    const bid = document.createElement("p");
    bid.className = "mt-2 border-t border-line pt-2 text-sm font-bold";
    bid.textContent = `${getHighestBid(listing)} credits`;

    button.append(image, title, bid);
    item.appendChild(button);
    listingsElement.appendChild(item);
  });
}

function renderBids(bids: Bid[]): void {
  bidsElement.innerHTML = "";

  if (!bids.length) {
    bidsElement.innerHTML =
      '<li class="border-b border-line py-5 text-sm text-muted-ink">No bids yet.</li>';
    return;
  }

  bids.forEach((bid) => {
    const item = document.createElement("li");
    item.className =
      "flex items-center gap-3 border-b border-line py-4 sm:gap-5 sm:py-5";

    const image = document.createElement("img");
    const artwork = getImage(bid.listing);
    image.className =
      "h-12 w-12 shrink-0 bg-muted object-cover sm:h-16 sm:w-16";
    image.src = artwork.url;
    image.alt = artwork.alt;

    const details = document.createElement("div");
    details.className = "min-w-0 flex-1";
    const title = document.createElement("h2");
    title.className =
      "truncate font-display text-base font-bold italic sm:text-lg";
    title.textContent = bid.listing?.title || "Artwork";
    const amount = document.createElement("p");
    amount.className = "shrink-0 text-right text-sm font-bold sm:text-base";
    amount.textContent = `${Number(bid.amount || 0)} credits`;

    details.appendChild(title);
    item.append(image, details, amount);
    bidsElement.appendChild(item);
  });
}

function showTab(tab: "listings" | "bids"): void {
  const showListings = tab === "listings";
  listingsPanel.classList.toggle("hidden", !showListings);
  bidsPanel.classList.toggle("hidden", showListings);
  listingsTab.setAttribute("aria-selected", String(showListings));
  bidsTab.setAttribute("aria-selected", String(!showListings));
  listingsTab.className = showListings
    ? "border-b-2 border-auction-red px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-auction-red"
    : "px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-muted-ink";
  bidsTab.className = showListings
    ? "px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-muted-ink"
    : "border-b-2 border-auction-red px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-auction-red";
}

async function loadPublicProfile(): Promise<void> {
  const profileName = new URLSearchParams(window.location.search).get("name");
  const user = getUserState();
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);

  if (!profileName) {
    setStatus("Select an artist profile from a listing.", true);
    return;
  }

  if (user?.name === profileName) {
    window.location.href = "./profile.html";
    return;
  }

  if (!token) {
    setStatus("Log in to view artist profiles.", true);
    return;
  }

  setStatus("Loading profile...");

  try {
    const apiKey = await getOrCreateApiKey(token);
    const profileResponse = await get<ApiResponse<Profile>>(
      `${API_BASE_URL}/${encodeURIComponent(profileName)}?_listings=true`,
      token,
      apiKey,
    );
    const bidsResponse = await get<ApiResponse<Bid[]>>(
      `${API_BASE_URL}/${encodeURIComponent(profileName)}/bids?_listings=true`,
      token,
      apiKey,
    );
    renderProfile(profileResponse.data);
    renderListings(profileResponse.data.listings || []);
    renderBids(bidsResponse.data || []);
    contentElement.classList.remove("hidden");
    setStatus("");
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : "Could not load this profile.",
      true,
    );
  }
}

listingsTab.addEventListener("click", () => showTab("listings"));
bidsTab.addEventListener("click", () => showTab("bids"));

loadPublicProfile();
