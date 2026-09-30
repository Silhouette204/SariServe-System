import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";  
import { resolve } from "path"; 
import { fileURLToPath } from "url"; 

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: "./", 

    plugins: [
      tailwindcss()
    ],

    server: {
      allowedHosts: ['galley-treat-delegate.ngrok-free.dev'], //add server para sa ngrok

      proxy: {
        '/api': {
          target: env.VITE_API_TARGET || 'http://localhost:3000',
          changeOrigin: true,
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
          confirmPassword: resolve(__dirname, "confirm-password.html"),
          verifyEmail: resolve(__dirname, "verify-email.html"),
          verifyResetCode: resolve(__dirname, "verify-reset-code.html"),
        }
      }
    }
  };
});