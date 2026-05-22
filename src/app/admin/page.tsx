"use client";
// src/app/admin/page.tsx
import { useEffect, useState } from "react";

interface Stats {
  totalMovies: number;
  totalSeries: number;
  totalFiles: number;
  totalRequests: number;
  pendingRequests: number;
  recentSyncs: {
    _id: string;
    folderId: string;
    filesDetected: number;
    filesAdded: number;
    filesRemoved: number;
    errors: string[];
    duration: number;
    createdAt: string;
  }[];
}

function StatCard({ label, value, icon, color = "#e50914", sub }: { label: string; value: number | string; icon: string; color?: string; sub?: string }) {
  return (
    <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 16, padding: "24px 28px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 20, right: 20, fontSize: 32, opacity: 0.15 }}>{icon}</div>
      <div style={{ fontSize: 13, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 36, fontWeight: 800, color, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function adminFetch(path: string) {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") ?? "" : "";
  return fetch(path, { headers: { Authorization: `Bearer ${token}` } });
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string>("");

  useEffect(() => {
    adminFetch("/api/admin/stats")
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const triggerSync = async () => {
    setSyncing(true);
    setSyncResult("");
    try {
      const res = await adminFetch("/api/admin/sync");
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      // wait for it — long-running
      const data = await res.json();
      setSyncResult(`✅ Sync complete: +${data.filesAdded} added, -${data.filesRemoved} removed, ${data.filesDetected} detected`);
      // Refresh stats
      adminFetch("/api/admin/stats").then(r => r.json()).then(d => setStats(d));
    } catch (e: any) {
      setSyncResult(`❌ ${e.message ?? "Sync failed"}`);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 36, letterSpacing: 2, color: "#fff", marginBottom: 4 }}>DASHBOARD</h1>
          <p style={{ color: "#555", fontSize: 14 }}>Overview of your Cineflix platform</p>
        </div>
        <button
          onClick={triggerSync}
          disabled={syncing}
          style={{ padding: "12px 24px", background: "#e50914", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: syncing ? 0.7 : 1, display: "flex", alignItems: "center", gap: 8 }}
        >
          {syncing ? <><span style={{ display: "inline-block", animation: "spin .8s linear infinite" }}>🔄</span> Syncing…</> : "🔄 Sync BuzzHeavier"}
        </button>
      </div>

      {syncResult && (
        <div style={{ background: syncResult.startsWith("✅") ? "rgba(76,175,80,.1)" : "rgba(229,9,20,.1)", border: `1px solid ${syncResult.startsWith("✅") ? "rgba(76,175,80,.3)" : "rgba(229,9,20,.3)"}`, borderRadius: 12, padding: "14px 20px", marginBottom: 24, fontSize: 14, color: "#ccc" }}>
          {syncResult}
        </div>
      )}

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16, marginBottom: 40 }}>
        <StatCard label="Movies" value={stats?.totalMovies ?? 0} icon="🎬" />
        <StatCard label="Series" value={stats?.totalSeries ?? 0} icon="📺" color="#7b2ff7" />
        <StatCard label="Total Files" value={stats?.totalFiles ?? 0} icon="📁" color="#0066cc" />
        <StatCard label="Requests" value={stats?.totalRequests ?? 0} icon="📋" color="#ff9800" sub={`${stats?.pendingRequests ?? 0} pending`} />
      </div>

      {/* Recent sync logs */}
      <div>
        <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, letterSpacing: 1.5, color: "#fff", marginBottom: 16 }}>RECENT SYNCS</h2>
        {stats?.recentSyncs?.length ? (
          <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 16, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1e1e1e" }}>
                  {["Folder ID", "Detected", "Added", "Removed", "Duration", "Errors", "Date"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#555", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recentSyncs.map(log => (
                  <tr key={log._id} style={{ borderBottom: "1px solid #161616" }}>
                    <td style={{ padding: "12px 16px", color: "#aaa", fontFamily: "monospace", fontSize: 12 }}>{log.folderId.slice(0, 12)}…</td>
                    <td style={{ padding: "12px 16px", color: "#ccc" }}>{log.filesDetected}</td>
                    <td style={{ padding: "12px 16px", color: "#4caf50" }}>+{log.filesAdded}</td>
                    <td style={{ padding: "12px 16px", color: log.filesRemoved > 0 ? "#e50914" : "#555" }}>{log.filesRemoved > 0 ? `-${log.filesRemoved}` : "0"}</td>
                    <td style={{ padding: "12px 16px", color: "#666" }}>{(log.duration / 1000).toFixed(1)}s</td>
                    <td style={{ padding: "12px 16px", color: log.errors?.length > 0 ? "#e50914" : "#4caf50" }}>{log.errors?.length > 0 ? `${log.errors.length} error(s)` : "None"}</td>
                    <td style={{ padding: "12px 16px", color: "#555" }}>{new Date(log.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 16, padding: "40px", textAlign: "center", color: "#555" }}>
            No sync logs yet. Click "Sync BuzzHeavier" to run your first sync.
          </div>
        )}
      </div>
    </div>
  );
}
