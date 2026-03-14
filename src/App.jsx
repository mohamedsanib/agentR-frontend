// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import LoadingScreen from "./components/LoadingScreen";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/dashboard" element={user ? <DashboardPage /> : <Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
