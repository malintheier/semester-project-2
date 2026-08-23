import { clearUserState } from "./user-state.js";

const REDIRECT_URL = "../../index.html";

const logoutButton = document.querySelector("#logout-button");

if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    clearUserState();
    window.location.href = REDIRECT_URL;
  });
}
