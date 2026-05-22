"use client";
// src/app/admin/login/page.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      if (data.token) localStorage.setItem("admin_token", data.token);
      router.push("/admin");
    } catch (err: any) {
      setError(err.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 420, background: "#111", borderRadius: 20, padding: "40px 36px", border: "1px solid #222" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 36, letterSpacing: 3, marginBottom: 8 }}>
            <span style={{ color: "#e50914" }}>CINE</span><span style={{ color: "#fff" }}>FLIX</span>
          </div>
          <div style={{ color: "#555", fontSize: 13 }}>Admin Panel</div>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="admin@example.com"
              style={{ width: "100%", background: "rgba(255,255,255,.06)", border: "1.5px solid #2a2a2a", borderRadius: 10, color: "#fff", padding: "12px 16px", fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{ width: "100%", background: "rgba(255,255,255,.06)", border: "1.5px solid #2a2a2a", borderRadius: 10, color: "#fff", padding: "12px 16px", fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          {error && <div style={{ color: "#e50914", fontSize: 13, marginBottom: 16, textAlign: "center" }}>{error}</div>}
          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "14px", borderRadius: 10, background: "#e50914", color: "#fff", border: "none", fontSize: 15, fontWeight: 600, cursor: "pointer", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
