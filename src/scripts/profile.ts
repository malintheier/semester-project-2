import { get } from "../api/get";
import type { ApiResponse, Bid, Listing, Profile } from "../types";
import { getOrCreateApiKey } from "./api-key";
import {
  getCustomAvatar,
  getCustomBanner,
  getUserState,
  setUserState,
  TOKEN_STORAGE_KEY,
} from "./user-state";
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
const defaultBannerElement = requireElement<HTMLDivElement>(
  "#profile-banner-default",
);
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

  if (!text) {
    statusElement.className = "hidden";
    return;
  }

  statusElement.className = isError
    ? "mx-auto max-w-6xl px-4 pt-6 text-sm text-[#c0392b] sm:px-6 lg:px-10"
    : "mx-auto max-w-6xl px-4 pt-6 text-sm sm:px-6 lg:px-10";
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

function getBidArtistName(bid: Bid): string {
  const sellerName = bid.listing?.seller?.name?.trim();
  if (sellerName) {
    return sellerName;
  }

  const seller = bid.listing?.seller as unknown;
  if (typeof seller === "string" && seller.trim()) {
    return seller.trim();
  }

  if (seller && typeof seller === "object") {
    const maybeName = Object.values(seller as Record<string, unknown>).find(
      (value) => typeof value === "string" && value.trim(),
    );

    if (typeof maybeName === "string" && maybeName.trim()) {
      return maybeName.trim();
    }
  }

  return "Arthaus publisher";
}

async function hydrateBidsWithSeller(bids: Bid[]): Promise<Bid[]> {
  const missingSellerBids = bids.filter(
    (bid) => !bid.listing?.seller?.name && bid.listing?.id,
  );

  if (!missingSellerBids.length) {
    return bids;
  }

  const enrichedBids = await Promise.all(
    bids.map(async (bid) => {
      if (bid.listing?.seller?.name || !bid.listing?.id) {
        return bid;
      }

      try {
        const listingResponse = await get<ApiResponse<Listing>>(
          `https://v2.api.noroff.dev/auction/listings/${encodeURIComponent(bid.listing.id)}?_seller=true`,
        );
        return {
          ...bid,
          listing: {
            ...(bid.listing || {}),
            ...(listingResponse.data || {}),
          },
        };
      } catch {
        return bid;
      }
    }),
  );

  return enrichedBids;
}

function renderProfile(profile: Profile): void {
  const displayName = profile.name;

  avatarElement.removeAttribute("src");
  avatarElement.alt = "";
  avatarElement.classList.add("hidden");

  bannerElement.removeAttribute("src");
  bannerElement.alt = "";
  bannerElement.classList.add("hidden");
  if (defaultBannerElement) defaultBannerElement.classList.add("hidden");

  nameElement.textContent = `@${displayName}`;
  metaElement.textContent = profile.email;
  bioElement.textContent = profile.bio || "No bio added yet.";
  creditsElement.textContent = String(profile.credits ?? 0);

  const customAvatarUrl = getCustomAvatar(profile.email, profile.name);
  const avatarUrl = customAvatarUrl || profile.avatar?.url?.trim();

  if (avatarUrl) {
    avatarElement.src = avatarUrl;
    avatarElement.alt = profile.avatar?.alt || `${displayName}'s avatar`;
    avatarElement.onerror = () => {
      avatarElement.removeAttribute("src");
      avatarElement.alt = "";
      avatarElement.classList.add("hidden");
    };
    avatarElement.classList.remove("hidden");
  }

  const customBannerUrl = getCustomBanner(profile.email, profile.name);
  const bannerUrl = customBannerUrl || profile.banner?.url?.trim();

  if (bannerUrl) {
    bannerElement.src = bannerUrl;
    bannerElement.alt = profile.banner?.alt || `${displayName}'s banner`;
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
    artist.textContent = getBidArtistName(bid);

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
    ? "border-b-2 border-auction-red px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-auction-red"
    : "px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-muted-ink";
  bidsTab.className = showListings
    ? "px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-muted-ink"
    : "border-b-2 border-auction-red px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-auction-red";
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
      `${API_BASE_URL}/${encodeURIComponent(user.name)}/bids?_listings=true&_seller=true`,
      token,
      apiKey,
    );
    const profile = profileResponse.data;
    const customAvatarUrl = getCustomAvatar(profile.email, profile.name);
    setUserState({
      name: profile.name,
      email: profile.email,
      credits: Number(profile.credits ?? 0),
      avatarUrl: customAvatarUrl || profile.avatar?.url || undefined,
    });
    const bidsWithSeller = await hydrateBidsWithSeller(bidsResponse.data || []);

    renderProfile(profile);
    renderListings(profile.listings || [], profile.name);
    renderBids(bidsWithSeller);
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
