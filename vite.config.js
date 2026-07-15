import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";  
import { resolve } from "path"; 
import { fileURLToPath } from "url"; 

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  // Kung local development muna, pwedeng gamitin ang base dependent relative o panatilihin ito
  base: "./", 

  plugins: [
    tailwindcss()
  ],

  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        dashboard: resolve(__dirname, "dashboard.html"),
        inventory: resolve(__dirname, "inventory.html"),
        sales: resolve(__dirname, "sales.html"),
        utang: resolve(__dirname, "utang.html"),
      }
    }
  }
});