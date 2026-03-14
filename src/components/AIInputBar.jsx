// src/components/AIInputBar.jsx
import { useState, useRef, useEffect } from "react";

const PLACEHOLDERS = [
  "Remind me to drink water every day at 8am...",
  "Meeting with client tomorrow at 3pm...",
  "Call mom every Sunday at 11am...",
  "Submit report by Friday 5pm...",
  "Show my reminders...",
  "Delete reminder to call John...",
  "What are my reminders for today?",
];

export default function AIInputBar({ onSend, loading, followUpQuestion }) {
  const [value, setValue] = useState("");
  const [phIdx, setPhIdx] = useState(0);
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef(null);

  // Rotate placeholder
  useEffect(() => {
    if (followUpQuestion) return;
    const interval = setInterval(() => {
      setPhIdx(i => (i + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [followUpQuestion]);

  // Auto-resize textarea
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
  }, [value]);

  const handleSend = () => {
    if (!value.trim() || loading) return;
    const msg = value.trim();
    setValue("");
    onSend(msg);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={styles.wrap}>
      {/* Follow-up question banner */}
      {followUpQuestion && (
        <div style={styles.followUp}>
          <span style={styles.followUpIcon}>🤖</span>
          <span style={styles.followUpText}>{followUpQuestion}</span>
        </div>
      )}

      <div style={{
        ...styles.bar,
        ...(focused ? styles.barFocused : {}),
        ...(loading ? styles.barLoading : {}),
      }}>
        {/* Animated gradient border when focused */}
        <div style={{ ...styles.gradientBorder, opacity: focused ? 1 : 0 }} />

        {/* Mic/AI icon */}
        <div style={styles.leftIcon}>
          {loading ? (
            <div style={styles.aiSpinner} />
          ) : (
            <span style={{ fontSize: "18px", opacity: focused ? 1 : 0.5 }}>✨</span>
          )}
        </div>

        {/* Input */}
        <textarea
          ref={textareaRef}
          style={styles.textarea}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={followUpQuestion ? "Type your answer..." : PLACEHOLDERS[phIdx]}
          disabled={loading}
          rows={1}
        />

        {/* Send button */}
        <button
          style={{
            ...styles.sendBtn,
            ...(value.trim() && !loading ? styles.sendBtnActive : {}),
          }}
          onClick={handleSend}
          disabled={!value.trim() || loading}
        >
          {loading ? (
            <span style={styles.loadingDots}>
              <span />
              <span />
              <span />
            </span>
          ) : (
            <span style={styles.sendIcon}>↑</span>
          )}
        </button>
      </div>

      {/* Hint */}
      {!followUpQuestion && (
        <p style={styles.hint}>
          Press <kbd style={styles.kbd}>Enter</kbd> to send · <kbd style={styles.kbd}>Shift+Enter</kbd> for newline
        </p>
      )}

      <style>{`
        @keyframes rotate {
          to { transform: rotate(360deg); }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes dot1 { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
        @keyframes dot2 { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
        @keyframes dot3 { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
        .ai-input-bar textarea::placeholder { color: #3a4a6a; transition: color 0.3s; }
        .ai-input-bar textarea:focus::placeholder { color: #4a5a7a; }
      `}</style>
    </div>
  );
}

const styles = {
  wrap: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  followUp: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    background: "rgba(59,130,246,0.08)",
    border: "1px solid rgba(59,130,246,0.2)",
    borderRadius: "12px",
    padding: "12px 16px",
    animation: "fadeIn 0.3s ease",
  },
  followUpIcon: {
    fontSize: "16px",
    flexShrink: 0,
    marginTop: "1px",
  },
  followUpText: {
    fontSize: "14px",
    color: "#93c5fd",
    lineHeight: "1.5",
  },
  bar: {
    position: "relative",
    display: "flex",
    alignItems: "flex-end",
    gap: "10px",
    background: "rgba(13,18,32,0.9)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "10px 10px 10px 14px",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  barFocused: {
    borderColor: "rgba(59,130,246,0.4)",
    boxShadow: "0 0 0 3px rgba(59,130,246,0.08), 0 8px 32px rgba(0,0,0,0.3)",
  },
  barLoading: {
    borderColor: "rgba(139,92,246,0.3)",
  },
  gradientBorder: {
    position: "absolute",
    inset: "-1px",
    borderRadius: "17px",
    background: "linear-gradient(90deg, #3b82f6, #8b5cf6, #14b8a6, #3b82f6)",
    backgroundSize: "200% 200%",
    animation: "gradientShift 3s ease infinite",
    zIndex: -1,
    transition: "opacity 0.3s",
  },
  leftIcon: {
    flexShrink: 0,
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "4px",
  },
  aiSpinner: {
    width: "18px",
    height: "18px",
    border: "2px solid rgba(139,92,246,0.3)",
    borderTopColor: "#8b5cf6",
    borderRadius: "50%",
    animation: "rotate 0.8s linear infinite",
  },
  textarea: {
    flex: 1,
    background: "none",
    border: "none",
    outline: "none",
    color: "#e8eaf0",
    fontSize: "15px",
    fontFamily: "'DM Sans', sans-serif",
    lineHeight: "1.5",
    resize: "none",
    overflow: "hidden",
    minHeight: "24px",
    maxHeight: "120px",
    padding: "2px 0",
  },
  sendBtn: {
    flexShrink: 0,
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    border: "none",
    background: "rgba(255,255,255,0.06)",
    color: "#4a5a7a",
    cursor: "not-allowed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.2s, color 0.2s, transform 0.15s",
    fontSize: "16px",
  },
  sendBtnActive: {
    background: "linear-gradient(135deg, #1d4ed8, #7c3aed)",
    color: "#fff",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(59,130,246,0.3)",
  },
  sendIcon: {
    fontWeight: "700",
    fontSize: "18px",
  },
  loadingDots: {
    display: "flex",
    gap: "3px",
    "& span": {
      width: "4px",
      height: "4px",
      borderRadius: "50%",
      background: "#8b5cf6",
    },
  },
  hint: {
    fontSize: "11px",
    color: "#2a3550",
    textAlign: "center",
  },
  kbd: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "4px",
    padding: "1px 5px",
    fontSize: "10px",
    fontFamily: "monospace",
    color: "#4a5a7a",
  },
};
