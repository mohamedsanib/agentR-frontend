// src/components/LoadingScreen.jsx
export default function LoadingScreen() {
  return (
    <div style={{
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#080c14",
      flexDirection: "column",
      gap: "20px",
    }}>
      <div style={{
        width: "48px",
        height: "48px",
        borderRadius: "14px",
        background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "22px",
        animation: "pulse 1.5s ease-in-out infinite",
      }}>
        🔔
      </div>
      <div style={{
        display: "flex",
        gap: "6px",
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "#3b82f6",
            animation: `bounce 0.8s ease-in-out ${i * 0.15}s infinite alternate`,
          }} />
        ))}
      </div>
      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(0.95);opacity:0.8} }
        @keyframes bounce { from{transform:translateY(0)} to{transform:translateY(-8px)} }
      `}</style>
    </div>
  );
}
