"use client";
// src/app/admin/series/page.tsx
import { useEffect, useState, useCallback } from "react";

interface SeriesItem {
  _id: string;
  title: string;
  year: number;
  rating: number;
  genres: string[];
  isFeatured: boolean;
  posterPath?: string;
  status?: string;
  seasons: { seasonNumber: number; episodes: { files: unknown[] }[] }[];
  createdAt: string;
}

function adminFetch(path: string, opts?: RequestInit) {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") ?? "" : "";
  return fetch(path, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts?.headers ?? {}) },
  });
}

export default function AdminSeriesPage() {
  const [series, setSeries] = useState<SeriesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [togglingFeatured, setTogglingFeatured] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (debouncedQ) params.set("q", debouncedQ);
    adminFetch(`/api/admin/series?${params}`)
      .then(r => r.json())
      .then(d => { setSeries(d.data ?? []); setTotalPages(d.totalPages ?? 1); setLoading(false); })
      .catch(() => setLoading(false));
  }, [page, debouncedQ]);

  useEffect(() => { load(); }, [load]);

  const deleteSeries = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}" and all its files? This cannot be undone.`)) return;
    setDeleting(id);
    await adminFetch(`/api/admin/series/${id}`, { method: "DELETE" });
    setSeries(prev => prev.filter(s => s._id !== id));
    setDeleting(null);
  };

  const toggleFeatured = async (item: SeriesItem) => {
    setTogglingFeatured(item._id);
    const res = await adminFetch(`/api/admin/series/${item._id}`, {
      method: "PUT",
      body: JSON.stringify({ isFeatured: !item.isFeatured }),
    });
    if (res.ok) setSeries(prev => prev.map(s => s._id === item._id ? { ...s, isFeatured: !s.isFeatured } : s));
    setTogglingFeatured(null);
  };

  const totalEpisodes = (s: SeriesItem) =>
    s.seasons?.reduce((acc, season) => acc + (season.episodes?.length ?? 0), 0) ?? 0;

  const totalFiles = (s: SeriesItem) =>
    s.seasons?.reduce((acc, season) =>
      acc + season.episodes?.reduce((a, ep) => a + (ep.files?.length ?? 0), 0), 0) ?? 0;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, letterSpacing: 2, color: "#fff" }}>TV SERIES</h1>
          <p style={{ color: "#555", fontSize: 13 }}>Manage all TV shows in the database</p>
        </div>
      </div>

      <div style={{ position: "relative", maxWidth: 400, marginBottom: 24 }}>
        <input
          placeholder="Search series…"
          value={q}
          onChange={e => { setQ(e.target.value); setPage(1); }}
          style={{ width: "100%", background: "#111", border: "1.5px solid #222", borderRadius: 10, color: "#fff", padding: "10px 40px 10px 16px", fontSize: 14, outline: "none", boxSizing: "border-box" }}
        />
        <svg style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}><div className="spinner" style={{ margin: "0 auto" }} /></div>
      ) : (
        <>
          <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 16, overflow: "hidden" }}>
            {series.length === 0 ? (
              <div style={{ padding: 60, textAlign: "center", color: "#555" }}>
                No series found. Sync BuzzHeavier to populate.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1e1e1e" }}>
                    {["Poster", "Title", "Year", "Seasons", "Episodes", "Files", "Featured", "Actions"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#555", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {series.map(item => (
                    <tr key={item._id} style={{ borderBottom: "1px solid #161616" }}>
                      <td style={{ padding: "10px 16px" }}>
                        {item.posterPath
                          ? <img src={item.posterPath} alt="" style={{ width: 36, height: 52, objectFit: "cover", borderRadius: 6 }} />
                          : <div style={{ width: 36, height: 52, background: "#1a1a1a", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📺</div>}
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <div style={{ color: "#eee", fontWeight: 600 }}>{item.title}</div>
                        <div style={{ fontSize: 11, color: "#555" }}>{item.status}</div>
                      </td>
                      <td style={{ padding: "10px 16px", color: "#888" }}>{item.year}</td>
                      <td style={{ padding: "10px 16px", color: "#ccc" }}>{item.seasons?.length ?? 0}</td>
                      <td style={{ padding: "10px 16px", color: "#ccc" }}>{totalEpisodes(item)}</td>
                      <td style={{ padding: "10px 16px", color: totalFiles(item) > 0 ? "#4caf50" : "#555" }}>{totalFiles(item)}</td>
                      <td style={{ padding: "10px 16px" }}>
                        <button
                          onClick={() => toggleFeatured(item)}
                          disabled={togglingFeatured === item._id}
                          style={{ padding: "4px 12px", borderRadius: 6, border: "none", fontSize: 12, cursor: "pointer", fontWeight: 600, background: item.isFeatured ? "#e50914" : "rgba(255,255,255,.06)", color: item.isFeatured ? "#fff" : "#666" }}
                        >
                          {item.isFeatured ? "★ Featured" : "☆ Feature"}
                        </button>
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <button
                          onClick={() => deleteSeries(item._id, item.title)}
                          disabled={deleting === item._id}
                          style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(229,9,20,.12)", border: "1px solid rgba(229,9,20,.2)", color: "#e50914", fontSize: 12, cursor: "pointer" }}
                        >
                          {deleting === item._id ? "…" : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
