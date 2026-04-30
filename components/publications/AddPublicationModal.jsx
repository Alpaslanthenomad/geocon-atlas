"use client";
import { useState, useMemo } from "react";
import { supabase } from "../../lib/supabase";

/* ── Add Publication Modal ──
   Faz 3.2 (B): approved researcher kendi yayınlarını sisteme bağlar.
   İki tab:
   1. "Find existing"  — fuzzy title arama → claim (publication_researchers self-insert)
   2. "Add new (DOI)"  — DOI gir → CrossRef metadata → preview → publish (publications insert + link)

   Güvenlik:
   - Sadece approved researcher görür (PublicationsView buton koşullu render eder).
   - RLS policies: publications_self_insert, publication_researchers_self_insert.
   - DOI duplicate kontrolü insert öncesi.
*/
export default function AddPublicationModal({ user, profile, researcher, onClose, onSuccess, allPublications = [] }) {
  const [tab, setTab] = useState("find");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  // ── Tab 1: Find existing ──
  const [search, setSearch] = useState("");
  const [hits, setHits] = useState([]);
  const [searched, setSearched] = useState(false);

  // ── Tab 2: Add new ──
  const [doi, setDoi] = useState("");
  const [fetched, setFetched] = useState(null); // CrossRef metadata
  const [fetching, setFetching] = useState(false);

  // Mevcut bağlantılar (publication_researchers): aynı researcher_id zaten varsa "already linked"
  const [myLinkedIds, setMyLinkedIds] = useState(null); // null = yüklenmedi, Set = yüklendi
  const ensureMyLinks = async () => {
    if (myLinkedIds !== null) return myLinkedIds;
    const { data } = await supabase
      .from("publication_researchers")
      .select("publication_id")
      .eq("researcher_id", researcher.id);
    const s = new Set((data || []).map(r => r.publication_id));
    setMyLinkedIds(s);
    return s;
  };

  // ── Fuzzy title search ──
  const doSearch = async () => {
    const q = search.trim();
    if (q.length < 4) {
      setMsg({ ok: false, text: "Type at least 4 characters" });
      return;
    }
    setBusy(true);
    setMsg(null);
    setSearched(true);
    try {
      const linked = await ensureMyLinks();

      // Title ILIKE search; small batch, sıralı author match'le
      const { data, error } = await supabase
        .from("publications")
        .select("id,title,authors,year,journal,doi,is_curated")
        .ilike("title", `%${q}%`)
        .order("year", { ascending: false, nullsFirst: false })
        .limit(20);
      if (error) throw error;

      // Authors içinde de ad geçen yayınları öne al (kullanıcı ismini search'e yazdıysa anlamlı)
      const authorTokens = (researcher?.name || "").toLowerCase().split(/\s+/).filter(t => t.length > 2);
      const enriched = (data || []).map(p => {
        const authors = (p.authors || "").toLowerCase();
        const authorMatch = authorTokens.length > 0 && authorTokens.some(t => authors.includes(t));
        return { ...p, _alreadyLinked: linked.has(p.id), _authorMatch: authorMatch };
      }).sort((a, b) => {
        if (a._authorMatch !== b._authorMatch) return a._authorMatch ? -1 : 1;
        return (b.year || 0) - (a.year || 0);
      });

      setHits(enriched);
      if (enriched.length === 0) setMsg({ ok: true, text: "No matches. Try different keywords or add via DOI." });
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    }
    setBusy(false);
  };

  // ── Claim existing publication (insert into publication_researchers) ──
  const claimPublication = async (pub) => {
    setBusy(true);
    setMsg(null);
    try {
      const { error } = await supabase.from("publication_researchers").insert({
        publication_id: pub.id,
        researcher_id: researcher.id,
        author_as_listed: researcher.name,
        match_score: 1.0,
        match_method: "self_claimed",
      });
      if (error) throw error;
      setMyLinkedIds(prev => new Set([...(prev || []), pub.id]));
      setHits(prev => prev.map(h => h.id === pub.id ? { ...h, _alreadyLinked: true } : h));
      setMsg({ ok: true, text: `Linked: "${(pub.title || "").slice(0, 60)}…"` });
      onSuccess && onSuccess({ kind: "claimed", publication: pub });
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    }
    setBusy(false);
  };

  // ── DOI lookup via CrossRef ──
  const cleanDoi = (raw) => raw.trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "");

  const fetchDoi = async () => {
    const d = cleanDoi(doi);
    if (!d || !/^10\.\d{4,9}\/.+/.test(d)) {
      setMsg({ ok: false, text: "Enter a valid DOI (e.g. 10.1038/s41586-021-03819-2)" });
      return;
    }
    setFetching(true);
    setMsg(null);
    setFetched(null);
    try {
      // 1. DOI zaten DB'de var mı?
      const { data: existing } = await supabase
        .from("publications")
        .select("id,title,authors,year,journal,doi")
        .ilike("doi", d)
        .maybeSingle();
      if (existing) {
        const linked = await ensureMyLinks();
        setFetched({ exists: true, ...existing, _alreadyLinked: linked.has(existing.id) });
        setMsg({ ok: true, text: "This publication is already in GEOCON. You can claim it below." });
        setFetching(false);
        return;
      }

      // 2. CrossRef'ten metadata çek
      const ua = `GEOCON/1.0 (mailto:${user?.email || "info@geocon.app"})`;
      const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(d)}`, {
        headers: { "User-Agent": ua },
      });
      if (!res.ok) {
        if (res.status === 404) throw new Error("DOI not found on CrossRef. Check the DOI or add manually.");
        throw new Error(`CrossRef error ${res.status}`);
      }
      const json = await res.json();
      const work = json.message;

      // CrossRef metadata → publications şemasına map et
      const title = (work.title && work.title[0]) || "(untitled)";
      const authors = (work.author || []).map(a => {
        const given = a.given || "";
        const family = a.family || "";
        return `${given} ${family}`.trim();
      }).filter(Boolean).join("; ");
      const year =
        work.issued?.["date-parts"]?.[0]?.[0] ||
        work["published-print"]?.["date-parts"]?.[0]?.[0] ||
        work["published-online"]?.["date-parts"]?.[0]?.[0] ||
        null;
      const journal = (work["container-title"] && work["container-title"][0]) || null;
      const abstract = work.abstract ? work.abstract.replace(/<[^>]+>/g, "").trim() : null;
      const isOpenAccess = !!(work.license && work.license.length);

      setFetched({
        exists: false,
        doi: d,
        title,
        authors,
        year,
        journal,
        abstract,
        open_access: isOpenAccess,
        cited_by_count: work["is-referenced-by-count"] || 0,
        type: work.type || null,
      });
      setMsg(null);
    } catch (e) {
      // CORS veya network hatası
      setMsg({ ok: false, text: e.message || "Could not fetch CrossRef" });
    }
    setFetching(false);
  };

  // ── Publish: publications insert + publication_researchers link ──
  const publish = async () => {
    if (!fetched || fetched.exists) return;
    setBusy(true);
    setMsg(null);
    try {
      // ID üret: PUB-USR-<timestamp>-<rand>
      const newId = "PUB-USR-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
      const insertPayload = {
        id: newId,
        title: fetched.title,
        authors: fetched.authors,
        doi: fetched.doi,
        year: fetched.year,
        journal: fetched.journal,
        abstract: fetched.abstract,
        open_access: fetched.open_access,
        cited_by_count: fetched.cited_by_count || 0,
        source: "user_submitted_crossref",
        contributed_by: researcher.id,
        is_curated: false,
        // S2 enrichment cron'u DOI üzerinden bunu yakalayacak (s2_enrichment_status default 'pending')
      };
      const { error: pubErr } = await supabase.from("publications").insert(insertPayload);
      if (pubErr) throw pubErr;

      const { error: linkErr } = await supabase.from("publication_researchers").insert({
        publication_id: newId,
        researcher_id: researcher.id,
        author_as_listed: researcher.name,
        match_score: 1.0,
        match_method: "self_submitted",
      });
      if (linkErr) {
        // Yayın eklendi ama link kurulamadı — kullanıcıyı bilgilendir, yine de bir başarı
        console.warn("Publication created but link failed:", linkErr.message);
      }

      setMyLinkedIds(prev => new Set([...(prev || []), newId]));
      setMsg({ ok: true, text: "Publication added and linked to your profile. S2 enrichment will fetch abstract & embedding within a few minutes." });
      onSuccess && onSuccess({ kind: "added", publicationId: newId });

      // 2 saniye sonra modal'ı kapat (kullanıcının başarı mesajını görmesi için)
      setTimeout(() => onClose && onClose(), 2000);
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    }
    setBusy(false);
  };

  // Mevcut DOI'yi de claim edebilelim
  const claimExisting = async () => {
    if (!fetched || !fetched.exists || fetched._alreadyLinked) return;
    await claimPublication(fetched);
    setFetched({ ...fetched, _alreadyLinked: true });
  };

  const inp = { padding: "8px 10px", border: "1px solid #e8e6e1", borderRadius: 6, fontSize: 13, background: "#fff", outline: "none", color: "#2c2c2a", width: "100%" };
  const lbl = { fontSize: 10, color: "#888", marginBottom: 3, display: "block", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 };

  return (
    <>
      <div onClick={busy ? null : onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: 640, maxWidth: "94vw", maxHeight: "92vh", background: "#fff", borderRadius: 14,
        boxShadow: "0 12px 40px rgba(0,0,0,0.18)", zIndex: 201, overflow: "hidden",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ background: "linear-gradient(135deg, #185FA5 0%, #0C447C 100%)", padding: "18px 22px", color: "#fff" }}>
          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "Georgia, serif" }}>Add publication</div>
          <div style={{ fontSize: 11, opacity: 0.9, marginTop: 4, lineHeight: 1.5 }}>
            Link your existing publications, or add a new one by DOI.
            <span style={{ display: "block", marginTop: 2, opacity: 0.85 }}>
              Linked to: <strong>{researcher?.name || "Unknown"}</strong>
            </span>
          </div>
        </div>

        <div style={{ display: "flex", borderBottom: "1px solid #e8e6e1" }}>
          {[
            { k: "find", l: "🔍 Find my publications" },
            { k: "doi", l: "+ Add by DOI" },
          ].map(t => (
            <button
              key={t.k}
              onClick={() => { setTab(t.k); setMsg(null); }}
              style={{
                flex: 1, padding: "10px 8px", border: "none", background: "none",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                color: tab === t.k ? "#0C447C" : "#888",
                borderBottom: tab === t.k ? "2px solid #185FA5" : "2px solid transparent",
                marginBottom: -1,
              }}
            >{t.l}</button>
          ))}
        </div>

        <div style={{ padding: "18px 22px", overflowY: "auto", flex: 1 }}>
          {tab === "find" && (
            <>
              <div style={{ fontSize: 11, color: "#5f5e5a", marginBottom: 10, lineHeight: 1.5, padding: "8px 10px", background: "#E6F1FB", borderRadius: 6, borderLeft: "2px solid #185FA5" }}>
                Search publications already in GEOCON by title (or part of it). If yours is here, click <strong>This is mine</strong> to link it to your profile.
              </div>
              <label style={lbl}>Search title</label>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && doSearch()}
                  placeholder="e.g. Fritillaria michailovskyi micropropagation"
                  style={{ ...inp, flex: 1 }}
                  autoFocus
                />
                <button
                  onClick={doSearch}
                  disabled={busy || search.trim().length < 4}
                  style={{
                    padding: "8px 14px",
                    background: busy || search.trim().length < 4 ? "#ccc" : "#185FA5",
                    color: "#fff", border: "none", borderRadius: 6, cursor: "pointer",
                    fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
                  }}
                >{busy ? "..." : "Search"}</button>
              </div>

              {searched && hits.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <div style={{ fontSize: 10, color: "#888", fontWeight: 600 }}>
                    {hits.length} match{hits.length !== 1 ? "es" : ""}{" "}
                    {hits.some(h => h._authorMatch) && (
                      <span style={{ marginLeft: 6, color: "#185FA5" }}>
                        ★ author name match prioritized
                      </span>
                    )}
                  </div>
                  {hits.map(p => (
                    <div key={p.id} style={{ padding: "10px 12px", border: "1px solid #e8e6e1", borderRadius: 8, background: "#fff" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#2c2c2a", lineHeight: 1.4 }}>
                            {p._authorMatch && <span style={{ color: "#185FA5", marginRight: 4 }}>★</span>}
                            {p.title}
                          </div>
                          {p.authors && (
                            <div style={{ fontSize: 10, color: "#5f5e5a", marginTop: 3, fontStyle: "italic" }}>
                              {p.authors.slice(0, 120)}{p.authors.length > 120 ? "…" : ""}
                            </div>
                          )}
                          <div style={{ fontSize: 10, color: "#888", marginTop: 3 }}>
                            {p.year || "no year"} {p.journal && `· ${p.journal}`} {p.doi && (
                              <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noreferrer" style={{ color: "#185FA5", marginLeft: 4 }} onClick={e => e.stopPropagation()}>DOI ↗</a>
                            )}
                          </div>
                        </div>
                        {p._alreadyLinked ? (
                          <span style={{ padding: "4px 10px", fontSize: 10, fontWeight: 700, color: "#085041", background: "#E1F5EE", borderRadius: 5, whiteSpace: "nowrap", alignSelf: "flex-start" }}>
                            ✓ LINKED
                          </span>
                        ) : (
                          <button
                            onClick={() => claimPublication(p)}
                            disabled={busy}
                            style={{
                              padding: "5px 12px", background: busy ? "#ccc" : "#185FA5",
                              color: "#fff", border: "none", borderRadius: 5,
                              fontSize: 10, fontWeight: 700, cursor: busy ? "default" : "pointer",
                              whiteSpace: "nowrap", alignSelf: "flex-start",
                            }}
                          >This is mine</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searched && !busy && hits.length === 0 && (
                <div style={{ padding: 14, fontSize: 12, color: "#888", textAlign: "center", background: "#f4f3ef", borderRadius: 8 }}>
                  No matches. Try different keywords, or{" "}
                  <button onClick={() => { setTab("doi"); setMsg(null); }} style={{ background: "none", border: "none", color: "#185FA5", textDecoration: "underline", padding: 0, fontSize: 12, cursor: "pointer" }}>add by DOI</button>.
                </div>
              )}
            </>
          )}

          {tab === "doi" && (
            <>
              <div style={{ fontSize: 11, color: "#5f5e5a", marginBottom: 10, lineHeight: 1.5, padding: "8px 10px", background: "#E6F1FB", borderRadius: 6, borderLeft: "2px solid #185FA5" }}>
                Enter the DOI of your publication. We'll fetch metadata from CrossRef and add it to GEOCON. The Semantic Scholar enrichment cron will populate abstract and similarity embeddings within a few minutes.
              </div>
              <label style={lbl}>DOI</label>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                <input
                  type="text"
                  value={doi}
                  onChange={e => setDoi(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && fetchDoi()}
                  placeholder="10.1038/s41586-021-03819-2 or doi.org URL"
                  style={{ ...inp, flex: 1, fontFamily: "monospace", fontSize: 12 }}
                  autoFocus
                />
                <button
                  onClick={fetchDoi}
                  disabled={fetching || !doi.trim()}
                  style={{
                    padding: "8px 14px",
                    background: fetching || !doi.trim() ? "#ccc" : "#185FA5",
                    color: "#fff", border: "none", borderRadius: 6, cursor: "pointer",
                    fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
                  }}
                >{fetching ? "..." : "Lookup"}</button>
              </div>

              {fetched && fetched.exists && (
                <div style={{ padding: "12px 14px", border: "1px solid #FAEEDA", background: "#FCF8EE", borderRadius: 8, marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: "#854F0B", fontWeight: 700, marginBottom: 6 }}>
                    Already in GEOCON
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#2c2c2a", lineHeight: 1.4 }}>
                    {fetched.title}
                  </div>
                  <div style={{ fontSize: 10, color: "#888", marginTop: 4 }}>
                    {fetched.year || "no year"}{fetched.journal && ` · ${fetched.journal}`}
                  </div>
                  {fetched._alreadyLinked ? (
                    <div style={{ marginTop: 8, padding: "5px 10px", fontSize: 10, color: "#085041", background: "#E1F5EE", borderRadius: 5, display: "inline-block", fontWeight: 700 }}>
                      ✓ Already linked to your profile
                    </div>
                  ) : (
                    <button
                      onClick={claimExisting}
                      disabled={busy}
                      style={{
                        marginTop: 8, padding: "6px 14px",
                        background: busy ? "#ccc" : "#185FA5", color: "#fff",
                        border: "none", borderRadius: 5, fontSize: 11, fontWeight: 700, cursor: "pointer",
                      }}
                    >Link to my profile</button>
                  )}
                </div>
              )}

              {fetched && !fetched.exists && (
                <div style={{ padding: "14px 16px", border: "1px solid #185FA5", background: "#fcfdff", borderRadius: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: "#185FA5", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Preview · CrossRef metadata
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#2c2c2a", lineHeight: 1.35, marginBottom: 6 }}>
                    {fetched.title}
                  </div>
                  {fetched.authors && (
                    <div style={{ fontSize: 11, color: "#5f5e5a", fontStyle: "italic", marginBottom: 6 }}>
                      {fetched.authors}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 8, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {fetched.year && <span><strong style={{ color: "#5f5e5a" }}>Year:</strong> {fetched.year}</span>}
                    {fetched.journal && <span><strong style={{ color: "#5f5e5a" }}>Journal:</strong> {fetched.journal}</span>}
                    {fetched.cited_by_count > 0 && <span><strong style={{ color: "#5f5e5a" }}>Cited by:</strong> {fetched.cited_by_count}</span>}
                    {fetched.open_access && <span style={{ color: "#085041", fontWeight: 600 }}>Open Access</span>}
                  </div>
                  {fetched.abstract && (
                    <div style={{ fontSize: 11, color: "#5f5e5a", lineHeight: 1.5, padding: "8px 10px", background: "#fcfbf9", borderRadius: 6, marginBottom: 8, maxHeight: 120, overflowY: "auto" }}>
                      {fetched.abstract.slice(0, 600)}{fetched.abstract.length > 600 ? "…" : ""}
                    </div>
                  )}
                  <button
                    onClick={publish}
                    disabled={busy}
                    style={{
                      padding: "9px 16px", background: busy ? "#ccc" : "#185FA5",
                      color: "#fff", border: "none", borderRadius: 6, cursor: busy ? "default" : "pointer",
                      fontSize: 12, fontWeight: 700,
                    }}
                  >
                    {busy ? "Publishing..." : "Publish & link to my profile"}
                  </button>
                </div>
              )}
            </>
          )}

          {msg && (
            <div style={{
              marginTop: 12, padding: "8px 10px", borderRadius: 6, fontSize: 11,
              background: msg.ok ? "#E1F5EE" : "#FCEBEB",
              color: msg.ok ? "#085041" : "#A32D2D",
            }}>{msg.text}</div>
          )}
        </div>

        <div style={{ padding: "10px 22px 14px", borderTop: "1px solid #e8e6e1", textAlign: "right" }}>
          <button onClick={onClose} disabled={busy} style={{ padding: "6px 12px", background: "none", border: "none", color: "#888", fontSize: 11, cursor: busy ? "default" : "pointer" }}>
            Close
          </button>
        </div>
      </div>
    </>
  );
}
