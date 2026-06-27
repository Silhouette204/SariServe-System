import {defineConfig} from "vite";
import tailwindcss from "@tailwindcss/vite";  

import { resolve } from "path"; // <--- DAGDAGAN ITO
import { fileURLToPath } from "url"; // <--- PARA SA MODERN JS

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig ({

   base: "./sari-serve/", // <--- DAGDAGAN ITO

  plugins: [
    tailwindcss()
  ],

  build:{
   rollupOptions:{
    input:{
      main: resolve(__dirname, "index.html")
    }
  }
}
});
  