import { clearUserState } from "./user-state";

const REDIRECT_URL = "../../index.html";
const logoutButton =
  document.querySelector<HTMLButtonElement>("#logout-button");

logoutButton?.addEventListener("click", () => {
  clearUserState();
  window.location.href = REDIRECT_URL;
});
