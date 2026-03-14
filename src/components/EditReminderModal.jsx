// src/components/EditReminderModal.jsx
import { useState } from "react";
import { remindersAPI } from "../utils/api";
import toast from "react-hot-toast";
import { format } from "date-fns";

export default function EditReminderModal({ reminder, onClose, onUpdated }) {
  const [form, setForm] = useState({
    title: reminder.title,
    description: reminder.description || "",
    scheduledAt: format(new Date(reminder.scheduledAt), "yyyy-MM-dd'T'HH:mm"),
    recurrence: reminder.recurrence,
    priority: reminder.priority,
    notifyVia: reminder.notifyVia,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.title.trim() || !form.scheduledAt) {
      toast.error("Title and date are required");
      return;
    }
    setSaving(true);
    try {
      const res = await remindersAPI.update(reminder._id, {
        ...form,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
      });
      toast.success("Reminder updated!");
      onUpdated?.(res.data.reminder);
      onClose();
    } catch (err) {
      toast.error("Update failed");
      console.error("[EditModal] Error:", err);
    } finally {
      setSaving(false);
    }
  };

  const field = (label, children) => (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );

  const inputStyle = styles.input;
  const selectStyle = styles.select;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Edit Reminder</h2>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={styles.body}>
          {field("Title *",
            <input
              style={inputStyle}
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="What's the reminder?"
            />
          )}
          {field("Description",
            <textarea
              style={{ ...inputStyle, height: "70px", resize: "vertical" }}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Optional details..."
            />
          )}
          {field("Date & Time *",
            <input
              style={inputStyle}
              type="datetime-local"
              value={form.scheduledAt}
              onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
            />
          )}
          {field("Recurrence",
            <select style={selectStyle} value={form.recurrence} onChange={e => setForm(f => ({ ...f, recurrence: e.target.value }))}>
              {["none","daily","weekly","monthly","weekdays","weekends"].map(r => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          )}
          <div style={styles.row}>
            <div style={{ flex: 1 }}>
              {field("Priority",
                <select style={selectStyle} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  {["low","medium","high"].map(p => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              )}
            </div>
            <div style={{ flex: 1 }}>
              {field("Notify Via",
                <select style={selectStyle} value={form.notifyVia} onChange={e => setForm(f => ({ ...f, notifyVia: e.target.value }))}>
                  {["webapp","telegram","both"].map(n => (
                    <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        <div style={styles.footer}>
          <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={{ ...styles.saveBtn, opacity: saving ? 0.6 : 1 }} onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity:0; transform:translateY(20px) scale(0.97); }
          to { opacity:1; transform:translateY(0) scale(1); }
        }
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
    maxWidth: "460px",
    animation: "modalIn 0.3s ease forwards",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 24px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  title: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "18px",
    fontWeight: "700",
    color: "#f0f4ff",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#4a5a7a",
    cursor: "pointer",
    fontSize: "16px",
    padding: "4px 8px",
  },
  body: {
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  row: {
    display: "flex",
    gap: "12px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "12px",
    color: "#5a6a8a",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: "0.4px",
  },
  input: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    padding: "10px 14px",
    color: "#dde5f5",
    fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
    width: "100%",
    colorScheme: "dark",
  },
  select: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    padding: "10px 14px",
    color: "#dde5f5",
    fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
    width: "100%",
    cursor: "pointer",
  },
  footer: {
    display: "flex",
    gap: "10px",
    padding: "16px 24px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
  },
  cancelBtn: {
    flex: 1,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "10px",
    color: "#8090b0",
    cursor: "pointer",
    padding: "10px",
    fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
  },
  saveBtn: {
    flex: 1,
    background: "linear-gradient(135deg, #1d4ed8, #7c3aed)",
    border: "none",
    borderRadius: "10px",
    color: "#fff",
    cursor: "pointer",
    padding: "10px",
    fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: "500",
    transition: "opacity 0.2s",
  },
};
