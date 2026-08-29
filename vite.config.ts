import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: "index.html",
        createListing: "src/pages/create-listing.html",
        login: "src/pages/login.html",
        placeBid: "src/pages/place-bid.html",
        profile: "src/pages/profile.html",
        register: "src/pages/register.html",
      },
    },
  },
});
