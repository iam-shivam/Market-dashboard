// src/App.tsx
// Root component. Decides what to render based on auth state.
// No React Router needed — simple conditional rendering.

// import React from "react";
import LoginPage from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { AuthProvider, useAuth } from "./context/AuthContext";
// import { AuthProvider, useAuth } from "../frontend/src/context/AuthContext";
// import LoginPage from "../frontend/src/pages/Login";
// import Dashboard from "../frontend/src/pages/Dashboard";

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#020b18", display: "flex", alignItems: "center", justifyContent: "center", color: "#0ea5e9", fontFamily: "JetBrains Mono", fontSize: 13 }}>
        Checking session...
      </div>
    );
  }

  // user exists → Dashboard, otherwise → LoginPage
  return user ? <Dashboard /> : <LoginPage />;
}

export default function App() {
  return (
    // AuthProvider makes useAuth() work in any child component
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// src/main.tsx  — React entry point, mounts App into index.html
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// import React from "react";
// import ReactDOM from "react-dom/client";
// import App from "./App";
// import "./index.css";
//
// ReactDOM.createRoot(document.getElementById("root")!).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// src/index.css
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap');
// *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
// body { background: #020b18; color: #cbd5e1; font-family: 'JetBrains Mono', monospace; }
// input:focus { border-color: #0ea5e9 !important; outline: none; }
// ::-webkit-scrollbar { width: 5px; height: 5px; }
// ::-webkit-scrollbar-track { background: #020b18; }
// ::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 3px; }
// select option { background: #0a1628; }
