"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { ROLES } from "../lib/constants";
import { useAuth } from "../lib/auth";
import { fetchAllPublications, fetchAllMetabolites, fetchAllMetabolitePublications, fetchAllResearchers } from "../lib/fetchHelpers";

// Shared
import { Dot, Loading, SecondaryLoading } from "../components/shared";

// Auth
import AuthBar from "../components/auth/AuthBar";
import AuthModal from "../components/auth/AuthModal";
import ClaimResearcherModal from "../components/auth/ClaimResearcherModal";
import MyProfilePanel from "../components/auth/MyProfilePanel";
import AdminApprovalPanel from "../components/auth/AdminApprovalPanel";

// Home
import GEOCONHome from "../components/home/GEOCONHome";

// Programs
import StartProgramModal from "../components/programs/StartProgramModal";
import ProgramsView from "../components/programs/ProgramsView";

// Metabolites
import MetaboliteExplorer from "../components/metabolites/MetaboliteExplorer";

// Publications
import PublicationsView from "../components/publications/PublicationsView";

// Researchers
import ResearchersView from "../components/researchers/ResearchersView";
import ResearcherDetailPanel from "../components/researchers/ResearcherDetailPanel";

// Species
import SpeciesDetailPanel from "../components/species/SpeciesDetailPanel";
import SpeciesModule from "../components/species/SpeciesModule";

// Other views
import MarketView from "../components/market/MarketView";
import PartnerView from "../components/partners/PartnerView";
import SourcesPanel from "../components/sources/SourcesPanel";
import PortfolioView from "../components/portfolio/PortfolioView";
import CommunitiesView from "../components/communities/CommunitiesView";

// Admin
import AdminPanel from "../components/admin/AdminPanel";

/* ════════════════════════════════════════════════════════
   MAIN APP — ORCHESTRATION ONLY
════════════════════════════════════════════════════════ */
export default function Home() {
  const auth = useAuth();
  const { user, profile, researcher: authResearcher, refreshProfile } = auth;

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [myProfileOpen, setMyProfileOpen] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [claimPrompted, setClaimPrompted] = useState(false);

  useEffect(() => {
    if (!claimPrompted && user && profile && !profile.researcher_id && !profile.signup_intent && !profile.claim_request_for_researcher_id) {
      setClaimModalOpen(true);
      setClaimPrompted(true);
    }
  }, [user, profile, claimPrompted]);

  const [view, setView] = useState("home");
  const [exp, setExp] = useState(null);
  const [side, setSide] = useState(true);
  const [loading, setLoading] = useState(true);
  const [secondaryLoading, setSecondaryLoading] = useState(true);
  const [dbOk, setDbOk] = useState(false);
  const [species, setSpecies] = useState([]);
  const [metabolites, setMetabolites] = useState([]);
  const [metabolitePublications, setMetabolitePublications] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [sources, setSources] = useState([]);
  const [publications, setPublications] = useState([]);
  const [researchers, setResearchers] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [programSpecies, setProgramSpecies] = useState([]);
  const [detailSpecies, setDetailSpecies] = useState(null);
  const [detailResearcherId, setDetailResearcherId] = useState(null);
  const [startProgramSp, setStartProgramSp] = useState(null);
  const [preselectProgramId, setPreselectProgramId] = useState(null);
  const [navStack, setNavStack] = useState([]);

  function pushAndOpen(target) {
    if (target.type === "researcher") setDetailResearcherId(target.id);
    else if (target.type === "species") {
      const spObj = species.find(s => s.id === target.id) || target.species || target;
      setDetailSpecies(spObj);
    } else if (target.type === "program") {
      setPreselectProgramId(target.id);
      setView("programs");
    }
  }

  function openResearcher(researcherId, fromContext) {
    if (!researcherId) return;
    if (fromContext) setNavStack(prev => [...prev, fromContext]);
    if (fromContext?.type === "species") setDetailSpecies(null);
    setDetailResearcherId(researcherId);
  }

  function openSpeciesFromPanel(sp, fromContext) {
    if (!sp?.id) return;
    if (fromContext) setNavStack(prev => [...prev, fromContext]);
    const fullSp = species.find(s => s.id === sp.id) || sp;
    if (fromContext?.type === "researcher") setDetailResearcherId(null);
    setDetailSpecies(fullSp);
  }

  function openProgramFromPanel(prog, fromContext) {
    if (!prog?.id) return;
    if (fromContext) setNavStack(prev => [...prev, fromContext]);
    setDetailResearcherId(null);
    setDetailSpecies(null);
    setPreselectProgramId(prog.id);
    setView("programs");
  }

  function closePanelWithBack(currentType) {
    const back = navStack[navStack.length - 1];
    if (back) {
      setNavStack(prev => prev.slice(0, -1));
      if (currentType === "researcher") setDetailResearcherId(null);
      if (currentType === "species") setDetailSpecies(null);
      setTimeout(() => pushAndOpen(back), 0);
    } else {
      if (currentType === "researcher") setDetailResearcherId(null);
      if (currentType === "species") setDetailSpecies(null);
    }
  }

  const breadcrumbBack = navStack.length > 0 ? `Back to ${navStack[navStack.length - 1].label}` : null;

  useEffect(() => {
    let cancelled = false;

    async function loadCritical() {
      try {
        const [sp, mk, inst, src, prog, pmem, ppub, psp] = await Promise.all([
          supabase.from("species").select("*").order("composite_score", { ascending: false }),
          supabase.from("market_intelligence").select("*, species(accepted_name)"),
          supabase.from("institutions").select("*").order("priority"),
          supabase.from("data_sources").select("*").order("freshness_score", { ascending: false }),
          supabase.from("programs").select("*, species(accepted_name,iucn_status,thumbnail_url), created_by_researcher:researchers!created_by(id,name,institution)").order("priority_score", { ascending: false }),
          supabase.from("program_members").select("researcher_id,program_id,role"),
          supabase.from("program_publications").select("publication_id,program_id"),
          supabase.from("program_species").select("program_id,species_id,role"),
        ]);

        if (cancelled) return;

        if (sp.data) setSpecies(sp.data);
        if (mk.data) setMarkets(mk.data);
        if (inst.data) setInstitutions(inst.data);
        if (src.data) setSources(src.data);
        if (prog.data) setPrograms(prog.data);
        if (psp.data) setProgramSpecies(psp.data);

        setDbOk(true);
        setLoading(false);

        return {
          activeResearcherIds: new Set((pmem.data || []).map(m => m.researcher_id)),
          curatedPubIds: new Set((ppub.data || []).map(pp => pp.publication_id)),
        };
      } catch (e) {
        if (!cancelled) {
          setDbOk(false);
          setLoading(false);
        }
        return null;
      }
    }

    async function loadSecondary(idSets) {
      try {
        const [pub, allResearchers, allMetabolites, allMetabPubs] = await Promise.all([
          fetchAllPublications(),
          fetchAllResearchers(),
          fetchAllMetabolites(),
          fetchAllMetabolitePublications(),
        ]);

        if (cancelled) return;

        const activeIds = idSets?.activeResearcherIds || new Set();
        const curatedIds = idSets?.curatedPubIds || new Set();

        const researchersAnnotated = allResearchers.map(r => ({ ...r, is_geocon_active: activeIds.has(r.id) }));
        researchersAnnotated.sort((a, b) => {
          if (a.is_geocon_active !== b.is_geocon_active) return a.is_geocon_active ? -1 : 1;
          return (b.h_index || 0) - (a.h_index || 0);
        });

        const publicationsAnnotated = pub.map(p => ({ ...p, is_geocon_curated: curatedIds.has(p.id) }));

        setMetabolites(allMetabolites);
        setMetabolitePublications(allMetabPubs);
        setResearchers(researchersAnnotated);
        setPublications(publicationsAnnotated);
      } catch (e) {
        // sessizce geç
      } finally {
        if (!cancelled) setSecondaryLoading(false);
      }
    }

    (async () => {
      const idSets = await loadCritical();
      loadSecondary(idSets);
    })();

    return () => { cancelled = true; };
  }, []);

  if (loading) return <Loading />;

  const userRole = profile?.role || "observer";
  const role = ROLES[userRole] || { label: "Observer", color: "#888780", ic: "O", accent: "#f4f3ef" };
  const isAdminUser = userRole === "admin";

  const navItems = [
    { key: "home", label: "Home", icon: "🏠" },
    { key: "programs", label: "Programs", icon: "📋" },
    { key: "species", label: "ATLAS", icon: "🌿" },
    { key: "metabolites", label: "Metabolites", icon: "🧪" },
    { key: "market", label: "Market", icon: "💰" },
    { key: "publications", label: "Publications", icon: "📚" },
    { key: "researchers", label: "Researchers", icon: "👨‍🔬" },
    { key: "communities", label: "Communities", icon: "🤝" },
    { key: "partners", label: "Institutions", icon: "🏛" },
    { key: "portfolio", label: "Portfolio", icon: "📊" },
    { key: "sources", label: "Sources", icon: "🔗" },
    ...(isAdminUser ? [{ key: "admin", label: "Admin", icon: "⚙️" }] : []),
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8f7f4" }}>

      <div style={{ width: side ? 220 : 0, flexShrink: 0, overflow: "hidden", background: "#fff", borderRight: "1px solid #e8e6e1", transition: "width 0.25s ease", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "18px 14px 14px", flex: 1, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(145deg,#085041,#1D9E75)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "Georgia,serif" }}>A</span>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: -0.5, color: "#2c2c2a", fontFamily: "Georgia,serif" }}>ATLAS</div>
              <div style={{ fontSize: 7, color: "#b4b2a9", letterSpacing: 1.5, textTransform: "uppercase" }}>GEOCON v3.0</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {navItems.map(n => (
              <button key={n.key} onClick={() => { setView(n.key); setExp(null); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", border: "none", borderRadius: 7, cursor: "pointer", fontSize: 11, background: view === n.key ? "#f4f3ef" : "transparent", color: view === n.key ? "#2c2c2a" : "#888", fontWeight: view === n.key ? 600 : 400, transition: "all 0.15s" }}>
                <span style={{ fontSize: 13 }}>{n.icon}</span>{n.label}
                {n.key === "programs" && programs.filter(p => p.status === "Active").length > 0 && (
                  <span style={{ marginLeft: "auto", fontSize: 9, padding: "1px 5px", borderRadius: 99, background: "#E1F5EE", color: "#085041", fontWeight: 700 }}>
                    {programs.filter(p => p.status === "Active").length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: 10, background: "#f4f3ef", borderRadius: 8, fontSize: 9, color: "#888", lineHeight: 1.8 }}>
            <div><Dot color={dbOk ? "#0F6E56" : "#A32D2D"} size={6} /><span style={{ marginLeft: 4 }}>{dbOk ? "Supabase connected" : "Offline"}</span></div>
            <div><strong style={{ color: "#2c2c2a" }}>{species.length}</strong> species · <strong style={{ color: "#2c2c2a" }}>{programs.length}</strong> programs</div>
            <div>
              <strong style={{ color: "#2c2c2a" }}>{secondaryLoading && publications.length === 0 ? "…" : publications.length}</strong> pubs ·{" "}
              <strong style={{ color: "#2c2c2a" }}>{secondaryLoading && metabolites.length === 0 ? "…" : metabolites.length}</strong> cpds
              {secondaryLoading && (
                <span style={{ marginLeft: 6, fontSize: 8, color: "#b08518", fontWeight: 600 }}>loading…</span>
              )}
            </div>
          </div>
        </div>
        <div style={{ padding: 14, borderTop: "1px solid #e8e6e1" }}>
          {user ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: 6, background: role.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#fff", fontSize: 10, fontWeight: 600 }}>{role.ic}</span>
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#2c2c2a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {authResearcher?.name || profile?.full_name || user.email.split("@")[0]}
                  </div>
                  <div style={{ fontSize: 8, color: "#b4b2a9" }}>
                    {role.label}{profile?.approval_status === "pending" && " · pending"}
                  </div>
                </div>
              </div>
              {isAdminUser && (
                <a href="/upload-admin" style={{ display: "block", textAlign: "center", padding: "6px 0", fontSize: 9, color: "#1D9E75", textDecoration: "none", border: "1px solid #1D9E75", borderRadius: 6, marginBottom: 6, fontWeight: 600 }}>📊 Excel Upload</a>
              )}
              <button onClick={() => setMyProfileOpen(true)} style={{ width: "100%", padding: "5px 0", fontSize: 9, color: "#888", background: "none", border: "1px solid #e8e6e1", borderRadius: 6, cursor: "pointer", marginBottom: 4 }}>My profile</button>
              <button onClick={async () => { const { signOut } = await import("../lib/auth"); await signOut(); }} style={{ width: "100%", padding: "5px 0", fontSize: 9, color: "#A32D2D", background: "none", border: "1px solid #FCEBEB", borderRadius: 6, cursor: "pointer" }}>Sign out</button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 10, color: "#888", marginBottom: 8, textAlign: "center", lineHeight: 1.5 }}>
                Browsing as <strong>observer</strong>
              </div>
              <button onClick={() => setAuthModalOpen(true)} style={{ width: "100%", padding: "8px 0", fontSize: 11, color: "#fff", background: "#0a4a3e", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>Sign in / Sign up</button>
            </>
          )}
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, padding: "16px 20px 28px", overflow: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <button onClick={() => setSide(!side)} style={{ fontSize: 16, background: "none", border: "none", cursor: "pointer", color: "#888", padding: 0 }}>
            {side ? "◀" : "▶"}
          </button>
          <AuthBar
            user={user}
            profile={profile}
            researcher={authResearcher}
            onLoginClick={() => setAuthModalOpen(true)}
            onClaimClick={() => setClaimModalOpen(true)}
            onProfileClick={() => setMyProfileOpen(true)}
            onAdminClick={() => setAdminPanelOpen(true)}
          />
        </div>

        {view === "home" && <GEOCONHome species={species} publications={publications} metabolites={metabolites} researchers={researchers} programs={programs} user={user || { role: userRole, name: profile?.full_name || authResearcher?.name || "Observer" }} setView={setView} onSpeciesClick={setDetailSpecies} onStartProgram={sp => { setStartProgramSp(sp); }} />}
        {view === "programs" && <ProgramsView preselectProgramId={preselectProgramId} onPreselectConsumed={() => setPreselectProgramId(null)} onStartProgram={() => { }} onOpenResearcher={researcherId => openResearcher(researcherId)} onOpenSpecies={sp => openSpeciesFromPanel(sp)} />}
        {view === "species" && <SpeciesModule species={species} programs={programs} programSpecies={programSpecies} exp={exp} setExp={setExp} onSpeciesClick={setDetailSpecies} onStartProgram={sp => { setStartProgramSp(sp); }} onOpenProgram={prog => { setPreselectProgramId(prog.id); setView("programs"); }} />}
        {view === "metabolites" && (secondaryLoading && metabolites.length === 0
          ? <SecondaryLoading label="Loading metabolites and publication links" />
          : <MetaboliteExplorer metabolites={metabolites} metabolitePublications={metabolitePublications} publications={publications} species={species} onSpeciesClick={setDetailSpecies} />)}
        {view === "market" && <MarketView markets={markets} />}
        {view === "publications" && (secondaryLoading && publications.length === 0
          ? <SecondaryLoading label="Loading publications and metabolite links" />
          : <PublicationsView
            publications={publications}
            metabolites={metabolites}
            metabolitePublications={metabolitePublications}
            user={user}
            profile={profile}
            researcher={authResearcher}
            onPublicationAdded={() => { window.location.reload(); }}
          />)}
        {view === "researchers" && (secondaryLoading && researchers.length === 0
          ? <SecondaryLoading label="Loading researchers" />
          : <ResearchersView researchers={researchers} onOpenResearcher={researcherId => openResearcher(researcherId)} />)}
        {view === "communities" && <CommunitiesView species={species} researchers={researchers} />}
        {view === "partners" && <PartnerView institutions={institutions} />}
        {view === "portfolio" && <PortfolioView species={species} />}
        {view === "sources" && <SourcesPanel sources={sources} />}
        {view === "admin" && isAdminUser && <AdminPanel species={species} programs={programs} onDataChange={() => window.location.reload()} />}

        <div style={{ marginTop: 32, paddingTop: 10, borderTop: "1px solid #e8e6e1", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 4, fontSize: 8, color: "#b4b2a9" }}>
          <span>GEOCON v3.0 · ATLAS intelligence layer · {species.length} species · {programs.length} programs · {publications.length} pubs</span>
          <span>Venn BioVentures OÜ</span>
        </div>
      </div>

      {detailSpecies && (
        <SpeciesDetailPanel
          species={detailSpecies}
          programs={programs}
          metabolitePublications={metabolitePublications}
          onClose={() => closePanelWithBack("species")}
          onStartProgram={sp => { setStartProgramSp(sp); setDetailSpecies(null); }}
          onOpenProgram={prog => openProgramFromPanel(prog, { type: "species", id: detailSpecies.id, label: detailSpecies.accepted_name })}
          onOpenResearcher={researcherId => openResearcher(researcherId, { type: "species", id: detailSpecies.id, label: detailSpecies.accepted_name })}
          breadcrumbBack={breadcrumbBack}
        />
      )}
      {detailResearcherId && (
        <ResearcherDetailPanel
          researcherId={detailResearcherId}
          onClose={() => closePanelWithBack("researcher")}
          onOpenProgram={prog => openProgramFromPanel(prog, { type: "researcher", id: detailResearcherId, label: "researcher" })}
          onOpenSpecies={sp => openSpeciesFromPanel(sp, { type: "researcher", id: detailResearcherId, label: "researcher" })}
          breadcrumb={breadcrumbBack}
        />
      )}

      {startProgramSp && (
        <StartProgramModal
          species={startProgramSp}
          user={user}
          profile={profile}
          researcher={authResearcher}
          onClose={() => setStartProgramSp(null)}
          onSuccess={() => { setStartProgramSp(null); window.location.reload(); }}
        />
      )}

      {authModalOpen && (
        <AuthModal
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => { /* useAuth listener auto-updates */ }}
        />
      )}
      {claimModalOpen && user && (
        <ClaimResearcherModal
          user={user}
          onClose={() => setClaimModalOpen(false)}
          onSubmitted={() => { setClaimModalOpen(false); refreshProfile(); }}
        />
      )}
      {myProfileOpen && user && (
        <MyProfilePanel
          user={user}
          profile={profile}
          researcher={authResearcher}
          onClose={() => setMyProfileOpen(false)}
          onRefresh={refreshProfile}
          onClaimClick={() => { setMyProfileOpen(false); setClaimModalOpen(true); }}
        />
      )}
      {adminPanelOpen && user && isAdminUser && (
        <AdminApprovalPanel
          user={user}
          onClose={() => setAdminPanelOpen(false)}
        />
      )}
    </div>
  );
}
