"use client";
// src/components/admin/AdminShell.tsx
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/movies", label: "Movies", icon: "🎬" },
  { href: "/admin/series", label: "Series", icon: "📺" },
  { href: "/admin/sync", label: "Sync", icon: "🔄" },
  { href: "/admin/requests", label: "Requests", icon: "📋" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") { setReady(true); return; }
    const token = localStorage.getItem("admin_token");
    if (!token) { router.replace("/admin/login"); return; }
    setReady(true);
  }, [pathname, router]);

  const logout = () => {
    localStorage.removeItem("admin_token");
    document.cookie = "admin_token=; Max-Age=0; path=/";
    router.push("/admin/login");
  };

  if (!ready) return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 40, height: 40, border: "3px solid rgba(229,9,20,.2)", borderTopColor: "#e50914", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (pathname === "/admin/login") return <>{children}</>;

  const sidebarContent = (
    <>
      <div style={{ padding: "24px 20px", borderBottom: "1px solid #1a1a1a" }}>
        <Link href="/" style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, letterSpacing: 2, textDecoration: "none", display: "block" }}>
          <span style={{ color: "#e50914" }}>CINE</span><span style={{ color: "#fff" }}>FLIX</span>
        </Link>
        <div style={{ fontSize: 11, color: "#444", marginTop: 4, letterSpacing: 1 }}>ADMIN PANEL</div>
      </div>
      <nav style={{ flex: 1, padding: "16px 12px" }}>
        {NAV.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 16px", borderRadius: 10, marginBottom: 4,
              fontSize: 14, fontWeight: 500, textDecoration: "none",
              background: pathname === href ? "rgba(229,9,20,.15)" : "transparent",
              color: pathname === href ? "#e50914" : "#aaa",
              transition: "all .2s",
            }}
          >
            <span style={{ fontSize: 18 }}>{icon}</span>{label}
          </Link>
        ))}
      </nav>
      <div style={{ padding: "16px 12px", borderTop: "1px solid #1a1a1a" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 10, marginBottom: 8, fontSize: 13, color: "#666", textDecoration: "none" }}>
          ← View Site
        </Link>
        <button onClick={logout} style={{ width: "100%", padding: "10px 16px", borderRadius: 10, background: "rgba(229,9,20,.08)", border: "1px solid rgba(229,9,20,.15)", color: "#e50914", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
          🚪 Logout
        </button>
      </div>
    </>
  );

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", display: "flex" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes sidebarSlide{from{transform:translateX(-100%)}to{transform:translateX(0)}}
        @keyframes overlayFade{from{opacity:0}to{opacity:1}}
        .admin-sidebar{width:240px;background:#0d0d0d;border-right:1px solid #1a1a1a;display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:50}
        .admin-topbar{display:none}
        .admin-main{margin-left:240px;padding:32px;flex:1;min-height:100vh;max-width:calc(100vw - 240px)}
        @media(max-width:768px){
          .admin-sidebar{display:none!important}
          .admin-topbar{display:flex!important;position:fixed;top:0;left:0;right:0;height:56px;background:#0d0d0d;border-bottom:1px solid #1a1a1a;align-items:center;padding:0 16px;z-index:50;justify-content:space-between}
          .admin-main{margin-left:0!important;padding:72px 16px 32px!important;max-width:100vw!important}
        }
      `}</style>

      {/* Desktop sidebar */}
      <aside className="admin-sidebar">{sidebarContent}</aside>

      {/* Mobile topbar */}
      <div className="admin-topbar">
        <Link href="/" style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, letterSpacing: 2, textDecoration: "none" }}>
          <span style={{ color: "#e50914" }}>CINE</span><span style={{ color: "#fff" }}>FLIX</span>
        </Link>
        <button onClick={() => setMobileOpen(o => !o)} style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 22 }}>☰</button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div onClick={() => setMobileOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", zIndex: 60, animation: "overlayFade .2s ease" }} />
          <aside style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 260, background: "#0d0d0d", zIndex: 70, display: "flex", flexDirection: "column", animation: "sidebarSlide .25s ease", borderRight: "1px solid #1a1a1a" }}>
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Main */}
      <main className="admin-main">{children}</main>
    </div>
  );
}
