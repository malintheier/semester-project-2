import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
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
