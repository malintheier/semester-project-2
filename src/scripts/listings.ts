import { get } from "../api/get";
import { createArtCard } from "../components/art-card";
import type { ApiResponse, Listing } from "../types";

const API_LISTINGS_URL =
  "https://v2.api.noroff.dev/auction/listings?_active=true&_bids=true&_seller=true";

const listElementQuery =
  document.querySelector<HTMLUListElement>("#active-listings");
const statusElementQuery = document.querySelector<HTMLParagraphElement>(
  "#active-listings-status",
);
const searchElementQuery =
  document.querySelector<HTMLInputElement>("#listings-search");
const categoryElementQuery =
  document.querySelector<HTMLSelectElement>("#listings-category");
let allListings: Listing[] = [];

if (
  !listElementQuery ||
  !statusElementQuery ||
  !searchElementQuery ||
  !categoryElementQuery
) {
  throw new Error("Listings markup is missing required elements.");
}

const listElement = listElementQuery;
const statusElement = statusElementQuery;
const searchElement = searchElementQuery;
const categoryElement = categoryElementQuery;

function setStatus(text: string, isError = false): void {
  statusElement.textContent = text;
  statusElement.style.color = isError ? "#b00020" : "inherit";
}

function getListingKeywords(listing: Listing): string {
  const tags = Array.isArray(listing.tags) ? listing.tags.join(" ") : "";
  const description = String(listing.description || "");
  return `${tags} ${description}`.toLowerCase();
}

function matchesSearch(listing: Listing, query: string): boolean {
  if (!query) {
    return true;
  }

  const title = String(listing.title || "").toLowerCase();
  const keywords = getListingKeywords(listing);
  return title.includes(query) || keywords.includes(query);
}

function matchesCategory(listing: Listing, category: string): boolean {
  if (category === "all") {
    return true;
  }

  const tags = Array.isArray(listing.tags)
    ? listing.tags.map((tag) => String(tag).toLowerCase())
    : [];

  return tags.includes(category);
}

function filterListings(query: string, category: string): Listing[] {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedCategory = category.toLowerCase();

  return allListings.filter(
    (listing) =>
      matchesSearch(listing, normalizedQuery) &&
      matchesCategory(listing, normalizedCategory),
  );
}

function renderListings(listings: Listing[]): void {
  listElement.innerHTML = "";

  if (!listings.length) {
    const hasQuery = searchElement.value.trim().length > 0;
    const hasCategoryFilter = categoryElement.value.toLowerCase() !== "all";

    setStatus(
      hasQuery || hasCategoryFilter
        ? "No listings match your search."
        : "No active listings right now.",
    );
    return;
  }

  const fragment = document.createDocumentFragment();

  listings.forEach((listing) => {
    fragment.appendChild(createArtCard(listing));
  });

  listElement.appendChild(fragment);
  setStatus(`Showing ${listings.length} active listings.`);
}

async function loadActiveListings(): Promise<void> {
  setStatus("Loading active listings...");

  try {
    const response = await get<ApiResponse<Listing[]>>(API_LISTINGS_URL);
    allListings = Array.isArray(response.data) ? response.data : [];
    renderListings(filterListings(searchElement.value, categoryElement.value));
  } catch (error) {
    setStatus(
      error instanceof Error
        ? error.message
        : "Could not load active listings.",
      true,
    );
  }
}

searchElement.addEventListener("input", () => {
  renderListings(filterListings(searchElement.value, categoryElement.value));
});

categoryElement.addEventListener("change", () => {
  renderListings(filterListings(searchElement.value, categoryElement.value));
});

loadActiveListings();
