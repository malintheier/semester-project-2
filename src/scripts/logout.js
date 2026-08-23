const TOKEN_STORAGE_KEY = "arthaus_access_token";
const USER_STORAGE_KEY = "arthaus_user";
const REDIRECT_URL = "../../index.html";

const logoutButton = document.querySelector("#logout-button");

if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(USER_STORAGE_KEY);
    window.location.href = REDIRECT_URL;
  });
}
