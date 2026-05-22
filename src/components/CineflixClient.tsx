"use client";
// src/components/CineflixClient.tsx

import { useState, useEffect, useRef, useCallback } from "react";

/* ─── Types ─────────────────────────────────────────────────── */
interface FileEntry {
  _id: string;
  quality: string;
  language: string;
  downloadUrl: string;
  fileSize: number;
}

interface Episode {
  _id: string;
  episodeNumber: number;
  title: string;
  overview?: string;
  stillPath?: string;
  airDate?: string;
  files: FileEntry[];
}

interface Season {
  _id: string;
  seasonNumber: number;
  title: string;
  episodes: Episode[];
}

interface ContentItem {
  _id: string;
  title: string;
  overview: string;
  year: number;
  rating: number;
  genres: string[];
  runtime?: number;
  posterPath?: string;
  backdropPath?: string;
  tagline?: string;
  language?: string;
  status?: string;
  contentType: "movie" | "series";
  // movie
  files?: FileEntry[];
  // series
  seasons?: Season[];
  isFeatured?: boolean;
  slug: string;
}

/* ─── Helpers ────────────────────────────────────────────────── */
function qualityClass(q: string) {
  if (q === "4K" || q === "2160p") return "badge-4k";
  if (q === "1080p") return "badge-1080p";
  if (q === "720p") return "badge-720p";
  return "badge-480p";
}

function QBadge({ q }: { q: string }) {
  return <span className={`quality-badge ${qualityClass(q)}`}>{q}</span>;
}

function StarRating({ r }: { r: number }) {
  return (
    <span style={{ color: "#e50914", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="#e50914">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      {r?.toFixed(1)}
    </span>
  );
}

function formatBytes(b: number) {
  if (!b) return "";
  if (b >= 1e9) return (b / 1e9).toFixed(1) + " GB";
  return (b / 1e6).toFixed(0) + " MB";
}

const QUALITY_ORDER = ["480p", "720p", "1080p", "4K", "2160p"];

function getTopQuality(files: FileEntry[] = []) {
  if (!files.length) return "HD";
  const sorted = [...files].sort(
    (a, b) => QUALITY_ORDER.indexOf(b.quality) - QUALITY_ORDER.indexOf(a.quality)
  );
  return sorted[0].quality;
}

/* ─── Skeleton Card ──────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{ minWidth: 160, borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
      <div className="skeleton" style={{ width: "100%", paddingBottom: "150%", borderRadius: 12 }} />
      <div className="skeleton" style={{ height: 14, borderRadius: 6, margin: "8px 0 4px", width: "80%" }} />
      <div className="skeleton" style={{ height: 12, borderRadius: 6, width: "50%" }} />
    </div>
  );
}

/* ─── Movie Card ─────────────────────────────────────────────── */
function MovieCard({ item, onClick }: { item: ContentItem; onClick: (i: ContentItem) => void }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const topQ = item.contentType === "movie"
    ? getTopQuality(item.files)
    : getTopQuality(item.seasons?.flatMap(s => s.episodes.flatMap(e => e.files)) ?? []);

  return (
    <div
      className="card-hover"
      onClick={() => onClick(item)}
      style={{ minWidth: 160, maxWidth: 180, cursor: "pointer", position: "relative", borderRadius: 12, overflow: "hidden", flexShrink: 0 }}
    >
      {!imgLoaded && <div className="skeleton" style={{ position: "absolute", inset: 0, zIndex: 1 }} />}
      <div style={{ position: "relative", paddingBottom: "150%", background: "#111" }}>
        {item.posterPath ? (
          <img
            src={item.posterPath}
            alt={item.title}
            onLoad={() => setImgLoaded(true)}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: imgLoaded ? "block" : "none", borderRadius: 12 }}
          />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1a1a", fontSize: 40 }}>🎬</div>
        )}
        <div style={{ position: "absolute", top: 8, right: 8, zIndex: 3 }}>
          <QBadge q={topQ} />
        </div>
        <div
          className="card-overlay"
          style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,.95) 0%,rgba(0,0,0,.2) 60%,transparent 100%)", opacity: 0, transition: "opacity .3s", borderRadius: 12, zIndex: 2 }}
        >
          <div style={{ position: "absolute", bottom: 12, left: 12, right: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <StarRating r={item.rating} />
              <span style={{ fontSize: 10, color: "#aaa" }}>{item.contentType === "series" ? "Series" : "Movie"}</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {item.genres?.slice(0, 2).map(g => (
                <span key={g} style={{ fontSize: 10, color: "#ccc", background: "rgba(255,255,255,.1)", padding: "2px 6px", borderRadius: 10 }}>{g}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding: "8px 4px 0" }}>
        <div className="card-title-bar" style={{ fontSize: 13, fontWeight: 600, color: "#eee", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", transform: "translateY(4px)", transition: "transform .3s" }}>
          {item.title}
        </div>
        <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{item.year}</div>
      </div>
    </div>
  );
}

/* ─── Content Row ────────────────────────────────────────────── */
function ContentRow({
  title, items, onCardClick, loading,
}: {
  title: string; items: ContentItem[]; onCardClick: (i: ContentItem) => void; loading?: boolean;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "l" | "r") => {
    rowRef.current?.scrollBy({ left: dir === "r" ? 600 : -600, behavior: "smooth" });
  };

  return (
    <div style={{ marginBottom: 48, padding: "0 clamp(16px,4vw,48px)", position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <span className="section-title">{title}</span>
      </div>
      <div style={{ position: "relative" }}>
        <button className="row-scroll-btn" style={{ left: -8 }} onClick={() => scroll("l")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <div ref={rowRef} className="scrollbar-hide" style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 8 }}>
          {loading
            ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
            : items.map(item => <MovieCard key={item._id} item={item} onClick={onCardClick} />)
          }
          {!loading && items.length === 0 && (
            <div style={{ color: "#555", fontSize: 14, padding: "40px 0" }}>No content available yet. Add files to your BuzzHeavier folder to get started.</div>
          )}
        </div>
        <button className="row-scroll-btn" style={{ right: -8 }} onClick={() => scroll("r")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>
    </div>
  );
}

/* ─── Hero Banner ────────────────────────────────────────────── */
function HeroBanner({ items, onItemClick }: { items: ContentItem[]; onItemClick: (i: ContentItem) => void }) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (items.length <= 1) return;
    timerRef.current = setInterval(() => setIdx(i => (i + 1) % items.length), 7000);
    return () => clearInterval(timerRef.current);
  }, [items.length]);

  if (!items.length) {
    return (
      <div style={{ height: "70vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 64 }}>🎬</div>
        <div style={{ fontSize: 24, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 2, color: "#555" }}>NO CONTENT YET</div>
        <div style={{ fontSize: 14, color: "#444", textAlign: "center" }}>Add video files to your BuzzHeavier folder and trigger a sync to get started.</div>
      </div>
    );
  }

  const item = items[idx];
  const files = item.contentType === "movie"
    ? item.files ?? []
    : item.seasons?.flatMap(s => s.episodes.flatMap(e => e.files)) ?? [];
  const topQ = getTopQuality(files);

  return (
    <div style={{ position: "relative", height: "90vh", minHeight: 520, overflow: "hidden" }}>
      {/* Backdrop */}
      {item.backdropPath && (
        <img
          key={item._id}
          src={item.backdropPath}
          alt=""
          className="hero-img"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }}
        />
      )}
      {/* Gradient overlays */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right,rgba(10,10,10,.98) 0%,rgba(10,10,10,.7) 50%,rgba(10,10,10,.2) 100%)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40%", background: "linear-gradient(to top,#0a0a0a,transparent)" }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 10, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 clamp(16px,6vw,80px)", maxWidth: 720 }}>
        <div className="fade-up">
          {/* Meta tags */}
          <div className="hero-meta-tags" style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <QBadge q={topQ} />
            <span style={{ color: "#aaa", fontSize: 13 }}>{item.year}</span>
            {item.runtime && <span style={{ color: "#aaa", fontSize: 13 }}>{item.runtime} min</span>}
            {item.genres?.slice(0, 3).map(g => (
              <span key={g} style={{ background: "rgba(255,255,255,.08)", color: "#ccc", fontSize: 12, padding: "2px 10px", borderRadius: 12, border: "1px solid rgba(255,255,255,.1)" }}>{g}</span>
            ))}
          </div>

          {/* Title */}
          <h1 className="hero-title" style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(48px,8vw,96px)", letterSpacing: 3, lineHeight: 0.95, marginBottom: 16, color: "#fff" }}>
            {item.title}
          </h1>

          {item.tagline && (
            <p style={{ color: "#e50914", fontSize: 14, fontWeight: 600, letterSpacing: 1, marginBottom: 12, textTransform: "uppercase" }}>{item.tagline}</p>
          )}

          <p style={{ color: "#bbb", fontSize: 15, lineHeight: 1.6, marginBottom: 28, maxWidth: 560 }}>
            {item.overview?.length > 200 ? item.overview.slice(0, 200) + "…" : item.overview}
          </p>

          {/* Rating */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#e50914"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
              <span style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>{item.rating?.toFixed(1)}</span>
              <span style={{ color: "#666", fontSize: 13 }}>/10</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="hero-btns" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              className="btn-red"
              onClick={() => onItemClick(item)}
              style={{ padding: "14px 32px", borderRadius: 10, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              {files.length > 0 ? "Download Now" : "View Details"}
            </button>
            <button
              className="btn-ghost"
              onClick={() => onItemClick(item)}
              style={{ padding: "14px 28px", borderRadius: 10, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
              </svg>
              More Info
            </button>
          </div>
        </div>
      </div>

      {/* Slide dots */}
      {items.length > 1 && (
        <div style={{ position: "absolute", bottom: 80, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8, zIndex: 10 }}>
          {items.map((_, i) => (
            <div
              key={i}
              className={`hero-dot ${i === idx ? "active" : ""}`}
              onClick={() => { setIdx(i); clearInterval(timerRef.current); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Movie Modal ────────────────────────────────────────────── */
function MovieModal({ item, onClose }: { item: ContentItem; onClose: () => void }) {
  const [selLang, setSelLang] = useState("");
  const [selQuality, setSelQuality] = useState("");
  const files = item.files ?? [];

  const langs = [...new Set(files.map(f => f.language))];
  const qualities = [...new Set(
    files.filter(f => !selLang || f.language === selLang).map(f => f.quality)
  )].sort((a, b) => QUALITY_ORDER.indexOf(a) - QUALITY_ORDER.indexOf(b));

  useEffect(() => {
    if (langs.length) setSelLang(langs[0]);
  }, [item._id]);

  useEffect(() => {
    if (qualities.length && (!selQuality || !qualities.includes(selQuality))) {
      setSelQuality(qualities[qualities.length - 1]); // highest quality
    }
  }, [selLang]);

  const downloadFile = files.find(f => f.language === selLang && f.quality === selQuality);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        {/* Backdrop */}
        {item.backdropPath && (
          <div style={{ position: "relative", height: 320 }}>
            <img src={item.backdropPath} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,#111 0%,transparent 60%)" }} />
          </div>
        )}

        {/* Close */}
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 16, right: 16, background: "rgba(0,0,0,.7)", border: "1px solid rgba(255,255,255,.15)", color: "#fff", width: 36, height: 36, borderRadius: "50%", cursor: "pointer", fontSize: 18, zIndex: 10 }}
        >✕</button>

        <div style={{ padding: "28px 32px 32px", display: "flex", gap: 28 }}>
          {/* Poster */}
          {item.posterPath && (
            <img src={item.posterPath} alt={item.title} style={{ width: 140, height: 210, objectFit: "cover", borderRadius: 12, flexShrink: 0, boxShadow: "0 8px 32px rgba(0,0,0,.6)" }} />
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 36, letterSpacing: 2, color: "#fff", marginBottom: 4 }}>{item.title}</h2>
            {item.tagline && <p style={{ color: "#e50914", fontSize: 13, marginBottom: 12 }}>{item.tagline}</p>}

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
              <StarRating r={item.rating} />
              <span style={{ color: "#aaa", fontSize: 13 }}>{item.year}</span>
              {item.runtime && <span style={{ color: "#aaa", fontSize: 13 }}>{item.runtime} min</span>}
              {item.genres?.map(g => (
                <span key={g} style={{ background: "rgba(229,9,20,.1)", color: "#e50914", fontSize: 11, padding: "2px 8px", borderRadius: 10, border: "1px solid rgba(229,9,20,.2)" }}>{g}</span>
              ))}
            </div>

            <p style={{ color: "#bbb", fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>{item.overview}</p>

            {files.length > 0 ? (
              <div>
                {/* Language selector */}
                {langs.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: "#666", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Language</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {langs.map(lang => (
                        <button
                          key={lang}
                          className={`tab-btn ${selLang === lang ? "active-t" : "inactive-t"}`}
                          onClick={() => setSelLang(lang)}
                        >{lang}</button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quality selector */}
                {qualities.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, color: "#666", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Quality</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {qualities.map(q => (
                        <button
                          key={q}
                          className={`tab-btn ${selQuality === q ? "active-t" : "inactive-t"}`}
                          onClick={() => setSelQuality(q)}
                        >
                          <span className={`quality-badge ${qualityClass(q)}`} style={{ marginRight: 6 }}>{q}</span>
                          {downloadFile?.quality === q && downloadFile?.fileSize ? formatBytes(downloadFile.fileSize) : ""}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Download button */}
                {downloadFile && (
                  <a
                    href={downloadFile.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-red"
                    style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 28px", borderRadius: 10, fontSize: 15, textDecoration: "none" }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                    Download {selQuality} {selLang}
                    {downloadFile.fileSize ? ` · ${formatBytes(downloadFile.fileSize)}` : ""}
                  </a>
                )}
              </div>
            ) : (
              <div style={{ color: "#555", fontSize: 14 }}>No download files available yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Series Modal ───────────────────────────────────────────── */
function SeriesModal({ item, onClose }: { item: ContentItem; onClose: () => void }) {
  const seasons = item.seasons ?? [];
  const [selSeason, setSelSeason] = useState(seasons[0]?.seasonNumber ?? 1);
  const [selEp, setSelEp] = useState(0);
  const [selLang, setSelLang] = useState("");
  const [selQ, setSelQ] = useState("");

  const season = seasons.find(s => s.seasonNumber === selSeason);
  const episode = season?.episodes?.[selEp];
  const epFiles = episode?.files ?? [];

  const langs = [...new Set(epFiles.map(f => f.language))];
  const qualities = [...new Set(
    epFiles.filter(f => !selLang || f.language === selLang).map(f => f.quality)
  )].sort((a, b) => QUALITY_ORDER.indexOf(a) - QUALITY_ORDER.indexOf(b));

  useEffect(() => {
    if (langs.length) setSelLang(langs[0]);
  }, [selEp, selSeason]);

  useEffect(() => {
    if (qualities.length && (!selQ || !qualities.includes(selQ))) {
      setSelQ(qualities[qualities.length - 1]);
    }
  }, [selLang]);

  const downloadFile = epFiles.find(f => f.language === selLang && f.quality === selQ);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: 1040 }}>
        {item.backdropPath && (
          <div style={{ position: "relative", height: 280 }}>
            <img src={item.backdropPath} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,#111 0%,transparent 60%)" }} />
          </div>
        )}

        <button
          onClick={onClose}
          style={{ position: "absolute", top: 16, right: 16, background: "rgba(0,0,0,.7)", border: "1px solid rgba(255,255,255,.15)", color: "#fff", width: 36, height: 36, borderRadius: "50%", cursor: "pointer", fontSize: 18, zIndex: 10 }}
        >✕</button>

        <div style={{ padding: "24px 28px 32px" }}>
          {/* Header */}
          <div style={{ display: "flex", gap: 20, marginBottom: 24 }}>
            {item.posterPath && (
              <img src={item.posterPath} alt={item.title} style={{ width: 100, height: 150, objectFit: "cover", borderRadius: 10, flexShrink: 0 }} />
            )}
            <div>
              <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, letterSpacing: 2, color: "#fff", marginBottom: 6 }}>{item.title}</h2>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10, alignItems: "center" }}>
                <StarRating r={item.rating} />
                <span style={{ color: "#aaa", fontSize: 13 }}>{item.year}</span>
                {item.genres?.slice(0, 3).map(g => (
                  <span key={g} style={{ background: "rgba(229,9,20,.1)", color: "#e50914", fontSize: 11, padding: "2px 8px", borderRadius: 10, border: "1px solid rgba(229,9,20,.2)" }}>{g}</span>
                ))}
              </div>
              <p style={{ color: "#999", fontSize: 13, lineHeight: 1.6, maxWidth: 540 }}>
                {item.overview?.slice(0, 160)}{item.overview?.length > 160 ? "…" : ""}
              </p>
            </div>
          </div>

          {/* Season tabs */}
          {seasons.length > 0 ? (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                {seasons.map(s => (
                  <button
                    key={s.seasonNumber}
                    className={`tab-btn ${selSeason === s.seasonNumber ? "active-t" : "inactive-t"}`}
                    onClick={() => { setSelSeason(s.seasonNumber); setSelEp(0); }}
                  >S{String(s.seasonNumber).padStart(2, "0")}</button>
                ))}
              </div>

              {/* Episodes */}
              {season?.episodes?.length ? (
                <div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }} className="scrollbar-hide">
                    {season.episodes.map((ep, i) => (
                      <button
                        key={ep._id}
                        className={`ep-pill ${selEp === i ? "active-ep" : ""}`}
                        onClick={() => setSelEp(i)}
                      >
                        E{String(ep.episodeNumber).padStart(2, "0")}
                        {ep.files?.length > 0 && <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.7 }}>●</span>}
                      </button>
                    ))}
                  </div>

                  {episode && (
                    <div style={{ background: "#161616", borderRadius: 14, padding: 20, border: "1px solid #222" }}>
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontWeight: 700, fontSize: 16, color: "#fff", marginBottom: 4 }}>
                          E{String(episode.episodeNumber).padStart(2, "0")} – {episode.title}
                        </div>
                        {episode.airDate && <div style={{ fontSize: 12, color: "#555", marginBottom: 6 }}>{episode.airDate}</div>}
                        {episode.overview && <p style={{ color: "#888", fontSize: 13, lineHeight: 1.6 }}>{episode.overview}</p>}
                      </div>

                      {epFiles.length > 0 ? (
                        <>
                          {/* Language */}
                          {langs.length > 0 && (
                            <div style={{ marginBottom: 14 }}>
                              <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Language</div>
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {langs.map(lang => (
                                  <button key={lang} className={`tab-btn ${selLang === lang ? "active-t" : "inactive-t"}`} onClick={() => setSelLang(lang)}>{lang}</button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Quality */}
                          {qualities.length > 0 && (
                            <div style={{ marginBottom: 16 }}>
                              <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Quality</div>
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {qualities.map(q => (
                                  <button key={q} className={`tab-btn ${selQ === q ? "active-t" : "inactive-t"}`} onClick={() => setSelQ(q)}>
                                    <span className={`quality-badge ${qualityClass(q)}`} style={{ marginRight: 6 }}>{q}</span>
                                    {epFiles.find(f => f.language === selLang && f.quality === q)?.fileSize
                                      ? formatBytes(epFiles.find(f => f.language === selLang && f.quality === q)!.fileSize)
                                      : ""}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {downloadFile && (
                            <a
                              href={downloadFile.downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-red"
                              style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "12px 24px", borderRadius: 10, fontSize: 14, textDecoration: "none" }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                              </svg>
                              Download {selQ} {selLang}
                              {downloadFile.fileSize ? ` · ${formatBytes(downloadFile.fileSize)}` : ""}
                            </a>
                          )}
                        </>
                      ) : (
                        <div style={{ color: "#444", fontSize: 13 }}>No files available for this episode yet.</div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ color: "#555", fontSize: 14 }}>No episodes in this season yet.</div>
              )}
            </>
          ) : (
            <div style={{ color: "#555", fontSize: 14 }}>No seasons available yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Sidebar ────────────────────────────────────────────────── */
function Sidebar({ open, onClose, onRequest }: { open: boolean; onClose: () => void; onRequest: () => void }) {
  if (!open) return null;
  const items = [
    { icon: "🎬", label: "Request Content", desc: "Request movies or series", action: onRequest },
    { icon: "🛟", label: "Support", desc: "Get help from our team", action: null },
  ];
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", zIndex: 300, animation: "overlayFade .25s ease" }} />
      <div style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 300, background: "#0d0d0d", zIndex: 301, animation: "sidebarSlide .3s ease", borderRight: "1px solid rgba(255,255,255,.06)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, letterSpacing: 2 }}>
            <span style={{ color: "#e50914" }}>CINE</span><span style={{ color: "#fff" }}>FLIX</span>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#aaa", width: 34, height: 34, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>✕</button>
        </div>
        <div style={{ padding: "16px 12px", flex: 1 }}>
          {items.map((m, i) => (
            <div key={i} className="sidebar-item" onClick={() => { if (m.action) { m.action(); onClose(); } }}>
              <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>{m.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: "#eee" }}>{m.label}</div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{m.desc}</div>
              </div>
              <svg style={{ marginLeft: "auto" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            </div>
          ))}
        </div>
        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,.06)", fontSize: 12, color: "#444" }}>
          © 2025 Cineflix · All rights reserved
        </div>
      </div>
    </>
  );
}

/* ─── Request Modal ──────────────────────────────────────────── */
function RequestModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ title: "", type: "movie", year: "", message: "", requestedBy: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [msg, setMsg] = useState("");

  const submit = async () => {
    if (!form.title.trim()) return setMsg("Title is required");
    setStatus("loading");
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setStatus("success");
      setMsg("Request submitted! We'll add it soon.");
    } catch (e: any) {
      setStatus("error");
      setMsg(e.message ?? "Something went wrong");
    }
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: 480 }}>
        <div style={{ padding: 32 }}>
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#aaa", width: 34, height: 34, borderRadius: "50%", cursor: "pointer", fontSize: 16 }}>✕</button>
          <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, letterSpacing: 2, marginBottom: 8 }}>REQUEST CONTENT</h2>
          <p style={{ color: "#666", fontSize: 14, marginBottom: 24 }}>Can't find what you're looking for? Let us know.</p>

          {status === "success" ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div style={{ color: "#4caf50", fontWeight: 600 }}>{msg}</div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Title *</label>
                <input
                  className="search-input"
                  placeholder="Movie or series title..."
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Type</label>
                  <select className="select-custom" style={{ width: "100%" }} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="movie">Movie</option>
                    <option value="series">Series</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Year</label>
                  <input className="search-input" placeholder="2024" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} style={{ padding: "8px 12px" }} />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Your Name (optional)</label>
                <input className="search-input" placeholder="Your name..." value={form.requestedBy} onChange={e => setForm(f => ({ ...f, requestedBy: e.target.value }))} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Message (optional)</label>
                <textarea
                  className="search-input"
                  placeholder="Any additional info..."
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  rows={3}
                  style={{ resize: "vertical", fontFamily: "inherit" }}
                />
              </div>
              {msg && status === "error" && <div style={{ color: "#e50914", fontSize: 13, marginBottom: 12 }}>{msg}</div>}
              <button
                className="btn-red"
                onClick={submit}
                disabled={status === "loading"}
                style={{ width: "100%", padding: "14px", borderRadius: 10, fontSize: 15 }}
              >
                {status === "loading" ? "Submitting..." : "Submit Request"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Navbar ─────────────────────────────────────────────────── */
function Navbar({
  activeTab, setActiveTab, searchQuery, setSearchQuery, onMenuOpen,
}: {
  activeTab: string; setActiveTab: (t: string) => void;
  searchQuery: string; setSearchQuery: (q: string) => void;
  onMenuOpen: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav className="glass" style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      padding: "0 clamp(16px,4vw,48px)", height: 64,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      borderBottom: scrolled ? "1px solid rgba(255,255,255,.06)" : "none",
      boxShadow: scrolled ? "0 4px 32px rgba(0,0,0,.6)" : "none",
      transition: "box-shadow .3s,border-color .3s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
        <button onClick={onMenuOpen} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, letterSpacing: 2, lineHeight: 1 }}>
          <span style={{ color: "#e50914" }}>CINE</span><span style={{ color: "#fff" }}>FLIX</span>
        </button>
        <div className="desktop-nav" style={{ display: "flex", gap: 28 }}>
          {[{ l: "Home", t: "home" }, { l: "Movies", t: "movies" }, { l: "TV Shows", t: "series" }, { l: "Request", t: "request" }].map(({ l, t }) => (
            <span key={t} onClick={() => setActiveTab(t)} className={`nav-link ${activeTab === t ? "active" : ""}`}>{l}</span>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div className="search-bar-desktop" style={{ position: "relative" }}>
          <input
            className="search-input"
            style={{ width: 220 }}
            placeholder="Search movies & series..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setActiveTab("search"); }}
          />
          <svg style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        </div>
        <button className="mobile-menu-btn" onClick={() => setSearchOpen(o => !o)} style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", padding: 4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        </button>
        <button className="mobile-menu-btn" onClick={onMenuOpen} style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", padding: 4 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
        </button>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#e50914,#7b2ff7)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>C</div>
      </div>

      {searchOpen && (
        <div style={{ position: "absolute", top: 64, left: 0, right: 0, padding: "12px 16px", background: "rgba(10,10,10,.97)", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
          <input
            className="search-input"
            placeholder="Search movies & series..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setActiveTab("search"); }}
            autoFocus
          />
        </div>
      )}
    </nav>
  );
}

/* ─── Search Page ────────────────────────────────────────────── */
function SearchPage({ query, onCardClick }: { query: string; onCardClick: (i: ContentItem) => void }) {
  const [results, setResults] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) return;
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then(r => r.json())
      .then(d => { setResults(d.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
    return () => controller.abort();
  }, [query]);

  return (
    <div style={{ padding: "100px 20px 48px", minHeight: "100vh" }}>
      <div style={{ marginBottom: 24, padding: "0 clamp(0px,2vw,28px)" }}>
        <h2 className="section-title">Search Results</h2>
        <p style={{ color: "#666", fontSize: 14, marginTop: 4 }}>{loading ? "Searching…" : `${results.length} result${results.length !== 1 ? "s" : ""} for "${query}"`}</p>
      </div>
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 20, padding: "0 clamp(0px,2vw,28px)" }}>
          {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : results.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "#555" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "#888" }}>No results found</div>
          <div style={{ fontSize: 14 }}>Try a different title or genre</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 20, padding: "0 clamp(0px,2vw,28px)" }}>
          {results.map(item => <MovieCard key={item._id} item={item} onClick={onCardClick} />)}
        </div>
      )}
    </div>
  );
}

/* ─── Grid Page ──────────────────────────────────────────────── */
function GridPage({
  title, items, onCardClick, loading, onLoadMore, hasMore,
}: {
  title: string; items: ContentItem[]; onCardClick: (i: ContentItem) => void;
  loading: boolean; onLoadMore: () => void; hasMore: boolean;
}) {
  return (
    <div style={{ padding: "100px clamp(16px,4vw,48px) 48px", minHeight: "100vh" }}>
      <h2 className="section-title" style={{ marginBottom: 24 }}>{title}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 20 }}>
        {items.map(item => <MovieCard key={item._id} item={item} onClick={onCardClick} />)}
        {loading && Array(4).fill(0).map((_, i) => <SkeletonCard key={`sk-${i}`} />)}
      </div>
      {!loading && items.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 0", color: "#555" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎬</div>
          <div style={{ fontSize: 18, color: "#888" }}>No content yet</div>
          <div style={{ fontSize: 14, marginTop: 8 }}>Upload files to BuzzHeavier and sync to populate.</div>
        </div>
      )}
      {hasMore && !loading && (
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <button className="btn-ghost" onClick={onLoadMore} style={{ padding: "12px 32px", borderRadius: 10 }}>Load More</button>
        </div>
      )}
    </div>
  );
}

/* ─── Request Page ───────────────────────────────────────────── */
function RequestPage() {
  const [form, setForm] = useState({ title: "", type: "movie", year: "", message: "", requestedBy: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [msg, setMsg] = useState("");

  const submit = async () => {
    if (!form.title.trim()) return setMsg("Title is required");
    setStatus("loading");
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setStatus("success");
    } catch (e: any) {
      setStatus("error");
      setMsg(e.message ?? "Something went wrong");
    }
  };

  return (
    <div style={{ padding: "100px clamp(16px,4vw,48px) 48px", minHeight: "100vh", display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 540, background: "#111", borderRadius: 20, padding: 40, border: "1px solid #222" }}>
        <h2 className="section-title" style={{ marginBottom: 8 }}>REQUEST CONTENT</h2>
        <p style={{ color: "#666", fontSize: 14, marginBottom: 32 }}>Can't find what you're looking for? Submit a request!</p>

        {status === "success" ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, letterSpacing: 2, color: "#fff", marginBottom: 8 }}>REQUEST SUBMITTED!</div>
            <p style={{ color: "#666", marginBottom: 24 }}>We'll review your request and add it soon.</p>
            <button className="btn-red" onClick={() => { setStatus("idle"); setForm({ title: "", type: "movie", year: "", message: "", requestedBy: "" }); }} style={{ padding: "12px 28px", borderRadius: 10 }}>Submit Another</button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Title *</label>
              <input className="search-input" placeholder="Movie or series title..." value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Type</label>
                <select className="select-custom" style={{ width: "100%" }} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="movie">Movie</option>
                  <option value="series">Series</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Year</label>
                <input className="search-input" placeholder="2024" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} style={{ padding: "8px 12px" }} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Your Name (optional)</label>
              <input className="search-input" placeholder="Your name..." value={form.requestedBy} onChange={e => setForm(f => ({ ...f, requestedBy: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Message (optional)</label>
              <textarea className="search-input" placeholder="Any additional details..." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={3} style={{ resize: "vertical", fontFamily: "inherit" }} />
            </div>
            {msg && status === "error" && <div style={{ color: "#e50914", fontSize: 13, marginBottom: 12 }}>{msg}</div>}
            <button className="btn-red" onClick={submit} disabled={status === "loading"} style={{ width: "100%", padding: "14px", borderRadius: 10, fontSize: 15 }}>
              {status === "loading" ? "Submitting…" : "Submit Request"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Hook: paginated fetch ──────────────────────────────────── */
function usePaginatedContent(endpoint: string, enabled: boolean) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    setLoading(true);
    fetch(`${endpoint}?page=${page}&limit=20`)
      .then(r => r.json())
      .then(d => {
        const newItems = d.data ?? [];
        setItems(prev => page === 1 ? newItems : [...prev, ...newItems]);
        setHasMore(page < (d.totalPages ?? 1));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [endpoint, page, enabled]);

  const loadMore = useCallback(() => setPage(p => p + 1), []);

  return { items, loading, hasMore, loadMore };
}

/* ─── Main App ───────────────────────────────────────────────── */
export default function CineflixClient({
  featured, movies: initialMovies, series: initialSeries,
}: {
  featured: ContentItem[]; movies: ContentItem[]; series: ContentItem[];
}) {
  const [activeTab, setActiveTab] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showRequestModal, setShowRequestModal] = useState(false);

  const moviesData = usePaginatedContent("/api/movies", activeTab === "movies");
  const seriesData = usePaginatedContent("/api/series", activeTab === "series");

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab !== "search") setSearchQuery("");
  };

  const handleCardClick = (item: ContentItem) => setSelectedItem(item);

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh" }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onMenuOpen={() => setSidebarOpen(true)}
      />

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onRequest={() => setShowRequestModal(true)} />

      {/* Pages */}
      {activeTab === "home" && (
        <div>
          <HeroBanner items={featured} onItemClick={handleCardClick} />
          <div style={{ padding: "40px 0 48px", marginTop: -2 }}>
            <ContentRow title="LATEST MOVIES" items={initialMovies} onCardClick={handleCardClick} />
            <ContentRow title="LATEST SERIES" items={initialSeries} onCardClick={handleCardClick} />
            <ContentRow
              title="TOP RATED"
              items={[...initialMovies, ...initialSeries].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 10)}
              onCardClick={handleCardClick}
            />
          </div>
        </div>
      )}

      {activeTab === "movies" && (
        <GridPage
          title="ALL MOVIES"
          items={moviesData.items}
          onCardClick={handleCardClick}
          loading={moviesData.loading}
          onLoadMore={moviesData.loadMore}
          hasMore={moviesData.hasMore}
        />
      )}

      {activeTab === "series" && (
        <GridPage
          title="ALL TV SHOWS"
          items={seriesData.items}
          onCardClick={handleCardClick}
          loading={seriesData.loading}
          onLoadMore={seriesData.loadMore}
          hasMore={seriesData.hasMore}
        />
      )}

      {activeTab === "search" && searchQuery.trim() && (
        <SearchPage query={searchQuery} onCardClick={handleCardClick} />
      )}

      {activeTab === "search" && !searchQuery.trim() && (
        <div>
          <HeroBanner items={featured} onItemClick={handleCardClick} />
          <div style={{ padding: "40px 0 48px" }}>
            <ContentRow title="LATEST MOVIES" items={initialMovies} onCardClick={handleCardClick} />
            <ContentRow title="LATEST SERIES" items={initialSeries} onCardClick={handleCardClick} />
          </div>
        </div>
      )}

      {activeTab === "request" && <RequestPage />}

      {/* Modals */}
      {selectedItem && selectedItem.contentType === "movie" && (
        <MovieModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
      {selectedItem && selectedItem.contentType === "series" && (
        <SeriesModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
      {showRequestModal && <RequestModal onClose={() => setShowRequestModal(false)} />}
    </div>
  );
}
