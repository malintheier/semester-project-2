import type { Listing } from "../types";

const CATEGORIES = ["oil", "acrylic", "watercolor"] as const;

type Category = (typeof CATEGORIES)[number];

function getCurrentBid(listing: Listing): number {
  const bids = Array.isArray(listing.bids) ? listing.bids : [];

  return bids.reduce((highest, bid) => {
    const amount = Number(bid.amount || 0);
    return amount > highest ? amount : highest;
  }, 0);
}

function formatCountdown(endsAt?: string): string {
  const now = new Date();
  const end = new Date(endsAt || "");

  if (Number.isNaN(end.getTime())) {
    return "00 00 00";
  }

  const diff = end.getTime() - now.getTime();

  if (diff <= 0) {
    return "00 00 00";
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${String(hours).padStart(2, "0")}H ${String(minutes).padStart(2, "0")}M ${String(seconds).padStart(2, "0")}S`;
}

function getPrimaryImage(listing: Listing): { url: string; alt: string } {
  const media = Array.isArray(listing.media) ? listing.media[0] : undefined;

  return {
    url: media?.url || "",
    alt: media?.alt || listing.title || "Artwork image",
  };
}

function getCategory(listing: Listing): Category | null {
  const tags = Array.isArray(listing.tags) ? listing.tags : [];
  const category = tags
    .map((tag) => tag.toLowerCase())
    .find((tag): tag is Category => CATEGORIES.includes(tag as Category));

  return category || null;
}

function formatCategory(category: Category): string {
  return `${category[0].toUpperCase()}${category.slice(1)}`;
}

export function createArtCard(listing: Listing): HTMLLIElement {
  const card = document.createElement("li");
  card.className = "min-w-0";

  const cardContent = document.createElement("div");
  cardContent.className = "w-full text-left";

  // Image container with 4/5 aspect ratio
  const imageWrap = document.createElement("div");
  imageWrap.className =
    "group relative mb-4 aspect-[4/5] overflow-hidden bg-stone-200 cursor-pointer";

  const image = document.createElement("img");
  const primaryImage = getPrimaryImage(listing);
  image.className =
    "h-full w-full object-cover transition-transform duration-700 group-hover:scale-105";
  image.src = primaryImage.url;
  image.alt = primaryImage.alt;
  image.loading = "lazy";

  // Hover overlay
  const overlay = document.createElement("div");
  overlay.className =
    "absolute inset-0 bg-gradient-to-t from-[rgba(13,12,10,0.7)] to-transparent opacity-0 transition-opacity duration-400 group-hover:opacity-100";
  overlay.setAttribute("aria-hidden", "true");

  imageWrap.append(image, overlay);

  // Category badge (top right)
  const listingCategory = getCategory(listing);
  if (listingCategory) {
    const categoryBadge = document.createElement("span");
    categoryBadge.className =
      "absolute right-2 top-2 bg-paper px-2 py-1 text-xs font-medium uppercase tracking-widest text-muted-ink";
    categoryBadge.textContent = formatCategory(listingCategory);
    imageWrap.append(categoryBadge);
  }

  // Publisher name
  const publisher = document.createElement("a");
  publisher.className =
    "inline-block text-xs font-medium uppercase tracking-widest text-muted-ink hover:opacity-60 transition-opacity mb-1";
  publisher.href = `./src/pages/public-profile.html?name=${encodeURIComponent(listing.seller?.name || "")}`;
  publisher.textContent = listing.seller?.name || "Arthaus publisher";

  // Title
  const title = document.createElement("h3");
  title.className = "font-display text-lg font-bold italic leading-tight mb-3";
  title.textContent = listing.title || "Untitled artwork";

  // Separator
  const separator = document.createElement("hr");
  separator.className = "border-t border-line pt-3 mb-2";

  // "Current bid" label
  const bidLabel = document.createElement("p");
  bidLabel.className =
    "text-xs font-medium uppercase tracking-widest text-muted-ink mb-0.5";
  bidLabel.textContent = "Current Bid";

  // Bid value and countdown
  const bidRow = document.createElement("div");
  bidRow.className = "flex items-baseline justify-between gap-4";

  const bidValue = document.createElement("span");
  bidValue.className = "text-lg font-bold text-ink";
  bidValue.textContent = `${getCurrentBid(listing)} credits`;

  const countdownBadge = document.createElement("span");
  countdownBadge.className =
    "text-xs font-bold uppercase tracking-widest text-auction-red";
  countdownBadge.textContent = formatCountdown(listing.endsAt);

  // Set up live countdown update
  const countdownTimer = setInterval(() => {
    countdownBadge.textContent = formatCountdown(listing.endsAt);
  }, 1000);

  // Clean up timer when card is removed
  card.addEventListener("remove", () => clearInterval(countdownTimer));

  // Make the entire card clickable
  imageWrap.addEventListener("click", () => {
    const id = listing.id ? `?id=${encodeURIComponent(listing.id)}` : "";
    window.location.href = `./src/pages/place-bid.html${id}`;
  });

  bidRow.append(bidValue, countdownBadge);
  cardContent.append(imageWrap, publisher, title, separator, bidLabel, bidRow);
  card.appendChild(cardContent);

  return card;
}
