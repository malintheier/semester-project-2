type Page = "home" | "create" | "profile" | "login" | "register";

function getPageUrl(page: Page): string {
  const inPagesDirectory = window.location.pathname.includes("/src/pages/");
  const prefix = inPagesDirectory ? "./" : "./src/pages/";

  if (page === "home") {
    return inPagesDirectory ? "../../index.html" : "./index.html";
  }

  const fileName = page === "create" ? "create-listing" : page;
  return `${prefix}${fileName}.html`;
}

function createLink(label: string, page: Page): HTMLAnchorElement {
  const link = document.createElement("a");
  link.className =
    "block text-sm text-paper/65 transition-opacity hover:opacity-60";
  link.href = getPageUrl(page);
  link.textContent = label;
  return link;
}

function createColumn(
  title: string,
  links: Array<{ label: string; page: Page }>,
): HTMLDivElement {
  const column = document.createElement("div");

  const heading = document.createElement("p");
  heading.className =
    "mb-4 text-xs font-medium uppercase tracking-[0.2em] text-paper/30";
  heading.textContent = title;

  const list = document.createElement("div");
  list.className = "space-y-3";
  links.forEach((link) => list.appendChild(createLink(link.label, link.page)));

  column.append(heading, list);
  return column;
}

export function renderFooter(): void {
  let footer = document.querySelector<HTMLElement>("footer");

  if (!footer) {
    footer = document.createElement("footer");
    document.body.appendChild(footer);
  }

  footer.className = "hidden border-t border-paper/10 bg-ink lg:block";
  footer.innerHTML = "";

  const container = document.createElement("div");
  container.className = "mx-auto max-w-7xl px-6 py-16 lg:px-10";

  const top = document.createElement("div");
  top.className = "mb-12 flex flex-col justify-between gap-12 lg:flex-row";

  const brand = document.createElement("div");
  const logo = document.createElement("a");
  logo.className = "font-display text-3xl font-black italic text-paper";
  logo.href = getPageUrl("home");
  logo.textContent = "ARTHAUS";

  const tagline = document.createElement("p");
  tagline.className = "mt-4 max-w-xs text-sm leading-relaxed text-paper/40";
  tagline.textContent =
    "A curated auction house for contemporary art. Connecting collectors with artists through bold, transparent bidding.";
  brand.append(logo, tagline);

  const columns = document.createElement("div");
  columns.className = "flex flex-wrap gap-10 sm:gap-20";
  columns.append(
    createColumn("Navigate", [
      { label: "Browse Auctions", page: "home" },
      { label: "Submit Work", page: "create" },
      { label: "My Profile", page: "profile" },
    ]),
    createColumn("Account", [
      { label: "Sign In", page: "login" },
      { label: "Register", page: "register" },
    ]),
  );

  top.append(brand, columns);

  const bottom = document.createElement("div");
  bottom.className =
    "flex flex-col items-center justify-between border-t border-paper/10 pt-8 sm:flex-row";

  const copyright = document.createElement("p");
  copyright.className = "text-xs text-paper/25";
  copyright.textContent = "Copyright 2026 ARTHAUS. All rights reserved.";

  const legal = document.createElement("p");
  legal.className = "mt-2 text-xs text-paper/25 sm:mt-0";
  legal.textContent = "Terms · Privacy · Cookie Policy";

  bottom.append(copyright, legal);
  container.append(top, bottom);
  footer.appendChild(container);
}
