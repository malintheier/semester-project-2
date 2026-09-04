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

function formatDeadline(endsAt?: string): string {
  const date = new Date(endsAt || "");

  if (Number.isNaN(date.getTime())) {
    return "Deadline unknown";
  }

  return `Ends ${date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
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

  const button = document.createElement("button");
  button.className = "group w-full text-left";
  button.type = "button";
  button.setAttribute("aria-label", `View ${listing.title || "artwork"}`);
  button.addEventListener("click", () => {
    const id = listing.id ? `?id=${encodeURIComponent(listing.id)}` : "";
    window.location.href = `./src/pages/place-bid.html${id}`;
  });

  const imageWrap = document.createElement("div");
  imageWrap.className =
    "relative aspect-[3/4] overflow-hidden bg-stone-200 lg:aspect-[4/5]";

  const image = document.createElement("img");
  const primaryImage = getPrimaryImage(listing);
  image.className =
    "h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 group-focus-visible:scale-105";
  image.src = primaryImage.url;
  image.alt = primaryImage.alt;
  image.loading = "lazy";

  const overlay = document.createElement("div");
  overlay.className =
    "absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100";
  overlay.setAttribute("aria-hidden", "true");

  imageWrap.append(image, overlay);

  const listingCategory = getCategory(listing);

  if (listingCategory) {
    const category = document.createElement("span");
    category.className =
      "absolute right-3 top-3 bg-paper px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.15em] text-ink lg:right-4 lg:top-4 lg:px-3 lg:py-2 lg:text-xs lg:tracking-[0.2em]";
    category.textContent = formatCategory(listingCategory);

    const medium = document.createElement("span");
    medium.className =
      "absolute bottom-3 left-3 text-xs font-semibold uppercase tracking-[0.15em] text-paper opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 lg:bottom-4 lg:left-4";
    medium.textContent = formatCategory(listingCategory);

    imageWrap.append(category, medium);
  }

  const details = document.createElement("div");
  details.className = "pt-3 lg:pt-4";

  const artist = document.createElement("a");
  artist.className =
    "cursor-pointer text-xs font-semibold uppercase tracking-[0.15em] text-muted-ink hover:text-ink";
  artist.href = `./src/pages/public-profile.html?name=${encodeURIComponent(listing.seller?.name || "")}`;
  artist.textContent = listing.seller?.name || "Arthaus artist";

  const title = document.createElement("h3");
  title.className =
    "mt-1 font-display text-sm font-bold italic sm:text-base lg:text-lg";
  title.textContent = listing.title || "Untitled artwork";

  const footer = document.createElement("div");
  footer.className =
    "mt-2 flex items-center justify-between gap-2 border-t border-line pt-2 text-xs font-bold lg:mt-3 lg:pt-3 lg:text-sm";

  const bid = document.createElement("span");
  bid.className = "text-ink";
  bid.textContent = `${getCurrentBid(listing)} credits`;

  const live = document.createElement("span");
  live.className = "text-right text-auction-red";
  live.textContent = formatDeadline(listing.endsAt);

  footer.append(bid, live);
  button.append(imageWrap, title, footer);
  details.append(artist, button);
  card.appendChild(details);

  return card;
}
