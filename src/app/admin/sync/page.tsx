"use client";
// src/app/admin/sync/page.tsx
import { useEffect, useState } from "react";

interface SyncLog {
  _id: string;
  folderId: string;
  filesDetected: number;
  filesAdded: number;
  filesRemoved: number;
  errors: string[];
  duration: number;
  createdAt: string;
}

function adminFetch(path: string, opts?: RequestInit) {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") ?? "" : "";
  return fetch(path, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts?.headers ?? {}) },
  });
}

export default function AdminSyncPage() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [folderIds, setFolderIds] = useState("");
  const [expandedErrors, setExpandedErrors] = useState<string | null>(null);

  const loadLogs = () => {
    setLoading(true);
    adminFetch("/api/admin/sync?limit=30")
      .then(r => r.json())
      .then(d => { setLogs(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadLogs(); }, []);

  const runSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const body: Record<string, unknown> = {};
      if (folderIds.trim()) {
        body.folderIds = folderIds.split(",").map(s => s.trim()).filter(Boolean);
      }
      const res = await adminFetch("/api/admin/sync", {
        method: "POST",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sync failed");
      setSyncResult({
        ok: true,
        msg: `Sync complete — Detected: ${data.filesDetected}, Added: ${data.filesAdded}, Removed: ${data.filesRemoved}, Duration: ${(data.duration / 1000).toFixed(1)}s${data.errors?.length ? `, Errors: ${data.errors.length}` : ""}`,
      });
      loadLogs();
    } catch (e: any) {
      setSyncResult({ ok: false, msg: e.message ?? "Sync failed" });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, letterSpacing: 2, color: "#fff", marginBottom: 4 }}>SYNC MANAGER</h1>
        <p style={{ color: "#555", fontSize: 13 }}>Manually trigger BuzzHeavier sync and view logs</p>
      </div>

      {/* Sync trigger card */}
      <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 16, padding: 28, marginBottom: 32 }}>
        <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: 1.5, color: "#fff", marginBottom: 16 }}>MANUAL SYNC</h2>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: "#555", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 8 }}>
            Override Folder IDs (optional — comma separated)
          </label>
          <input
            value={folderIds}
            onChange={e => setFolderIds(e.target.value)}
            placeholder="Leave blank to use BUZZHEAVIER_FOLDER_ID from env"
            style={{ width: "100%", maxWidth: 520, background: "#0d0d0d", border: "1.5px solid #222", borderRadius: 10, color: "#fff", padding: "10px 16px", fontSize: 13, outline: "none", boxSizing: "border-box" }}
          />
          <p style={{ fontSize: 12, color: "#444", marginTop: 6 }}>If blank, uses <code style={{ color: "#666" }}>BUZZHEAVIER_FOLDER_ID</code> env variable.</p>
        </div>

        <button
          onClick={runSync}
          disabled={syncing}
          style={{ padding: "12px 28px", background: "#e50914", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: syncing ? "not-allowed" : "pointer", opacity: syncing ? 0.7 : 1, display: "flex", alignItems: "center", gap: 8 }}
        >
          {syncing
            ? <><span style={{ display: "inline-block", animation: "spin .8s linear infinite" }}>⟳</span> Syncing…</>
            : "▶ Run Sync Now"}
        </button>

        {syncResult && (
          <div style={{ marginTop: 16, padding: "12px 18px", borderRadius: 10, background: syncResult.ok ? "rgba(76,175,80,.08)" : "rgba(229,9,20,.08)", border: `1px solid ${syncResult.ok ? "rgba(76,175,80,.25)" : "rgba(229,9,20,.25)"}`, fontSize: 13, color: syncResult.ok ? "#4caf50" : "#e50914" }}>
            {syncResult.ok ? "✅ " : "❌ "}{syncResult.msg}
          </div>
        )}
      </div>

      {/* Logs table */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: 1.5, color: "#fff" }}>SYNC LOGS</h2>
          <button onClick={loadLogs} style={{ padding: "6px 14px", background: "rgba(255,255,255,.06)", border: "1px solid #2a2a2a", borderRadius: 8, color: "#aaa", fontSize: 12, cursor: "pointer" }}>Refresh</button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 48 }}><div className="spinner" style={{ margin: "0 auto" }} /></div>
        ) : logs.length === 0 ? (
          <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 16, padding: 48, textAlign: "center", color: "#555" }}>
            No sync logs yet. Run your first sync above.
          </div>
        ) : (
          <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 16, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1e1e1e" }}>
                  {["Date", "Folder", "Detected", "Added", "Removed", "Duration", "Status"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#555", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <>
                    <tr
                      key={log._id}
                      style={{ borderBottom: "1px solid #161616", cursor: log.errors?.length > 0 ? "pointer" : "default" }}
                      onClick={() => log.errors?.length > 0 && setExpandedErrors(expandedErrors === log._id ? null : log._id)}
                    >
                      <td style={{ padding: "12px 16px", color: "#888" }}>{new Date(log.createdAt).toLocaleString()}</td>
                      <td style={{ padding: "12px 16px", color: "#666", fontFamily: "monospace", fontSize: 11 }}>{log.folderId.slice(0, 16)}…</td>
                      <td style={{ padding: "12px 16px", color: "#ccc" }}>{log.filesDetected}</td>
                      <td style={{ padding: "12px 16px", color: "#4caf50" }}>+{log.filesAdded}</td>
                      <td style={{ padding: "12px 16px", color: log.filesRemoved > 0 ? "#e50914" : "#555" }}>{log.filesRemoved > 0 ? `-${log.filesRemoved}` : "0"}</td>
                      <td style={{ padding: "12px 16px", color: "#666" }}>{(log.duration / 1000).toFixed(1)}s</td>
                      <td style={{ padding: "12px 16px" }}>
                        {log.errors?.length > 0
                          ? <span style={{ color: "#e50914", fontSize: 12 }}>⚠ {log.errors.length} error(s) ▾</span>
                          : <span style={{ color: "#4caf50", fontSize: 12 }}>✓ OK</span>}
                      </td>
                    </tr>
                    {expandedErrors === log._id && log.errors?.length > 0 && (
                      <tr key={`${log._id}-err`} style={{ background: "rgba(229,9,20,.04)" }}>
                        <td colSpan={7} style={{ padding: "12px 24px" }}>
                          <div style={{ fontSize: 12, color: "#e57373" }}>
                            {log.errors.map((e, i) => (
                              <div key={i} style={{ padding: "4px 0", borderBottom: "1px solid rgba(229,9,20,.08)", fontFamily: "monospace" }}>• {e}</div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
