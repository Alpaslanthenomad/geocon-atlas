"use client";
// components/geocon/OrganizationDetailRoute.jsx
//
// /geocon/organizations/[id] — overview of one org: identity card, capability
// chips, member list (researchers + users), accreditation banner + apply CTA,
// and (later) proposals from/to it. Signed-in non-members see a
// "Request to join" button.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { countryName } from "../../lib/countryNames";
import { flag } from "../../lib/atlas/format";
import AccreditationBanner from "./AccreditationBanner";
import ApplyForAccreditationModal from "./ApplyForAccreditationModal";
import WatchToggle from "./WatchToggle";
import RelatedOpenCalls from "./RelatedOpenCalls";
import OrgDomainExtras from "./OrgDomainExtras";
import CommercializedOutcomes from "./CommercializedOutcomes";
import OrgCapabilitiesPanel from "./OrgCapabilitiesPanel";
import ImpactFactorPanel from "./ImpactFactorPanel";

const KIND_LABEL = {
  university: "University", research_institute: "Research institute",
  government: "Government", company: "Company", ngo: "NGO",
  foundation: "Foundation", nursery: "Nursery / producer",
  cooperative: "Cooperative", consortium: "Consortium", other: "Other",
};

const KIND_TINT = {
  university: "#185FA5", research_institute: "#0F6E56",
  government: "#534AB7", company: "#D85A30", ngo: "#BA7517",
  foundation: "#BA7517", nursery: "#0F6E56",
  cooperative: "#534AB7", consortium: "#185FA5", other: "#888780",
};

export default function OrganizationDetailRoute({ orgId }) {
  const router = useRouter();
  const { user } = useAuthContext();
  const [payload, setPayload] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState(null);
  const [joinedAt, setJoinedAt] = useState(null);
  const [applyOpen, setApplyOpen] = useState(false);

  async function load() {
    setLoading(true);
    const [{ data, error: rpcErr }, programsResp] = await Promise.all([
      supabase.rpc("get_organization_with_members", { p_org_id: orgId }),
      supabase.rpc("get_organization_programs",     { p_org_id: orgId }),
    ]);
    if (rpcErr) setError(rpcErr.message);
    setPayload(data || null);
    setPrograms(Array.isArray(programsResp.data) ? programsResp.data : []);
    setLoading(false);
  }

  useEffect(() => { if (orgId) load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [orgId]);

  if (loading) return <Skeleton />;
  if (error)   return <ErrorBox message={error} />;
  if (!payload?.org) return <NotFound />;

  const { org } = payload;
  const members = payload.members || [];
  const tint = KIND_TINT[org.kind] || "#888780";

  const myMembership = members.find((m) => m.user_id === user?.id);
  const canJoin = user && !myMembership;
  const isOrgAdmin = myMembership?.role === "admin" && myMembership?.status === "active";

  async function requestJoin() {
    if (joining) return;
    setJoining(true); setJoinError(null);
    try {
      const { error: rpcErr } = await supabase.rpc("join_organization", {
        p_org_id:        orgId,
        p_role:          "researcher",
        p_title:         null,
        p_department:    null,
        p_claim_evidence: null,
        p_is_primary:    false,
      });
      if (rpcErr) throw rpcErr;
      setJoinedAt(new Date().toISOString());
      load();
    } catch (e) {
      setJoinError(e.message || "Failed to request join.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      <div style={{ marginBottom: 14 }}>
        <Link href="/geocon/organizations" style={{ fontSize: 11, color: "#888", textDecoration: "none" }}>← Organizations</Link>
      </div>

      <div style={{ background: "#fff", border: "1px solid #ece9e2", borderRadius: 12, padding: 22, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: 10, background: tint + "1a", color: tint, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, flexShrink: 0 }}>
            {org.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img loading="lazy" decoding="async" src={org.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10 }} />
            ) : (
              (org.short_name || org.name || "?").trim().charAt(0).toUpperCase()
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h1 style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700, color: "#2c2c2a", margin: 0 }}>
                {org.name}
              </h1>
              {org.verified_status === "verified" && (
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "#e8f5f0", color: "#0F6E56", fontWeight: 600 }}>
                  ✓ verified
                </span>
              )}
              {org.verified_status === "unverified" && (
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "#f4f3ef", color: "#888" }}>
                  unverified
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
              <span style={{ color: tint, fontWeight: 600 }}>{KIND_LABEL[org.kind] || org.kind}</span>
              {org.industry && <> · {org.industry}</>}
              {org.country && <> · {flag(org.country)} {countryName(org.country) || org.country}</>}
              {org.city && <> · {org.city}</>}
            </div>
            {org.website && (
              <a href={org.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#185FA5", textDecoration: "none", display: "inline-block", marginTop: 4 }}>
                {org.website.replace(/^https?:\/\//, "").replace(/\/$/, "")} ↗
              </a>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
            {myMembership ? (
              <div style={{ fontSize: 10, padding: "5px 10px", background: "#e8f5f0", color: "#0F6E56", borderRadius: 999, fontWeight: 600 }}>
                You are {myMembership.role}{myMembership.status === "pending" && " (pending)"}
              </div>
            ) : canJoin ? (
              <button
                onClick={requestJoin}
                disabled={joining || joinedAt}
                style={{ fontSize: 11, padding: "7px 14px", fontWeight: 600, background: joinedAt ? "#bfbfbf" : "#0a4a3e", color: "#fff", border: "none", borderRadius: 7, cursor: joining || joinedAt ? "default" : "pointer" }}
              >
                {joinedAt ? "Request sent" : joining ? "…" : "Request to join"}
              </button>
            ) : null}
            {user && !myMembership && org.accreditation_status === "accredited" && (
              <Link
                href={`/geocon/proposals/new?to_kind=organization&to_id=${org.id}&to_name=${encodeURIComponent(org.name)}`}
                style={{ fontSize: 11, padding: "7px 14px", fontWeight: 600, background: "#fff", color: "#0a4a3e", border: "1px solid #0a4a3e", borderRadius: 7, textDecoration: "none", textAlign: "center" }}
              >
                Propose collaboration
              </Link>
            )}
            <WatchToggle
              kind="organization"
              entityId={org.id}
              label={org.name}
              url={`/geocon/organizations/${org.id}`}
            />
            {joinError && <div style={{ fontSize: 10, color: "#A32D2D" }}>{joinError}</div>}
          </div>
        </div>

        {org.description && (
          <p style={{ marginTop: 14, marginBottom: 0, fontSize: 13, color: "#444", lineHeight: 1.55 }}>
            {org.description}
          </p>
        )}

        {Array.isArray(org.capabilities) && org.capabilities.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
              Capabilities
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {org.capabilities.map((cap) => (
                <span key={cap} style={{ fontSize: 11, padding: "4px 9px", borderRadius: 999, background: "#f4f3ef", color: "#444" }}>
                  {cap}
                </span>
              ))}
            </div>
          </div>
        )}

        {Array.isArray(org.interests) && org.interests.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
              Areas of interest
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {org.interests.map((it) => (
                <span key={it} style={{ fontSize: 11, padding: "4px 9px", borderRadius: 999, background: "#fff", border: "1px solid #ece9e2", color: "#666" }}>
                  {it}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <AccreditationBanner
        org={org}
        isOrgAdmin={isOrgAdmin}
        onApply={() => setApplyOpen(true)}
      />

      {applyOpen && (
        <ApplyForAccreditationModal
          orgId={org.id}
          orgName={org.name}
          initialScope={org.accreditation_scope || []}
          onClose={() => setApplyOpen(false)}
          onSubmitted={() => { setApplyOpen(false); load(); }}
        />
      )}

      <OrgCapabilitiesPanel org={org} onSaved={load} />

      <ImpactFactorPanel
        contributorKind="organization"
        contributorId={org.id}
      />

      <OrgDomainExtras orgId={org.id} />

      <CommercializedOutcomes
        contributorKind="organization"
        contributorId={org.id}
        allowDeclare={!!user}
        title="Commercialization recognition"
      />

      <RelatedOpenCalls
        rpcName="list_open_proposals_for_org"
        rpcArgs={{ p_org_id: org.id }}
        title={`Open proposals involving ${org.short_name || org.name}`}
      />

      {programs.length > 0 && (
        <section style={{ marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#2c2c2a", margin: 0 }}>
              Programs
            </h2>
            <span style={{ fontSize: 11, color: "#888" }}>{programs.length}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
            {programs.map((p) => (
              <Link
                key={p.participation_id}
                href={`/geocon/programs/${p.program.id}`}
                style={{ display: "block", background: "#fff", border: "1px solid #ece9e2", borderRadius: 10, padding: 12, textDecoration: "none", color: "inherit" }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: "#2c2c2a" }}>{p.program.program_name}</div>
                <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
                  {p.program.program_code}
                  {p.program.status && ` · ${p.program.status}`}
                </div>
                <span style={{ marginTop: 6, display: "inline-block", fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "#f4f3ef", color: "#534AB7", fontWeight: 600 }}>
                  {p.kind}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: "#2c2c2a", margin: 0 }}>
            Members
          </h2>
          <span style={{ fontSize: 11, color: "#888" }}>{members.length}</span>
        </div>

        {members.length === 0 ? (
          <div style={{ padding: 30, border: "1px dashed #ece9e2", borderRadius: 10, textAlign: "center", color: "#888", fontSize: 12 }}>
            No members yet.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
            {members.map((m) => <MemberCard key={m.membership_id} m={m} />)}
          </div>
        )}
      </section>
    </div>
  );
}

function MemberCard({ m }) {
  const r = m.researcher;
  const name = r?.name || (m.user_id ? "Member" : "Unknown");
  const href = m.researcher_id ? `/geocon/researchers/${encodeURIComponent(m.researcher_id)}` : null;
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const body = (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(145deg,#e8f5f0,#dfe9f5)", color: "#0a4a3e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
        {initial}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#2c2c2a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {name}
        </div>
        <div style={{ fontSize: 10, color: "#888", marginTop: 1 }}>
          {m.role}{m.title && ` · ${m.title}`}
        </div>
        {m.department && (
          <div style={{ fontSize: 10, color: "#aaa", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {m.department}
          </div>
        )}
        {m.status === "pending" && (
          <div style={{ marginTop: 4, fontSize: 9, color: "#BA7517", fontWeight: 600 }}>pending</div>
        )}
      </div>
    </div>
  );
  const card = (
    <div style={{ background: "#fff", border: "1px solid #ece9e2", borderRadius: 10, padding: 12 }}>
      {body}
    </div>
  );
  return href ? (
    <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>{card}</Link>
  ) : card;
}

function Skeleton() {
  return (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      <div style={{ height: 160, background: "#f4f3ef", borderRadius: 12, marginBottom: 16 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
        {[1, 2, 3, 4].map((i) => <div key={i} style={{ height: 70, background: "#f4f3ef", borderRadius: 10 }} />)}
      </div>
    </div>
  );
}

function ErrorBox({ message }) {
  return (
    <div style={{ padding: 20, background: "#fdecec", border: "1px solid #fcc", borderRadius: 8, color: "#A32D2D", fontSize: 12 }}>
      Failed to load organization: {message}
    </div>
  );
}

function NotFound() {
  return (
    <div style={{ padding: 60, textAlign: "center", color: "#888", fontSize: 13 }}>
      Organization not found.
      <div style={{ marginTop: 10 }}>
        <Link href="/geocon/organizations" style={{ color: "#185FA5", fontSize: 11 }}>← Back to organizations</Link>
      </div>
    </div>
  );
}
