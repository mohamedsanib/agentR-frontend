// src/components/ReminderCard.jsx
import { useState } from "react";
import { remindersAPI } from "../utils/api";
import toast from "react-hot-toast";
import { format, isToday, isTomorrow, isPast } from "date-fns";

const PRIORITY_CONFIG = {
  high:   { color: "#f87171", bg: "rgba(248,113,113,0.1)",  label: "High",   dot: "#f87171" },
  medium: { color: "#fbbf24", bg: "rgba(251,191,36,0.1)",   label: "Medium", dot: "#fbbf24" },
  low:    { color: "#4ade80", bg: "rgba(74,222,128,0.1)",   label: "Low",    dot: "#4ade80" },
};

const RECURRENCE_LABELS = {
  none: null,
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  weekdays: "Weekdays",
  weekends: "Weekends",
};

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isToday(d)) return `Today, ${format(d, "h:mm a")}`;
  if (isTomorrow(d)) return `Tomorrow, ${format(d, "h:mm a")}`;
  return format(d, "MMM d, h:mm a");
}

export default function ReminderCard({ reminder, onDelete, onUpdate, onEdit }) {
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const pc = PRIORITY_CONFIG[reminder.priority] || PRIORITY_CONFIG.medium;
  const isOverdue = isPast(new Date(reminder.scheduledAt)) && reminder.status === "active";
  const recLabel = RECURRENCE_LABELS[reminder.recurrence];

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm(`Delete "${reminder.title}"?`)) return;
    setDeleting(true);
    try {
      await remindersAPI.delete(reminder._id);
      toast.success("Reminder deleted");
      onDelete?.(reminder._id);
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      style={{
        ...styles.card,
        ...(isOverdue ? styles.cardOverdue : {}),
        borderLeftColor: pc.dot,
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={styles.top}>
        {/* Priority dot */}
        <div style={{ ...styles.dot, background: pc.dot }} />

        {/* Title & tags */}
        <div style={styles.main}>
          <div style={styles.titleRow}>
            <span style={{ ...styles.title, textDecoration: reminder.status === "completed" ? "line-through" : "none" }}>
              {reminder.title}
            </span>
            {recLabel && <span style={styles.recBadge}>🔄 {recLabel}</span>}
          </div>

          <div style={styles.meta}>
            <span style={{ ...styles.time, color: isOverdue ? "#f87171" : "#7a8aaa" }}>
              {isOverdue ? "⚠️ " : "🕐 "}{formatDate(reminder.scheduledAt)}
            </span>
            <span style={{ ...styles.priBadge, color: pc.color, background: pc.bg }}>
              {pc.label}
            </span>
            {reminder.source === "telegram" && <span style={styles.sourceBadge}>✈️ Telegram</span>}
          </div>

          {/* Tags */}
          {reminder.tags?.length > 0 && (
            <div style={styles.tags}>
              {reminder.tags.map(t => (
                <span key={t} style={styles.tag}>#{t}</span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={styles.actions} onClick={e => e.stopPropagation()}>
          <button style={styles.actionBtn} onClick={() => onEdit?.(reminder)} title="Edit">✏️</button>
          <button
            style={{ ...styles.actionBtn, ...(deleting ? styles.deleting : {}) }}
            onClick={handleDelete}
            disabled={deleting}
            title="Delete"
          >
            {deleting ? "..." : "🗑️"}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (reminder.description || reminder.originalText) && (
        <div style={styles.expanded}>
          {reminder.description && <p style={styles.desc}>{reminder.description}</p>}
          {reminder.originalText && (
            <p style={styles.original}>
              <span style={styles.originalLabel}>Original: </span>
              "{reminder.originalText}"
            </p>
          )}
          <div style={styles.expandedMeta}>
            <span>Created {format(new Date(reminder.createdAt), "MMM d, yyyy")}</span>
            <span>Via {reminder.notifyVia}</span>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: "rgba(13,18,32,0.8)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderLeft: "3px solid transparent",
    borderRadius: "12px",
    padding: "14px 16px",
    cursor: "pointer",
    transition: "border-color 0.2s, background 0.2s, transform 0.15s",
    "&:hover": { background: "rgba(20,28,48,0.9)" },
  },
  cardOverdue: {
    background: "rgba(248,113,113,0.04)",
    borderColor: "rgba(248,113,113,0.2)",
  },
  top: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
  },
  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    marginTop: "6px",
    flexShrink: 0,
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "5px",
  },
  title: {
    fontSize: "15px",
    fontWeight: "500",
    color: "#dde5f5",
    fontFamily: "'DM Sans', sans-serif",
  },
  recBadge: {
    fontSize: "10px",
    background: "rgba(99,102,241,0.15)",
    color: "#a5b4fc",
    border: "1px solid rgba(99,102,241,0.25)",
    borderRadius: "20px",
    padding: "1px 7px",
  },
  meta: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  time: {
    fontSize: "12px",
    color: "#7a8aaa",
  },
  priBadge: {
    fontSize: "10px",
    borderRadius: "20px",
    padding: "1px 8px",
    fontWeight: "500",
  },
  sourceBadge: {
    fontSize: "10px",
    background: "rgba(0,136,204,0.1)",
    color: "#4db6e8",
    borderRadius: "20px",
    padding: "1px 7px",
  },
  tags: {
    display: "flex",
    gap: "5px",
    flexWrap: "wrap",
    marginTop: "5px",
  },
  tag: {
    fontSize: "10px",
    color: "#4a5a7a",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "4px",
    padding: "1px 6px",
  },
  actions: {
    display: "flex",
    gap: "4px",
    flexShrink: 0,
  },
  actionBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    padding: "4px 6px",
    borderRadius: "6px",
    opacity: 0.6,
    transition: "opacity 0.2s, background 0.2s",
  },
  deleting: {
    opacity: 0.3,
    cursor: "not-allowed",
  },
  expanded: {
    marginTop: "12px",
    paddingTop: "12px",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  desc: {
    fontSize: "13px",
    color: "#8a9ab8",
    lineHeight: "1.5",
  },
  original: {
    fontSize: "12px",
    color: "#4a5a7a",
    fontStyle: "italic",
  },
  originalLabel: {
    fontStyle: "normal",
    color: "#3a4a6a",
  },
  expandedMeta: {
    display: "flex",
    gap: "16px",
    fontSize: "11px",
    color: "#3a4a6a",
    marginTop: "4px",
  },
};
