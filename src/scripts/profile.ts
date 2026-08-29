import { get } from "../api/get";
import type { ApiResponse, Bid, Listing, Profile } from "../types";
import { getOrCreateApiKey } from "./api-key";
import { getUserState, setUserState, TOKEN_STORAGE_KEY } from "./user-state";
import "../styles/tailwind.css";

const API_BASE_URL = "https://v2.api.noroff.dev/auction/profiles";

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Profile markup is missing ${selector}.`);
  }

  return element;
}

const statusElement = requireElement<HTMLParagraphElement>("#profile-status");
const contentElement = requireElement<HTMLDivElement>("#profile-content");
const bannerElement = requireElement<HTMLImageElement>("#profile-banner");
const avatarElement = requireElement<HTMLImageElement>("#profile-avatar");
const initialsElement = requireElement<HTMLSpanElement>("#profile-initials");
const nameElement = requireElement<HTMLHeadingElement>("#profile-name");
const metaElement = requireElement<HTMLParagraphElement>("#profile-meta");
const bioElement = requireElement<HTMLParagraphElement>("#profile-bio");
const creditsElement = requireElement<HTMLParagraphElement>("#profile-credits");
const listingsTab = requireElement<HTMLButtonElement>("#listings-tab");
const bidsTab = requireElement<HTMLButtonElement>("#bids-tab");
const listingsPanel = requireElement<HTMLElement>("#listings-panel");
const bidsPanel = requireElement<HTMLElement>("#bids-panel");
const listingsElement = requireElement<HTMLUListElement>("#profile-listings");
const bidsElement = requireElement<HTMLOListElement>("#profile-bids");

function setStatus(text: string, isError = false): void {
  statusElement.textContent = text;
  statusElement.className = isError
    ? "mx-auto max-w-6xl px-4 pt-6 text-sm text-[#c0392b] sm:px-6 lg:px-10"
    : "mx-auto max-w-6xl px-4 pt-6 text-sm sm:px-6 lg:px-10";
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
  return (listing?.bids || []).reduce((highest, bid) => {
    const amount = Number(bid.amount || 0);
    return amount > highest ? amount : highest;
  }, 0);
}

function renderProfile(profile: Profile): void {
  nameElement.textContent = profile.name;
  metaElement.textContent = profile.email;
  bioElement.textContent = profile.bio || "No bio added yet.";
  creditsElement.textContent = String(profile.credits ?? 0);
  initialsElement.textContent = getInitials(profile.name);

  if (profile.avatar?.url) {
    avatarElement.src = profile.avatar.url;
    avatarElement.alt = profile.avatar.alt || `${profile.name}'s avatar`;
    avatarElement.classList.remove("hidden");
    initialsElement.classList.add("hidden");
  }

  if (profile.banner?.url) {
    bannerElement.src = profile.banner.url;
    bannerElement.alt = profile.banner.alt || `${profile.name}'s banner`;
    bannerElement.classList.remove("hidden");
  }
}

function renderListings(listings: Listing[], profileName: string): void {
  listingsElement.innerHTML = "";

  if (!listings.length) {
    const item = document.createElement("li");
    item.className =
      "col-span-full border-b border-line py-5 text-sm text-muted-ink";
    item.textContent = "You have not submitted any work yet.";
    listingsElement.appendChild(item);
    return;
  }

  listings.forEach((listing) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.className = "w-full text-left";
    button.type = "button";
    button.addEventListener("click", () => {
      const id = listing.id ? `?id=${encodeURIComponent(listing.id)}` : "";
      window.location.href = `./place-bid.html${id}`;
    });

    const image = document.createElement("img");
    const artwork = getImage(listing);
    image.className = "aspect-[3/4] w-full bg-stone-200 object-cover";
    image.src = artwork.url;
    image.alt = artwork.alt;
    image.loading = "lazy";

    const artist = document.createElement("p");
    artist.className =
      "mt-3 text-xs font-semibold uppercase tracking-[0.15em] text-muted-ink";
    artist.textContent = profileName;

    const title = document.createElement("h2");
    title.className = "mt-1 font-display text-base font-bold italic sm:text-lg";
    title.textContent = listing.title || "Untitled artwork";

    const bid = document.createElement("p");
    bid.className = "mt-2 border-t border-line pt-2 text-sm font-bold";
    bid.textContent = `${getHighestBid(listing)} credits`;

    button.append(image, artist, title, bid);
    item.appendChild(button);
    listingsElement.appendChild(item);
  });
}

function renderBids(bids: Bid[]): void {
  bidsElement.innerHTML = "";

  if (!bids.length) {
    const item = document.createElement("li");
    item.className = "border-b border-line py-5 text-sm text-muted-ink";
    item.textContent = "You have not placed any bids yet.";
    bidsElement.appendChild(item);
    return;
  }

  bids.forEach((bid) => {
    const item = document.createElement("li");
    item.className =
      "flex items-center gap-3 border-b border-line py-4 sm:gap-5 sm:py-5";

    const image = document.createElement("img");
    const artwork = getImage(bid.listing);
    image.className =
      "h-12 w-12 shrink-0 bg-stone-200 object-cover sm:h-16 sm:w-16";
    image.src = artwork.url;
    image.alt = artwork.alt;

    const details = document.createElement("div");
    details.className = "min-w-0 flex-1";

    const title = document.createElement("h2");
    title.className =
      "truncate font-display text-base font-bold italic sm:text-lg";
    title.textContent = bid.listing?.title || "Artwork";

    const artist = document.createElement("p");
    artist.className = "mt-1 font-display text-sm italic text-muted-ink";
    artist.textContent = bid.listing?.seller?.name || "Arthaus artist";

    const amount = document.createElement("p");
    amount.className = "shrink-0 text-right text-sm font-bold sm:text-base";
    amount.textContent = `${Number(bid.amount || 0)} credits`;

    details.append(title, artist);
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
    ? "border-b-2 border-auction-red px-6 py-3 text-sm font-semibold text-auction-red"
    : "px-6 py-3 text-sm font-semibold text-muted-ink";
  bidsTab.className = showListings
    ? "px-6 py-3 text-sm font-semibold text-muted-ink"
    : "border-b-2 border-auction-red px-6 py-3 text-sm font-semibold text-auction-red";
}

async function loadProfile(): Promise<void> {
  const user = getUserState();
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);

  if (!user || !token) {
    setStatus("Log in to view your profile.", true);
    return;
  }

  setStatus("Loading profile...");

  try {
    const apiKey = await getOrCreateApiKey(token);
    const profileResponse = await get<ApiResponse<Profile>>(
      `${API_BASE_URL}/${encodeURIComponent(user.name)}?_listings=true`,
      token,
      apiKey,
    );
    const bidsResponse = await get<ApiResponse<Bid[]>>(
      `${API_BASE_URL}/${encodeURIComponent(user.name)}/bids?_listings=true`,
      token,
      apiKey,
    );
    const profile = profileResponse.data;

    setUserState({
      name: profile.name,
      email: profile.email,
      credits: Number(profile.credits ?? 0),
      avatarUrl: profile.avatar?.url,
    });
    renderProfile(profile);
    renderListings(profile.listings || [], profile.name);
    renderBids(bidsResponse.data || []);
    contentElement.classList.remove("hidden");
    setStatus("");
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : "Could not load your profile.",
      true,
    );
  }
}

listingsTab.addEventListener("click", () => showTab("listings"));
bidsTab.addEventListener("click", () => showTab("bids"));

loadProfile();
