// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem("rf_token"));

  const fetchMe = useCallback(async () => {
    try {
      console.log("[AuthContext] Fetching current user...");
      const res = await authAPI.getMe();
      setUser(res.data.user);
      console.log("[AuthContext] User loaded:", res.data.user.email);
    } catch (err) {
      console.error("[AuthContext] fetchMe failed:", err.message);
      logout();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchMe();
    } else {
      setLoading(false);
    }
  }, [token, fetchMe]);

  const loginWithGoogle = async (credential) => {
    console.log("[AuthContext] Google login attempt...");
    const res = await authAPI.googleLogin(credential);
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem("rf_token", newToken);
    setToken(newToken);
    setUser(newUser);
    console.log("[AuthContext] Logged in:", newUser.email);
    return newUser;
  };

  const logout = () => {
    console.log("[AuthContext] Logging out");
    localStorage.removeItem("rf_token");
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchMe();
  };

  const deleteAccount = async () => {
    await authAPI.deleteAccount();
    logout();
  };

  return (
    <AuthContext.Provider value={{ user, loading, token, loginWithGoogle, logout, refreshUser, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
