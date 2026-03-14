// src/pages/DashboardPage.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { remindersAPI } from "../utils/api";
import AIInputBar from "../components/AIInputBar";
import ReminderCard from "../components/ReminderCard";
import SettingsSection from "../components/SettingsSection";
import EditReminderModal from "../components/EditReminderModal";
import TelegramConnectModal from "../components/TelegramConnectModal";
import toast from "react-hot-toast";

const TABS = [
  { id: "reminders", label: "Reminders", icon: "🔔" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

const STATUS_FILTERS = ["active", "completed", "all"];

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("reminders");
  const [reminders, setReminders] = useState([]);
  const [loadingReminders, setLoadingReminders] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [followUpQuestion, setFollowUpQuestion] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [statusFilter, setStatusFilter] = useState("active");
  const [search, setSearch] = useState("");
  const [editingReminder, setEditingReminder] = useState(null);
  const [showTelegramBanner, setShowTelegramBanner] = useState(!user.isTelegramConnected);
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const chatEndRef = useRef(null);

  // Load reminders
  const loadReminders = useCallback(async () => {
    try {
      console.log("[Dashboard] Loading reminders...");
      const res = await remindersAPI.list({ status: statusFilter, search: search || undefined });
      setReminders(res.data.reminders || []);
    } catch (err) {
      console.error("[Dashboard] Load reminders error:", err);
      toast.error("Failed to load reminders");
    } finally {
      setLoadingReminders(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // ── Handle AI message send ──
  const handleSend = async (message) => {
    console.log("[Dashboard] Sending message:", message);
    setAiLoading(true);

    // Add user message to chat
    const userMsg = { role: "user", content: message, id: Date.now() };
    setChatMessages(prev => [...prev, userMsg]);

    try {
      const res = await remindersAPI.process(message, sessionId);
      const data = res.data;
      console.log("[Dashboard] AI response:", data);

      // Add AI response to chat
      const aiMsg = {
        role: "assistant",
        content: data.userMessage,
        id: Date.now() + 1,
        intent: data.intent,
        reminder: data.reminder,
        reminders: data.reminders,
      };
      setChatMessages(prev => [...prev, aiMsg]);

      // Handle follow-up
      if (data.needsFollowUp) {
        setFollowUpQuestion(data.followUpQuestion);
        setSessionId(data.sessionId);
      } else {
        setFollowUpQuestion(null);
        setSessionId(null);
      }

      // Refresh reminders on relevant intents
      if (["CREATE", "DELETE", "UPDATE"].includes(data.intent) && !data.needsFollowUp) {
        await loadReminders();
      }

      // For LIST/SEARCH - update displayed reminders
      if (["LIST", "SEARCH"].includes(data.intent) && data.reminders) {
        setReminders(data.reminders);
      }
    } catch (err) {
      console.error("[Dashboard] Process error:", err);
      const errMsg = err.response?.data?.message || "Something went wrong. Please try again.";
      setChatMessages(prev => [...prev, {
        role: "assistant",
        content: errMsg,
        id: Date.now() + 1,
        isError: true,
      }]);
      toast.error("Failed to process request");
    } finally {
      setAiLoading(false);
    }
  };

  const handleReminderDelete = (id) => {
    setReminders(prev => prev.filter(r => r._id !== id));
  };

  const handleReminderUpdate = (updated) => {
    setReminders(prev => prev.map(r => r._id === updated._id ? updated : r));
  };

  const filteredReminders = reminders.filter(r =>
    !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.root}>
      {/* Background effects */}
      <div style={styles.bgOrb1} />
      <div style={styles.bgOrb2} />
      <div style={styles.grid} />

      {/* Sidebar */}
      <aside style={styles.sidebar}>
        {/* Logo */}
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>🔔</div>
          <div>
            <span style={styles.logoText}>ReminderFlow</span>
            <div style={styles.logoBadge}>AI</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={styles.nav}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              style={{ ...styles.navItem, ...(activeTab === tab.id ? styles.navItemActive : {}) }}
              onClick={() => setActiveTab(tab.id)}
            >
              <span style={styles.navIcon}>{tab.icon}</span>
              <span style={styles.navLabel}>{tab.label}</span>
              {tab.id === "reminders" && reminders.filter(r => r.status === "active").length > 0 && (
                <span style={styles.navBadge}>{reminders.filter(r => r.status === "active").length}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Telegram status */}
        <div style={styles.sidebarBottom}>
          <div style={styles.userCard}>
            <img
              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1d4ed8&color=fff`}
              alt={user.name}
              style={styles.userAvatar}
            />
            <div style={styles.userInfo}>
              <p style={styles.userName}>{user.name.split(" ")[0]}</p>
              <div style={styles.telegramStatus}>
                <div style={{
                  ...styles.statusDot,
                  background: user.isTelegramConnected ? "#4ade80" : "#374151"
                }} />
                <span style={styles.statusLabel}>
                  {user.isTelegramConnected ? "Telegram" : "No Telegram"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={styles.main}>
        {/* Telegram banner */}
        {showTelegramBanner && !user.isTelegramConnected && activeTab === "reminders" && (
          <div style={styles.telegramBanner}>
            <span>✈️</span>
            <span style={styles.bannerText}>Connect Telegram to receive reminder alerts directly in your chat</span>
            <button style={styles.bannerBtn} onClick={() => setShowTelegramModal(true)}>Connect</button>
            <button style={styles.bannerClose} onClick={() => setShowTelegramBanner(false)}>✕</button>
          </div>
        )}

        {activeTab === "reminders" && (
          <div style={styles.remindersLayout}>
            {/* Left: Chat/Input panel */}
            <div style={styles.chatPanel}>
              <div style={styles.panelHeader}>
                <h2 style={styles.panelTitle}>AI Assistant</h2>
                <p style={styles.panelSub}>Type reminders in natural English</p>
              </div>

              {/* Chat history */}
              <div style={styles.chatHistory}>
                {chatMessages.length === 0 && (
                  <div style={styles.emptyChatState}>
                    <div style={styles.emptyIcon}>✨</div>
                    <p style={styles.emptyTitle}>What would you like to remember?</p>
                    <div style={styles.exampleGrid}>
                      {[
                        "Remind me to take medicine tomorrow at 9am",
                        "Meeting with client every Monday at 10am",
                        "Submit report by Friday 5pm",
                        "Show my reminders",
                        "Delete reminder to call John",
                        "What are my reminders for today?",
                      ].map((ex, i) => (
                        <button key={i} style={styles.exampleChip} onClick={() => handleSend(ex)}>
                          {ex}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {chatMessages.map((msg) => (
                  <div key={msg.id} style={{ ...styles.chatMsg, ...(msg.role === "user" ? styles.chatMsgUser : styles.chatMsgAI) }}>
                    {msg.role === "assistant" && (
                      <div style={styles.aiAvatar}>🤖</div>
                    )}
                    <div style={{
                      ...styles.msgBubble,
                      ...(msg.role === "user" ? styles.msgBubbleUser : styles.msgBubbleAI),
                      ...(msg.isError ? styles.msgBubbleError : {}),
                    }}>
                      <p style={styles.msgText}>{msg.content}</p>

                      {/* Show created reminder inline */}
                      {msg.reminder && (
                        <div style={styles.inlineReminder}>
                          <div style={styles.inlineReminderTop}>
                            <span style={styles.inlineCheck}>✅</span>
                            <span style={styles.inlineTitle}>{msg.reminder.title}</span>
                          </div>
                          <p style={styles.inlineTime}>
                            🕐 {new Date(msg.reminder.scheduledAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                            {msg.reminder.recurrence !== "none" ? ` · 🔄 ${msg.reminder.recurrence}` : ""}
                          </p>
                        </div>
                      )}

                      {/* Inline reminders list */}
                      {msg.reminders && msg.reminders.length > 0 && (
                        <div style={styles.inlineList}>
                          {msg.reminders.slice(0, 5).map((r, i) => (
                            <div key={r._id} style={styles.inlineListItem}>
                              <span style={styles.inlineListNum}>{i + 1}</span>
                              <span style={styles.inlineListTitle}>{r.title}</span>
                              <span style={styles.inlineListTime}>
                                {new Date(r.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                            </div>
                          ))}
                          {msg.reminders.length > 5 && (
                            <p style={styles.inlineListMore}>+{msg.reminders.length - 5} more in the list →</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {aiLoading && (
                  <div style={{ ...styles.chatMsg, ...styles.chatMsgAI }}>
                    <div style={styles.aiAvatar}>🤖</div>
                    <div style={{ ...styles.msgBubble, ...styles.msgBubbleAI }}>
                      <div style={styles.typingDots}>
                        {[0, 1, 2].map(i => (
                          <div key={i} style={{ ...styles.typingDot, animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Input bar */}
              <div style={styles.inputWrap}>
                <AIInputBar
                  onSend={handleSend}
                  loading={aiLoading}
                  followUpQuestion={followUpQuestion}
                />
              </div>
            </div>

            {/* Right: Reminders list panel */}
            <div style={styles.listPanel}>
              <div style={styles.listHeader}>
                <h2 style={styles.panelTitle}>Your Reminders</h2>

                {/* Search */}
                <div style={styles.searchWrap}>
                  <span style={styles.searchIcon}>🔍</span>
                  <input
                    style={styles.searchInput}
                    placeholder="Search reminders..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                  {search && (
                    <button style={styles.clearSearch} onClick={() => setSearch("")}>✕</button>
                  )}
                </div>

                {/* Status filter */}
                <div style={styles.filterTabs}>
                  {STATUS_FILTERS.map(f => (
                    <button
                      key={f}
                      style={{ ...styles.filterTab, ...(statusFilter === f ? styles.filterTabActive : {}) }}
                      onClick={() => setStatusFilter(f)}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reminders list */}
              <div style={styles.remindersList}>
                {loadingReminders ? (
                  <div style={styles.loadingState}>
                    {[1, 2, 3].map(i => (
                      <div key={i} style={{ ...styles.skeletonCard, opacity: 1 - (i * 0.2) }} />
                    ))}
                  </div>
                ) : filteredReminders.length === 0 ? (
                  <div style={styles.emptyState}>
                    <div style={styles.emptyStateIcon}>🔔</div>
                    <p style={styles.emptyStateTitle}>No reminders{search ? " found" : " yet"}</p>
                    <p style={styles.emptyStateText}>
                      {search ? "Try a different search term" : "Create one using the AI assistant →"}
                    </p>
                  </div>
                ) : (
                  filteredReminders.map(r => (
                    <ReminderCard
                      key={r._id}
                      reminder={r}
                      onDelete={handleReminderDelete}
                      onEdit={setEditingReminder}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div style={styles.settingsLayout}>
            <div style={styles.settingsHeader}>
              <h2 style={styles.panelTitle}>Settings</h2>
              <p style={styles.panelSub}>Manage your account and integrations</p>
            </div>
            <SettingsSection />
          </div>
        )}
      </main>

      {/* Modals */}
      {editingReminder && (
        <EditReminderModal
          reminder={editingReminder}
          onClose={() => setEditingReminder(null)}
          onUpdated={handleReminderUpdate}
        />
      )}

      {showTelegramModal && (
        <TelegramConnectModal
          onClose={() => setShowTelegramModal(false)}
          onConnected={() => {
            setShowTelegramModal(false);
            setShowTelegramBanner(false);
          }}
        />
      )}

      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes typing { 0%,80%,100%{transform:scale(0);opacity:0.4} 40%{transform:scale(1);opacity:1} }
        @keyframes floatOrb { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,-15px)} }
        @keyframes shimmer { from{background-position:-200% 0} to{background-position:200% 0} }
      `}</style>
    </div>
  );
}

const styles = {
  root: {
    height: "100vh",
    display: "flex",
    background: "#080c14",
    position: "relative",
    overflow: "hidden",
  },
  bgOrb1: {
    position: "fixed",
    width: "600px",
    height: "600px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)",
    top: "-200px",
    right: "100px",
    animation: "floatOrb 20s ease-in-out infinite",
    pointerEvents: "none",
    zIndex: 0,
  },
  bgOrb2: {
    position: "fixed",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)",
    bottom: "0",
    left: "200px",
    animation: "floatOrb 25s ease-in-out infinite reverse",
    pointerEvents: "none",
    zIndex: 0,
  },
  grid: {
    position: "fixed",
    inset: 0,
    backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
    backgroundSize: "60px 60px",
    pointerEvents: "none",
    zIndex: 0,
  },

  // ── Sidebar ──
  sidebar: {
    width: "220px",
    flexShrink: 0,
    background: "rgba(8,12,20,0.9)",
    borderRight: "1px solid rgba(255,255,255,0.05)",
    display: "flex",
    flexDirection: "column",
    padding: "24px 16px",
    position: "relative",
    zIndex: 1,
  },
  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "32px",
    paddingLeft: "4px",
  },
  logoIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #1d4ed8, #7c3aed)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    flexShrink: 0,
  },
  logoText: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "15px",
    fontWeight: "700",
    color: "#e0e8ff",
    letterSpacing: "-0.3px",
    display: "block",
    lineHeight: "1",
  },
  logoBadge: {
    display: "inline-block",
    background: "linear-gradient(135deg, #14b8a6, #3b82f6)",
    color: "#fff",
    fontSize: "8px",
    fontWeight: "700",
    fontFamily: "'Syne', sans-serif",
    padding: "1px 5px",
    borderRadius: "10px",
    marginTop: "2px",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    flex: 1,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "none",
    border: "none",
    borderRadius: "10px",
    padding: "10px 12px",
    cursor: "pointer",
    color: "#4a5a7a",
    fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    transition: "background 0.2s, color 0.2s",
    textAlign: "left",
    width: "100%",
  },
  navItemActive: {
    background: "rgba(59,130,246,0.1)",
    color: "#93c5fd",
    border: "1px solid rgba(59,130,246,0.15)",
  },
  navIcon: { fontSize: "16px" },
  navLabel: { flex: 1 },
  navBadge: {
    background: "rgba(59,130,246,0.2)",
    color: "#60a5fa",
    fontSize: "10px",
    padding: "1px 6px",
    borderRadius: "10px",
    fontWeight: "600",
  },
  sidebarBottom: {
    marginTop: "auto",
    paddingTop: "16px",
    borderTop: "1px solid rgba(255,255,255,0.05)",
  },
  userCard: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  userAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    border: "1px solid rgba(59,130,246,0.25)",
  },
  userInfo: { flex: 1, minWidth: 0 },
  userName: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#c0cce0",
    marginBottom: "2px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  telegramStatus: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },
  statusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    transition: "background 0.3s",
  },
  statusLabel: {
    fontSize: "10px",
    color: "#3a4a6a",
  },

  // ── Main ──
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    position: "relative",
    zIndex: 1,
  },

  telegramBanner: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "linear-gradient(90deg, rgba(0,136,204,0.15), rgba(59,130,246,0.1))",
    borderBottom: "1px solid rgba(0,136,204,0.2)",
    padding: "10px 24px",
    fontSize: "13px",
    color: "#7abfe0",
    flexShrink: 0,
  },
  bannerText: { flex: 1 },
  bannerBtn: {
    background: "rgba(0,136,204,0.2)",
    border: "1px solid rgba(0,136,204,0.3)",
    borderRadius: "6px",
    color: "#4db6e8",
    cursor: "pointer",
    padding: "4px 12px",
    fontSize: "12px",
    fontFamily: "'DM Sans', sans-serif",
  },
  bannerClose: {
    background: "none",
    border: "none",
    color: "#3a5a7a",
    cursor: "pointer",
    fontSize: "14px",
    padding: "2px 6px",
  },

  // ── Reminders layout ──
  remindersLayout: {
    flex: 1,
    display: "flex",
    overflow: "hidden",
    gap: "0",
  },

  // ── Chat panel ──
  chatPanel: {
    width: "420px",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    borderRight: "1px solid rgba(255,255,255,0.05)",
    overflow: "hidden",
  },
  panelHeader: {
    padding: "20px 24px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    flexShrink: 0,
  },
  panelTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "16px",
    fontWeight: "700",
    color: "#e0e8ff",
    marginBottom: "3px",
  },
  panelSub: {
    fontSize: "12px",
    color: "#3a4a6a",
  },
  chatHistory: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  inputWrap: {
    padding: "12px 16px 16px",
    flexShrink: 0,
    borderTop: "1px solid rgba(255,255,255,0.05)",
  },

  // Empty chat
  emptyChatState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    padding: "20px 8px",
  },
  emptyIcon: {
    fontSize: "32px",
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: "14px",
    color: "#3a4a6a",
    textAlign: "center",
  },
  exampleGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    width: "100%",
  },
  exampleChip: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "12px",
    color: "#4a5a7a",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "'DM Sans', sans-serif",
    transition: "background 0.2s, color 0.2s",
    lineHeight: "1.4",
  },

  // Chat messages
  chatMsg: {
    display: "flex",
    gap: "8px",
    animation: "fadeIn 0.25s ease",
  },
  chatMsgUser: {
    flexDirection: "row-reverse",
  },
  chatMsgAI: {
    flexDirection: "row",
  },
  aiAvatar: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "rgba(139,92,246,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    flexShrink: 0,
    marginTop: "2px",
  },
  msgBubble: {
    maxWidth: "85%",
    borderRadius: "14px",
    padding: "10px 14px",
  },
  msgBubbleUser: {
    background: "linear-gradient(135deg, rgba(29,78,216,0.4), rgba(124,58,237,0.35))",
    border: "1px solid rgba(59,130,246,0.2)",
    borderTopRightRadius: "4px",
  },
  msgBubbleAI: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderTopLeftRadius: "4px",
  },
  msgBubbleError: {
    background: "rgba(248,113,113,0.05)",
    border: "1px solid rgba(248,113,113,0.15)",
  },
  msgText: {
    fontSize: "13px",
    color: "#c0cce0",
    lineHeight: "1.5",
    whiteSpace: "pre-wrap",
  },

  // Inline reminder
  inlineReminder: {
    marginTop: "8px",
    background: "rgba(59,130,246,0.08)",
    border: "1px solid rgba(59,130,246,0.15)",
    borderRadius: "8px",
    padding: "8px 10px",
  },
  inlineReminderTop: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "3px",
  },
  inlineCheck: { fontSize: "12px" },
  inlineTitle: {
    fontSize: "12px",
    fontWeight: "500",
    color: "#93c5fd",
  },
  inlineTime: {
    fontSize: "11px",
    color: "#4a6a9a",
  },

  // Inline list
  inlineList: {
    marginTop: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  inlineListItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 8px",
    background: "rgba(255,255,255,0.03)",
    borderRadius: "6px",
  },
  inlineListNum: {
    fontSize: "10px",
    color: "#3a4a6a",
    width: "14px",
  },
  inlineListTitle: {
    flex: 1,
    fontSize: "11px",
    color: "#8090b0",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  inlineListTime: {
    fontSize: "10px",
    color: "#3a4a6a",
  },
  inlineListMore: {
    fontSize: "10px",
    color: "#3b82f6",
    paddingLeft: "8px",
  },

  // Typing indicator
  typingDots: {
    display: "flex",
    gap: "4px",
    padding: "4px 2px",
  },
  typingDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#4a5a7a",
    animation: "typing 1.2s ease-in-out infinite",
  },

  // ── Reminders list panel ──
  listPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  listHeader: {
    padding: "20px 24px 14px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    flexShrink: 0,
  },
  searchWrap: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "10px",
    padding: "8px 12px",
  },
  searchIcon: { fontSize: "14px", opacity: 0.5 },
  searchInput: {
    flex: 1,
    background: "none",
    border: "none",
    outline: "none",
    color: "#c0cce0",
    fontSize: "13px",
    fontFamily: "'DM Sans', sans-serif",
  },
  clearSearch: {
    background: "none",
    border: "none",
    color: "#3a4a6a",
    cursor: "pointer",
    fontSize: "12px",
    padding: "0 2px",
  },
  filterTabs: {
    display: "flex",
    gap: "6px",
  },
  filterTab: {
    background: "none",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "20px",
    padding: "4px 12px",
    fontSize: "12px",
    color: "#4a5a7a",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.2s",
  },
  filterTabActive: {
    background: "rgba(59,130,246,0.1)",
    borderColor: "rgba(59,130,246,0.25)",
    color: "#60a5fa",
  },
  remindersList: {
    flex: 1,
    overflowY: "auto",
    padding: "12px 24px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  // Loading skeleton
  loadingState: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  skeletonCard: {
    height: "64px",
    borderRadius: "12px",
    background: "linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 100%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s ease-in-out infinite",
  },

  // Empty state
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "60px 20px",
    textAlign: "center",
  },
  emptyStateIcon: {
    fontSize: "36px",
    opacity: 0.3,
    marginBottom: "6px",
  },
  emptyStateTitle: {
    fontSize: "15px",
    fontWeight: "500",
    color: "#2a3550",
  },
  emptyStateText: {
    fontSize: "13px",
    color: "#1e2a40",
  },

  // ── Settings layout ──
  settingsLayout: {
    flex: 1,
    overflowY: "auto",
    padding: "24px",
    maxWidth: "600px",
  },
  settingsHeader: {
    marginBottom: "24px",
  },
};
