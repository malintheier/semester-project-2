import type { Listing } from "../types";

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

function getMedium(listing: Listing): string {
  const tags = Array.isArray(listing.tags) ? listing.tags : [];
  return tags[0] || "Artwork";
}

export function createArtCard(listing: Listing, index: number): HTMLLIElement {
  const card = document.createElement("li");
  card.className = "art-card";

  const button = document.createElement("button");
  button.className = "art-card__button";
  button.type = "button";
  button.setAttribute("aria-label", `View ${listing.title || "artwork"}`);
  button.addEventListener("click", () => {
    const id = listing.id ? `?id=${encodeURIComponent(listing.id)}` : "";
    window.location.href = `./src/pages/place-bid.html${id}`;
  });

  const imageWrap = document.createElement("div");
  imageWrap.className = "art-card__image-wrap";

  const image = document.createElement("img");
  const primaryImage = getPrimaryImage(listing);
  image.className = "art-card__image";
  image.src = primaryImage.url;
  image.alt = primaryImage.alt;
  image.loading = "lazy";

  const overlay = document.createElement("div");
  overlay.className = "art-card__overlay";
  overlay.setAttribute("aria-hidden", "true");

  const number = document.createElement("span");
  number.className = "art-card__number";
  number.setAttribute("aria-hidden", "true");
  number.textContent = String(index + 1).padStart(2, "0");

  const category = document.createElement("span");
  category.className = "art-card__category";
  category.textContent = getMedium(listing);

  const medium = document.createElement("span");
  medium.className = "art-card__medium";
  medium.textContent = getMedium(listing);

  imageWrap.append(image, overlay, number, category, medium);

  const details = document.createElement("div");
  details.className = "art-card__details";

  const artist = document.createElement("p");
  artist.className = "art-card__artist";
  artist.textContent = listing.seller?.name || "Arthaus artist";

  const title = document.createElement("h3");
  title.className = "art-card__title";
  title.textContent = listing.title || "Untitled artwork";

  const footer = document.createElement("div");
  footer.className = "art-card__footer";

  const bid = document.createElement("span");
  bid.className = "art-card__bid";
  bid.textContent = `${getCurrentBid(listing)} credits`;

  const live = document.createElement("span");
  live.className = "art-card__live";
  live.textContent = formatDeadline(listing.endsAt);

  footer.append(bid, live);
  details.append(artist, title, footer);
  button.append(imageWrap, details);
  card.appendChild(button);

  return card;
}
