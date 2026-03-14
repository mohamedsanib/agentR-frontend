// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "react-hot-toast";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#131b2e",
                color: "#e8eaf0",
                border: "1px solid #1e2d4a",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "14px",
              },
              success: { iconTheme: { primary: "#4ade80", secondary: "#131b2e" } },
              error: { iconTheme: { primary: "#f87171", secondary: "#131b2e" } },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
