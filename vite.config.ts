import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        home: "index.html",
        createListing: "src/pages/create-listing.html",
        editProfile: "src/pages/edit-profile.html",
        login: "src/pages/login.html",
        placeBid: "src/pages/place-bid.html",
        profile: "src/pages/profile.html",
        publicProfile: "src/pages/public-profile.html",
        register: "src/pages/register.html",
      },
    },
  },
});
