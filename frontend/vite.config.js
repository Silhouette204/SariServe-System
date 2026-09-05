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

  server: {
    proxy: {
      '/api': {
        target: 'https://sariserve-system.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },

  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        dashboard: resolve(__dirname, "dashboard.html"),
        inventory: resolve(__dirname, "inventory.html"),
        sales: resolve(__dirname, "sales.html"),
        utang: resolve(__dirname, "utang.html"),
        signIn: resolve(__dirname, "sign-in.html"),
        signUp: resolve(__dirname, "sign-up.html"),
        forgotPassword: resolve(__dirname, "forgot-password.html"),
        confirmPassword: resolve(__dirname, "confirm-password.html")
      }
    }
  }
});