// src/components/TelegramConnectModal.jsx
import { useState, useEffect } from "react";
import { telegramAPI } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

export default function TelegramConnectModal({ onClose, onConnected }) {
  const { refreshUser } = useAuth();
  const [step, setStep] = useState("generate"); // generate | verify
  const [code, setCode] = useState("");
  const [deepLink, setDeepLink] = useState("");
  const [botUsername, setBotUsername] = useState("");
  const [expiresAt, setExpiresAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Generate code on mount
  useEffect(() => {
    generateCode();
  }, []);

  // Poll for connection after code shown
  useEffect(() => {
    if (step !== "verify") return;
    setPolling(true);
    const interval = setInterval(async () => {
      try {
        const res = await telegramAPI.getStatus();
        if (res.data.isConnected) {
          clearInterval(interval);
          setPolling(false);
          await refreshUser();
          toast.success("Telegram connected! 🎉");
          onConnected?.();
          onClose();
        }
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [step]);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const left = Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000));
      setCountdown(left);
      if (left === 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const generateCode = async () => {
    setLoading(true);
    try {
      const res = await telegramAPI.generateCode();
      setCode(res.data.code);
      setDeepLink(res.data.deepLink);
      setBotUsername(res.data.botUsername);
      setExpiresAt(res.data.expiresAt);
      setStep("verify");
      console.log("[TelegramModal] Code generated:", res.data.code);
    } catch (err) {
      toast.error("Failed to generate code");
      console.error("[TelegramModal] Generate error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCountdown = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.telegramIcon}>✈️</div>
          <div>
            <h2 style={styles.title}>Connect Telegram</h2>
            <p style={styles.subtitle}>Get reminder alerts on Telegram</p>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div style={styles.center}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>Generating your code...</p>
          </div>
        ) : (
          <div style={styles.body}>
            {/* Steps */}
            <div style={styles.steps}>
              {[
                { num: 1, text: "Open Telegram and search for the bot" },
                { num: 2, text: "Click the link below or send your code" },
                { num: 3, text: "Waiting for confirmation..." },
              ].map((s, i) => (
                <div key={i} style={styles.step}>
                  <div style={{ ...styles.stepNum, background: i === 2 && polling ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.07)" }}>
                    {i === 2 && polling ? <div style={styles.miniSpinner} /> : s.num}
                  </div>
                  <span style={styles.stepText}>{s.text}</span>
                </div>
              ))}
            </div>

            {/* Bot link */}
            <a
              href={deepLink}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.botLink}
            >
              <span>✈️</span>
              <span>Open @{botUsername}</span>
              <span style={styles.external}>↗</span>
            </a>

            {/* Code display */}
            <div style={styles.codeSection}>
              <p style={styles.codeLabel}>Your verification code</p>
              <div style={styles.codeBox}>
                {code.split("").map((c, i) => (
                  <span key={i} style={styles.codeLetter}>{c}</span>
                ))}
              </div>
              <p style={styles.codeHelp}>Send this code to the bot if the link doesn't work</p>
              {countdown > 0 && (
                <p style={styles.countdown}>Expires in {formatCountdown(countdown)}</p>
              )}
            </div>

            {/* Instructions */}
            <div style={styles.instructBox}>
              <p style={styles.instructText}>
                After clicking the bot link, press <strong>Start</strong> and your Telegram will be linked automatically.
              </p>
            </div>

            {countdown === 0 && (
              <button style={styles.regenerateBtn} onClick={generateCode}>
                Generate New Code
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity:0; transform:translateY(20px) scale(0.97); }
          to { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes miniSpin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  },
  modal: {
    background: "#0d1220",
    border: "1px solid rgba(59,130,246,0.2)",
    borderRadius: "20px",
    width: "100%",
    maxWidth: "440px",
    animation: "modalIn 0.3s ease forwards",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "24px 24px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  telegramIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #0088cc, #005fa3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    flexShrink: 0,
  },
  title: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "18px",
    fontWeight: "700",
    color: "#f0f4ff",
    marginBottom: "2px",
  },
  subtitle: {
    fontSize: "12px",
    color: "#5a6a8a",
  },
  closeBtn: {
    marginLeft: "auto",
    background: "none",
    border: "none",
    color: "#4a5a7a",
    cursor: "pointer",
    fontSize: "16px",
    padding: "4px 8px",
    borderRadius: "6px",
    transition: "color 0.2s",
  },
  body: {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  steps: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  step: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  stepNum: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "600",
    color: "#a0b0d0",
    flexShrink: 0,
    transition: "background 0.3s",
  },
  stepText: {
    fontSize: "13px",
    color: "#8090b0",
  },
  botLink: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "linear-gradient(135deg, rgba(0,136,204,0.15), rgba(0,95,163,0.1))",
    border: "1px solid rgba(0,136,204,0.3)",
    borderRadius: "12px",
    padding: "12px 16px",
    color: "#4db6e8",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500",
    transition: "background 0.2s",
  },
  external: {
    marginLeft: "auto",
    fontSize: "12px",
    opacity: 0.6,
  },
  codeSection: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "14px",
    padding: "18px",
    textAlign: "center",
  },
  codeLabel: {
    fontSize: "11px",
    color: "#5a6a8a",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "12px",
  },
  codeBox: {
    display: "flex",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "10px",
  },
  codeLetter: {
    width: "40px",
    height: "48px",
    background: "rgba(59,130,246,0.1)",
    border: "1px solid rgba(59,130,246,0.25)",
    borderRadius: "10px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    fontFamily: "'Syne', sans-serif",
    fontWeight: "700",
    color: "#60a5fa",
    letterSpacing: "0",
  },
  codeHelp: {
    fontSize: "12px",
    color: "#4a5a7a",
    marginBottom: "4px",
  },
  countdown: {
    fontSize: "11px",
    color: "#f59e0b",
  },
  instructBox: {
    background: "rgba(59,130,246,0.05)",
    border: "1px solid rgba(59,130,246,0.12)",
    borderRadius: "10px",
    padding: "12px 14px",
  },
  instructText: {
    fontSize: "12px",
    color: "#6a7a9a",
    lineHeight: "1.5",
  },
  regenerateBtn: {
    background: "rgba(59,130,246,0.1)",
    border: "1px solid rgba(59,130,246,0.2)",
    color: "#60a5fa",
    borderRadius: "10px",
    padding: "10px",
    fontSize: "13px",
    cursor: "pointer",
    width: "100%",
    transition: "background 0.2s",
  },
  center: {
    padding: "40px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },
  spinner: {
    width: "32px",
    height: "32px",
    border: "2px solid rgba(59,130,246,0.2)",
    borderTopColor: "#3b82f6",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  miniSpinner: {
    width: "12px",
    height: "12px",
    border: "2px solid rgba(59,130,246,0.3)",
    borderTopColor: "#3b82f6",
    borderRadius: "50%",
    animation: "miniSpin 0.8s linear infinite",
  },
  loadingText: {
    color: "#5a6a8a",
    fontSize: "14px",
  },
};
