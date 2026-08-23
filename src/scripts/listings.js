const API_LISTINGS_URL =
  "https://v2.api.noroff.dev/auction/listings?_active=true&_bids=true";

const listElement = document.querySelector("#active-listings");
const statusElement = document.querySelector("#active-listings-status");

if (!listElement || !statusElement) {
  throw new Error("Listings markup is missing required elements.");
}

function setStatus(text, isError = false) {
  statusElement.textContent = text;
  statusElement.style.color = isError ? "#b00020" : "inherit";
}

function getCurrentBid(listing) {
  const bids = Array.isArray(listing?.bids) ? listing.bids : [];

  if (!bids.length) {
    return 0;
  }

  return bids.reduce((highest, bid) => {
    const amount = Number(bid?.amount || 0);
    return amount > highest ? amount : highest;
  }, 0);
}

function formatDeadline(endsAt) {
  const date = new Date(endsAt);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString();
}

function getPrimaryImage(listing) {
  const firstMedia = Array.isArray(listing?.media) ? listing.media[0] : null;

  return {
    url: firstMedia?.url || "",
    alt: firstMedia?.alt || listing?.title || "Listing image",
  };
}

function renderListings(listings) {
  listElement.innerHTML = "";

  if (!listings.length) {
    setStatus("No active listings right now.");
    return;
  }

  const fragment = document.createDocumentFragment();

  listings.forEach((listing) => {
    const item = document.createElement("li");

    const title = document.createElement("h3");
    title.textContent = listing?.title || "Untitled listing";

    const image = document.createElement("img");
    const primaryImage = getPrimaryImage(listing);
    image.src = primaryImage.url;
    image.alt = primaryImage.alt;

    const deadline = document.createElement("p");
    deadline.textContent = `Deadline: ${formatDeadline(listing?.endsAt)}`;

    const currentBid = document.createElement("p");
    currentBid.textContent = `Current bid: ${getCurrentBid(listing)} credits`;

    item.appendChild(title);
    item.appendChild(image);
    item.appendChild(deadline);
    item.appendChild(currentBid);
    fragment.appendChild(item);
  });

  listElement.appendChild(fragment);
  setStatus(`Showing ${listings.length} active listings.`);
}

async function loadActiveListings() {
  setStatus("Loading active listings...");

  try {
    const response = await fetch(API_LISTINGS_URL, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage =
        json?.errors?.[0]?.message ||
        json?.message ||
        `Failed to load listings with status ${response.status}`;
      throw new Error(errorMessage);
    }

    const listings = Array.isArray(json?.data) ? json.data : [];
    renderListings(listings);
  } catch (error) {
    setStatus(
      error instanceof Error
        ? error.message
        : "Could not load active listings.",
      true,
    );
  }
}

loadActiveListings();
