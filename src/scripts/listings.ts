import { get } from "../api/get";
import { createArtCard } from "../components/art-card";
import type { ApiResponse, Listing } from "../types";

const API_LISTINGS_URL = "https://v2.api.noroff.dev/auction/listings";
const APP_TAG = "arthaus";
const LISTINGS_PER_PAGE = 12;

const listElementQuery =
  document.querySelector<HTMLUListElement>("#active-listings");
const statusElementQuery = document.querySelector<HTMLParagraphElement>(
  "#active-listings-status",
);
const searchElementQuery =
  document.querySelector<HTMLInputElement>("#listings-search");
const categoryButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>(".category-filter"),
);
const sortElementQuery =
  document.querySelector<HTMLSelectElement>("#listings-sort");
const loadMoreButtonQuery = document.querySelector<HTMLButtonElement>(
  "#load-more-listings",
);
const featuredImageQuery =
  document.querySelector<HTMLImageElement>("#featured-image");
const featuredTitleQuery =
  document.querySelector<HTMLHeadingElement>("#featured-title");
const featuredArtistQuery =
  document.querySelector<HTMLParagraphElement>("#featured-artist");
const featuredMediumQuery =
  document.querySelector<HTMLParagraphElement>("#featured-medium");
const featuredBidQuery =
  document.querySelector<HTMLParagraphElement>("#featured-bid");
const featuredBidsQuery =
  document.querySelector<HTMLParagraphElement>("#featured-bids");
const featuredDeadlineQuery =
  document.querySelector<HTMLParagraphElement>("#featured-deadline");
const featuredBidLinkQuery =
  document.querySelector<HTMLAnchorElement>("#featured-bid-link");
let allListings: Listing[] = [];
let currentPage = 1;
let hasMoreListings = true;
let isLoading = false;
let selectedCategory = "all";

if (
  !listElementQuery ||
  !statusElementQuery ||
  !searchElementQuery ||
  !sortElementQuery ||
  !loadMoreButtonQuery ||
  !categoryButtons.length ||
  !featuredImageQuery ||
  !featuredTitleQuery ||
  !featuredArtistQuery ||
  !featuredMediumQuery ||
  !featuredBidQuery ||
  !featuredBidsQuery ||
  !featuredDeadlineQuery ||
  !featuredBidLinkQuery
) {
  throw new Error("Listings markup is missing required elements.");
}

const listElement = listElementQuery;
const statusElement = statusElementQuery;
const searchElement = searchElementQuery;
const sortElement = sortElementQuery;
const loadMoreButton = loadMoreButtonQuery;
const featuredImage = featuredImageQuery;
const featuredTitle = featuredTitleQuery;
const featuredArtist = featuredArtistQuery;
const featuredMedium = featuredMediumQuery;
const featuredBid = featuredBidQuery;
const featuredBids = featuredBidsQuery;
const featuredDeadline = featuredDeadlineQuery;
const featuredBidLink = featuredBidLinkQuery;

function setStatus(text: string, isError = false): void {
  statusElement.textContent = text;
  statusElement.style.color = isError ? "#b00020" : "inherit";
}

function getListingKeywords(listing: Listing): string {
  const tags = Array.isArray(listing.tags) ? listing.tags.join(" ") : "";
  const description = String(listing.description || "");
  const artist = String(listing.seller?.name || "");
  return `${tags} ${description} ${artist}`.toLowerCase();
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

function getCurrentBid(listing: Listing): number {
  return (listing.bids || []).reduce((highest, bid) => {
    const amount = Number(bid.amount || 0);
    return amount > highest ? amount : highest;
  }, 0);
}

function formatDeadline(endsAt?: string): string {
  const date = new Date(endsAt || "");
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleDateString();
}

function filterAndSortListings(): Listing[] {
  const query = searchElement.value;
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = allListings.filter(
    (listing) =>
      matchesSearch(listing, normalizedQuery) &&
      matchesCategory(listing, selectedCategory),
  );

  return filtered.sort((first, second) => {
    if (sortElement.value === "highest-bid") {
      return getCurrentBid(second) - getCurrentBid(first);
    }

    if (sortElement.value === "lowest-bid") {
      return getCurrentBid(first) - getCurrentBid(second);
    }

    return (
      new Date(first.endsAt || "").getTime() -
      new Date(second.endsAt || "").getTime()
    );
  });
}

function renderFeatured(listing: Listing): void {
  const image = listing.media?.find((item) => item.url);
  const category = listing.tags?.find((tag) =>
    ["oil", "acrylic", "watercolor"].includes(tag.toLowerCase()),
  );
  const id = listing.id ? `?id=${encodeURIComponent(listing.id)}` : "";

  featuredImage.src = image?.url || "";
  featuredImage.alt = image?.alt || listing.title || "Featured artwork";
  featuredTitle.textContent = listing.title || "Untitled artwork";
  featuredArtist.textContent = listing.seller?.name || "Arthaus artist";
  featuredMedium.textContent = category || "Contemporary artwork";
  featuredBid.textContent = `${getCurrentBid(listing)} credits`;
  featuredBids.textContent = String(
    listing._count?.bids ?? listing.bids?.length ?? 0,
  );
  featuredDeadline.textContent = formatDeadline(listing.endsAt);
  featuredBidLink.href = `./src/pages/place-bid.html${id}`;
}

function getNewestListing(listings: Listing[]): Listing | undefined {
  return listings.reduce<Listing | undefined>((newest, listing) => {
    if (!newest) {
      return listing;
    }

    const newestCreated = new Date(newest.created || "").getTime();
    const listingCreated = new Date(listing.created || "").getTime();
    return listingCreated > newestCreated ? listing : newest;
  }, undefined);
}

function renderListings(): void {
  const listings = filterAndSortListings();
  listElement.innerHTML = "";

  if (!listings.length) {
    const hasQuery = searchElement.value.trim().length > 0;
    const hasCategoryFilter = selectedCategory !== "all";

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

function updateLoadMoreButton(): void {
  loadMoreButton.classList.toggle("hidden", !hasMoreListings);
  loadMoreButton.disabled = isLoading;
  loadMoreButton.textContent = isLoading ? "Loading..." : "Load more";
}

function getListingsUrl(page: number): string {
  const parameters = new URLSearchParams({
    _active: "true",
    _tag: APP_TAG,
    _bids: "true",
    _seller: "true",
    limit: String(LISTINGS_PER_PAGE),
    page: String(page),
    sort: "created",
    sortOrder: "desc",
  });

  return `${API_LISTINGS_URL}?${parameters.toString()}`;
}

async function loadActiveListings(loadMore = false): Promise<void> {
  if (isLoading || (!loadMore && !hasMoreListings)) {
    return;
  }

  isLoading = true;
  updateLoadMoreButton();
  setStatus(
    loadMore ? "Loading more listings..." : "Loading active listings...",
  );

  try {
    const response = await get<ApiResponse<Listing[]>>(
      getListingsUrl(currentPage),
    );
    const listings = Array.isArray(response.data) ? response.data : [];
    allListings = loadMore ? [...allListings, ...listings] : listings;
    hasMoreListings = listings.length === LISTINGS_PER_PAGE;
    currentPage += 1;
    const newestListing = !loadMore ? getNewestListing(listings) : undefined;

    if (newestListing) {
      renderFeatured(newestListing);
    }
    renderListings();
  } catch (error) {
    setStatus(
      error instanceof Error
        ? error.message
        : "Could not load active listings.",
      true,
    );
  } finally {
    isLoading = false;
    updateLoadMoreButton();
  }
}

searchElement.addEventListener("input", () => {
  renderListings();
});

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedCategory = button.dataset.category || "all";
    categoryButtons.forEach((categoryButton) => {
      const isSelected = categoryButton === button;
      categoryButton.className = isSelected
        ? "category-filter border border-auction-red bg-auction-red px-4 py-2 text-xs font-medium uppercase tracking-[0.15em] text-white"
        : "category-filter border border-line bg-white px-4 py-2 text-xs font-medium uppercase tracking-[0.15em] text-muted-ink";
    });
    renderListings();
  });
});

sortElement.addEventListener("change", () => {
  renderListings();
});

loadMoreButton.addEventListener("click", () => {
  loadActiveListings(true);
});

loadActiveListings();
