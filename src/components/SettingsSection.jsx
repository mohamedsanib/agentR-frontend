// src/components/SettingsSection.jsx
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { telegramAPI } from "../utils/api";
import TelegramConnectModal from "./TelegramConnectModal";
import toast from "react-hot-toast";
import { format } from "date-fns";

export default function SettingsSection() {
  const { user, logout, deleteAccount, refreshUser } = useAuth();
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDisconnectTelegram = async () => {
    if (!confirm("Disconnect Telegram? You will stop receiving alerts there.")) return;
    setDisconnecting(true);
    try {
      await telegramAPI.disconnect();
      await refreshUser();
      toast.success("Telegram disconnected");
    } catch {
      toast.error("Failed to disconnect");
    } finally {
      setDisconnecting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      toast.success("Account deleted");
    } catch {
      toast.error("Failed to delete account");
      setDeleting(false);
    }
  };

  return (
    <div style={styles.root}>
      {/* Profile */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Profile</h3>
        <div style={styles.profileCard}>
          <img
            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1d4ed8&color=fff`}
            alt={user.name}
            style={styles.avatar}
          />
          <div>
            <p style={styles.profileName}>{user.name}</p>
            <p style={styles.profileEmail}>{user.email}</p>
            <div style={styles.googleBadge}>
              <svg width="14" height="14" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Google Account</span>
            </div>
          </div>
        </div>
      </div>

      {/* Telegram */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Telegram Integration</h3>
        <div style={styles.card}>
          <div style={styles.telegramRow}>
            <div style={styles.telegramLeft}>
              <div style={styles.tgIcon}>✈️</div>
              <div>
                <p style={styles.cardTitle}>Telegram Alerts</p>
                <p style={styles.cardSub}>
                  {user.isTelegramConnected
                    ? `Connected${user.telegramUsername ? ` as @${user.telegramUsername}` : ""}${user.telegramConnectedAt ? ` · Since ${format(new Date(user.telegramConnectedAt), "MMM d")}` : ""}`
                    : "Not connected — connect to receive alerts"}
                </p>
              </div>
            </div>
            <div style={styles.telegramRight}>
              <div style={{ ...styles.statusDot, background: user.isTelegramConnected ? "#4ade80" : "#374151" }} />
              {user.isTelegramConnected ? (
                <button
                  style={styles.dangerOutlineBtn}
                  onClick={handleDisconnectTelegram}
                  disabled={disconnecting}
                >
                  {disconnecting ? "..." : "Disconnect"}
                </button>
              ) : (
                <button
                  style={styles.primaryBtn}
                  onClick={() => setShowTelegramModal(true)}
                >
                  Connect
                </button>
              )}
            </div>
          </div>

          {!user.isTelegramConnected && (
            <div style={styles.tgHint}>
              <span>💡</span>
              <span>Connect Telegram to receive reminder alerts and create reminders by chatting with the bot.</span>
            </div>
          )}
        </div>
      </div>

      {/* Account */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Account</h3>
        <div style={styles.card}>
          <div style={styles.accountRow}>
            <div>
              <p style={styles.cardTitle}>Sign Out</p>
              <p style={styles.cardSub}>Sign out from this device</p>
            </div>
            <button style={styles.outlineBtn} onClick={logout}>
              Sign Out
            </button>
          </div>
        </div>

        <div style={{ ...styles.card, ...styles.dangerCard, marginTop: "10px" }}>
          <div style={styles.accountRow}>
            <div>
              <p style={{ ...styles.cardTitle, color: "#f87171" }}>Delete Account</p>
              <p style={styles.cardSub}>Permanently delete your account and all reminders</p>
            </div>
            <button
              style={styles.dangerBtn}
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete
            </button>
          </div>

          {showDeleteConfirm && (
            <div style={styles.confirmBox}>
              <p style={styles.confirmText}>⚠️ This will permanently delete your account and all your reminders. This cannot be undone.</p>
              <div style={styles.confirmBtns}>
                <button style={styles.outlineBtn} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                <button style={{ ...styles.dangerBtn, opacity: deleting ? 0.6 : 1 }} onClick={handleDeleteAccount} disabled={deleting}>
                  {deleting ? "Deleting..." : "Yes, Delete Everything"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showTelegramModal && (
        <TelegramConnectModal
          onClose={() => setShowTelegramModal(false)}
          onConnected={() => setShowTelegramModal(false)}
        />
      )}
    </div>
  );
}

const styles = {
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  sectionTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "11px",
    fontWeight: "600",
    color: "#3a4a6a",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
  },
  profileCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "14px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  avatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    border: "2px solid rgba(59,130,246,0.3)",
    flexShrink: 0,
  },
  profileName: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#dde5f5",
    marginBottom: "2px",
  },
  profileEmail: {
    fontSize: "12px",
    color: "#5a6a8a",
    marginBottom: "6px",
  },
  googleBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    padding: "3px 8px",
    fontSize: "11px",
    color: "#6a7a9a",
  },
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "14px",
    padding: "16px",
  },
  dangerCard: {
    border: "1px solid rgba(248,113,113,0.1)",
    background: "rgba(248,113,113,0.02)",
  },
  telegramRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  telegramLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flex: 1,
    minWidth: 0,
  },
  tgIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, rgba(0,136,204,0.2), rgba(0,95,163,0.15))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    flexShrink: 0,
  },
  telegramRight: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexShrink: 0,
  },
  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    transition: "background 0.3s",
  },
  cardTitle: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#c0cce0",
    marginBottom: "2px",
  },
  cardSub: {
    fontSize: "12px",
    color: "#4a5a7a",
    lineHeight: "1.4",
  },
  tgHint: {
    display: "flex",
    gap: "8px",
    marginTop: "12px",
    padding: "10px 12px",
    background: "rgba(59,130,246,0.05)",
    borderRadius: "8px",
    fontSize: "12px",
    color: "#4a6a9a",
    lineHeight: "1.4",
  },
  accountRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  primaryBtn: {
    background: "linear-gradient(135deg, #1d4ed8, #7c3aed)",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
    cursor: "pointer",
    padding: "8px 16px",
    fontSize: "13px",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: "500",
    transition: "opacity 0.2s",
  },
  outlineBtn: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    color: "#8090b0",
    cursor: "pointer",
    padding: "8px 16px",
    fontSize: "13px",
    fontFamily: "'DM Sans', sans-serif",
    transition: "background 0.2s",
  },
  dangerOutlineBtn: {
    background: "transparent",
    border: "1px solid rgba(248,113,113,0.3)",
    borderRadius: "8px",
    color: "#f87171",
    cursor: "pointer",
    padding: "8px 14px",
    fontSize: "13px",
    fontFamily: "'DM Sans', sans-serif",
    transition: "background 0.2s",
  },
  dangerBtn: {
    background: "rgba(248,113,113,0.1)",
    border: "1px solid rgba(248,113,113,0.25)",
    borderRadius: "8px",
    color: "#f87171",
    cursor: "pointer",
    padding: "8px 16px",
    fontSize: "13px",
    fontFamily: "'DM Sans', sans-serif",
    transition: "background 0.2s, opacity 0.2s",
  },
  confirmBox: {
    marginTop: "14px",
    paddingTop: "14px",
    borderTop: "1px solid rgba(248,113,113,0.15)",
  },
  confirmText: {
    fontSize: "13px",
    color: "#f87171",
    marginBottom: "12px",
    lineHeight: "1.4",
  },
  confirmBtns: {
    display: "flex",
    gap: "8px",
  },
};
