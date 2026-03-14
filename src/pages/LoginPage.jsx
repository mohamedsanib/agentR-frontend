// src/pages/LoginPage.jsx
import { useGoogleLogin } from "@react-oauth/google";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useState } from "react";

export default function LoginPage() {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    console.log("[Login] Google credential received");
    try {
      await loginWithGoogle(credentialResponse.credential);
      toast.success("Welcome to ReminderFlow!");
      navigate("/dashboard");
    } catch (err) {
      console.error("[Login] Error:", err);
      toast.error("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.root}>
      {/* Animated background */}
      <div style={styles.bgOrb1} />
      <div style={styles.bgOrb2} />
      <div style={styles.bgOrb3} />
      <div style={styles.grid} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>🔔</div>
          <div style={styles.logoBadge}>AI</div>
        </div>

        <h1 style={styles.title}>ReminderFlow</h1>
        <p style={styles.subtitle}>Smart reminders via natural language.<br />Works with Telegram. Powered by AI.</p>

        <div style={styles.featureList}>
          {["💬 Type reminders in plain English", "📱 Get alerts on Telegram", "🔄 Recurring reminders", "🤖 AI-powered parsing"].map((f, i) => (
            <div key={i} style={styles.featureItem}>{f}</div>
          ))}
        </div>

        <div style={styles.divider} />

        <div style={{ ...styles.googleWrap, opacity: isLoading ? 0.5 : 1, pointerEvents: isLoading ? "none" : "auto" }}>
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => {
              console.error("[Login] Google login error");
              toast.error("Google login failed");
            }}
            theme="filled_black"
            size="large"
            text="continue_with"
            shape="rectangular"
            width="280"
          />
        </div>

        {isLoading && <p style={styles.loadingText}>Signing you in...</p>}

        <p style={styles.terms}>By continuing, you agree to our Terms of Service</p>
      </div>

      <style>{`
        @keyframes floatOrb {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(30px,-20px) scale(1.05); }
          66% { transform: translate(-20px,15px) scale(0.95); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(24px); }
          to { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#080c14",
    position: "relative",
    overflow: "hidden",
    padding: "20px",
  },
  bgOrb1: {
    position: "absolute",
    width: "500px",
    height: "500px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
    top: "-100px",
    left: "-100px",
    animation: "floatOrb 12s ease-in-out infinite",
  },
  bgOrb2: {
    position: "absolute",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
    bottom: "-80px",
    right: "-80px",
    animation: "floatOrb 15s ease-in-out infinite reverse",
  },
  bgOrb3: {
    position: "absolute",
    width: "300px",
    height: "300px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(20,184,166,0.08) 0%, transparent 70%)",
    top: "50%",
    left: "60%",
    animation: "floatOrb 18s ease-in-out infinite 3s",
  },
  grid: {
    position: "absolute",
    inset: 0,
    backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
    backgroundSize: "48px 48px",
    pointerEvents: "none",
  },
  card: {
    position: "relative",
    zIndex: 1,
    background: "rgba(13,18,32,0.85)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(59,130,246,0.15)",
    borderRadius: "24px",
    padding: "48px 40px",
    width: "100%",
    maxWidth: "400px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0",
    animation: "fadeUp 0.6s ease forwards",
    boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset",
  },
  logoWrap: {
    position: "relative",
    marginBottom: "20px",
  },
  logoIcon: {
    width: "72px",
    height: "72px",
    borderRadius: "20px",
    background: "linear-gradient(135deg, #1d4ed8, #7c3aed)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "32px",
    boxShadow: "0 8px 32px rgba(59,130,246,0.3)",
  },
  logoBadge: {
    position: "absolute",
    top: "-6px",
    right: "-10px",
    background: "linear-gradient(135deg, #14b8a6, #3b82f6)",
    color: "#fff",
    fontSize: "9px",
    fontWeight: "700",
    fontFamily: "'Syne', sans-serif",
    letterSpacing: "0.5px",
    padding: "2px 6px",
    borderRadius: "20px",
  },
  title: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "28px",
    fontWeight: "800",
    color: "#f0f4ff",
    letterSpacing: "-0.5px",
    marginBottom: "10px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#7a8aaa",
    textAlign: "center",
    lineHeight: "1.6",
    marginBottom: "28px",
  },
  featureList: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "28px",
  },
  featureItem: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: "13px",
    color: "#9aa8c0",
  },
  divider: {
    width: "100%",
    height: "1px",
    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
    marginBottom: "28px",
  },
  googleWrap: {
    transition: "opacity 0.2s",
    marginBottom: "16px",
  },
  loadingText: {
    fontSize: "12px",
    color: "#3b82f6",
    marginTop: "-8px",
    marginBottom: "8px",
  },
  terms: {
    fontSize: "11px",
    color: "#3d4d6a",
    textAlign: "center",
    marginTop: "8px",
  },
};
