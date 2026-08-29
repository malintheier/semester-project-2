import type { UserState } from "../types";

function getInitials(name: string): string {
  return name
    .split(/[._\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function getPageUrl(page: "home" | "create" | "profile" | "login"): string {
  const inPagesDirectory = window.location.pathname.includes("/src/pages/");
  const prefix = inPagesDirectory ? "./" : "./src/pages/";

  if (page === "home") {
    return inPagesDirectory ? "../../index.html" : "./index.html";
  }

  return `${prefix}${page === "create" ? "create-listing" : page}.html`;
}

function isCurrentPage(page: "home" | "create"): boolean {
  const path = window.location.pathname.toLowerCase();

  if (page === "home") {
    return path.endsWith("/") || path.endsWith("/index.html");
  }

  return path.endsWith("/create-listing.html");
}

function createLink(
  label: string,
  href: string,
  active = false,
): HTMLAnchorElement {
  const link = document.createElement("a");
  link.className = active
    ? "text-xs font-medium uppercase tracking-[0.2em] text-auction-red"
    : "text-xs font-medium uppercase tracking-[0.2em] text-muted-ink";
  link.href = href;
  link.textContent = label;
  return link;
}

export function renderHeader(
  user: UserState | null,
  isLoggedIn: boolean,
  onLogout: () => void,
): void {
  let header = document.querySelector<HTMLElement>("header");

  if (!header) {
    header = document.createElement("header");
    document.body.prepend(header);
  }

  header.className = "sticky top-0 z-50 border-b border-line bg-paper";
  header.innerHTML = "";

  const container = document.createElement("div");
  container.className =
    "mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:h-20 lg:px-10";

  const logo = document.createElement("a");
  logo.className = "font-display text-lg font-black italic text-ink sm:text-xl";
  logo.href = getPageUrl("home");
  logo.textContent = "ARTHAUS";

  const navigation = document.createElement("nav");
  navigation.className = "hidden items-center gap-8 lg:flex";
  navigation.setAttribute("aria-label", "Main navigation");
  navigation.append(
    createLink("Browse", getPageUrl("home"), isCurrentPage("home")),
    createLink("Submit Work", getPageUrl("create"), isCurrentPage("create")),
  );

  const actions = document.createElement("div");
  actions.className = "flex items-center gap-2 sm:gap-3";

  if (isLoggedIn && user) {
    const credits = document.createElement("div");
    credits.className =
      "flex items-center gap-1.5 border border-line bg-card px-2.5 py-1 text-xs font-semibold sm:gap-2 sm:px-3 sm:py-1.5";

    const marker = document.createElement("span");
    marker.className = "text-auction-red";
    marker.textContent = "◆";

    const amount = document.createElement("span");
    amount.setAttribute("data-user-credits", "");
    amount.textContent = String(user.credits);

    credits.append(marker, amount);

    const profileLink = document.createElement("a");
    profileLink.className =
      "flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden bg-auction-red font-display text-xs font-black italic text-paper";
    profileLink.href = getPageUrl("profile");
    profileLink.setAttribute("aria-label", "My profile");

    if (user.avatarUrl) {
      const avatar = document.createElement("img");
      avatar.className = "h-full w-full object-cover";
      avatar.src = user.avatarUrl;
      avatar.alt = user.fullName || user.name;
      avatar.addEventListener("error", () => {
        avatar.remove();
        profileLink.textContent = getInitials(user.fullName || user.name);
      });
      profileLink.appendChild(avatar);
    } else {
      profileLink.textContent = getInitials(user.fullName || user.name);
    }

    const logoutButton = document.createElement("button");
    logoutButton.className =
      "hidden border border-line px-3 py-1.5 text-xs font-medium uppercase tracking-[0.15em] text-muted-ink sm:block";
    logoutButton.type = "button";
    logoutButton.textContent = "<- Log out";
    logoutButton.addEventListener("click", () => {
      onLogout();
      window.location.href = getPageUrl("home");
    });

    actions.append(credits, profileLink, logoutButton);
  } else {
    actions.append(createLink("Sign In", getPageUrl("login")));
  }

  container.append(logo, navigation, actions);
  header.appendChild(container);
}
