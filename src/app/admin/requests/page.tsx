"use client";
// src/app/admin/requests/page.tsx
import { useEffect, useState, useCallback } from "react";

interface ContentRequest {
  _id: string;
  title: string;
  type: "movie" | "series";
  year?: number;
  requestedBy?: string;
  message?: string;
  status: "pending" | "fulfilled" | "rejected";
  createdAt: string;
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: "rgba(255,152,0,.12)", color: "#ff9800" },
  fulfilled: { bg: "rgba(76,175,80,.12)", color: "#4caf50" },
  rejected: { bg: "rgba(229,9,20,.12)", color: "#e50914" },
};

function adminFetch(path: string, opts?: RequestInit) {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") ?? "" : "";
  return fetch(path, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts?.headers ?? {}) },
  });
}

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<ContentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (filter !== "all") params.set("status", filter);
    adminFetch(`/api/admin/requests?${params}`)
      .then(r => r.json())
      .then(d => { setRequests(d.data ?? []); setTotalPages(d.totalPages ?? 1); setLoading(false); })
      .catch(() => setLoading(false));
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    const res = await adminFetch(`/api/admin/requests/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setRequests(prev => prev.map(r => r._id === id ? { ...r, status: status as ContentRequest["status"] } : r));
    }
    setUpdating(null);
  };

  const deleteRequest = async (id: string) => {
    if (!confirm("Delete this request?")) return;
    setUpdating(id);
    await adminFetch(`/api/admin/requests/${id}`, { method: "DELETE" });
    setRequests(prev => prev.filter(r => r._id !== id));
    setUpdating(null);
  };

  const pendingCount = requests.filter(r => r.status === "pending").length;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, letterSpacing: 2, color: "#fff", marginBottom: 4 }}>
          REQUESTS {pendingCount > 0 && <span style={{ fontSize: 18, color: "#ff9800" }}>({pendingCount} pending)</span>}
        </h1>
        <p style={{ color: "#555", fontSize: 13 }}>Content requests submitted by users</p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {["all", "pending", "fulfilled", "rejected"].map(f => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            style={{ padding: "8px 18px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", textTransform: "capitalize", background: filter === f ? "#e50914" : "rgba(255,255,255,.06)", color: filter === f ? "#fff" : "#888" }}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}><div className="spinner" style={{ margin: "0 auto" }} /></div>
      ) : requests.length === 0 ? (
        <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 16, padding: 60, textAlign: "center", color: "#555" }}>
          No {filter === "all" ? "" : filter} requests yet.
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {requests.map(req => (
              <div key={req._id} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 14, padding: "18px 22px", display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
                {/* Type badge */}
                <div style={{ width: 48, height: 48, borderRadius: 12, background: req.type === "movie" ? "rgba(229,9,20,.12)" : "rgba(123,47,247,.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                  {req.type === "movie" ? "🎬" : "📺"}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: "#eee" }}>{req.title}</span>
                    {req.year && <span style={{ color: "#555", fontSize: 13 }}>{req.year}</span>}
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, textTransform: "capitalize", ...STATUS_COLORS[req.status] }}>
                      {req.status}
                    </span>
                  </div>
                  {req.requestedBy && (
                    <div style={{ fontSize: 12, color: "#555", marginBottom: req.message ? 4 : 0 }}>
                      By: {req.requestedBy}
                    </div>
                  )}
                  {req.message && (
                    <div style={{ fontSize: 13, color: "#888", fontStyle: "italic" }}>"{req.message}"</div>
                  )}
                  <div style={{ fontSize: 11, color: "#444", marginTop: 6 }}>
                    {new Date(req.createdAt).toLocaleString()}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
                  {req.status !== "fulfilled" && (
                    <button
                      onClick={() => updateStatus(req._id, "fulfilled")}
                      disabled={updating === req._id}
                      style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(76,175,80,.12)", border: "1px solid rgba(76,175,80,.25)", color: "#4caf50", fontSize: 12, cursor: "pointer" }}
                    >
                      ✓ Fulfilled
                    </button>
                  )}
                  {req.status !== "rejected" && (
                    <button
                      onClick={() => updateStatus(req._id, "rejected")}
                      disabled={updating === req._id}
                      style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(229,9,20,.08)", border: "1px solid rgba(229,9,20,.2)", color: "#e50914", fontSize: 12, cursor: "pointer" }}
                    >
                      ✕ Reject
                    </button>
                  )}
                  {req.status !== "pending" && (
                    <button
                      onClick={() => updateStatus(req._id, "pending")}
                      disabled={updating === req._id}
                      style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(255,152,0,.08)", border: "1px solid rgba(255,152,0,.2)", color: "#ff9800", fontSize: 12, cursor: "pointer" }}
                    >
                      ↺ Pending
                    </button>
                  )}
                  <button
                    onClick={() => deleteRequest(req._id)}
                    disabled={updating === req._id}
                    style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(255,255,255,.04)", border: "1px solid #222", color: "#555", fontSize: 12, cursor: "pointer" }}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: "8px 18px", borderRadius: 8, background: "#111", border: "1px solid #222", color: "#ccc", cursor: "pointer" }}>← Prev</button>
              <span style={{ padding: "8px 16px", color: "#666", fontSize: 13 }}>Page {page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: "8px 18px", borderRadius: 8, background: "#111", border: "1px solid #222", color: "#ccc", cursor: "pointer" }}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
