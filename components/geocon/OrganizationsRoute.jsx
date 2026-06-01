"use client";
// components/geocon/OrganizationsRoute.jsx
//
// /geocon/organizations — directory of every registered organization. Public
// read (RLS allows it). Top bar lets a signed-in user start a new one.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { countryName } from "../../lib/countryNames";
import { flag } from "../../lib/atlas/format";
import { EmptyState as SharedEmptyState } from "../shared";

const KIND_LABEL = {
  university:         "University",
  research_institute: "Research institute",
  government:         "Government",
  company:            "Company",
  ngo:                "NGO",
  foundation:         "Foundation",
  nursery:            "Nursery / producer",
  cooperative:        "Cooperative",
  consortium:         "Consortium",
  other:              "Other",
};

const KIND_TINT = {
  university:         "#185FA5",
  research_institute: "#0F6E56",
  government:         "#534AB7",
  company:            "#D85A30",
  ngo:                "#BA7517",
  foundation:         "#BA7517",
  nursery:            "#0F6E56",
  cooperative:        "#534AB7",
  consortium:         "#185FA5",
  other:              "#888780",
};

export default function OrganizationsRoute() {
  const { user } = useAuthContext();
  const [orgs, setOrgs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [kind, setKind]       = useState("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, slug, name, short_name, kind, industry, country, website, logo_url, description, capabilities, interests, verified_status, created_at")
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) {
        console.warn("[organizations] load error:", error.message);
      }
      setOrgs(data || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    let r = orgs;
    if (kind !== "all") r = r.filter((o) => o.kind === kind);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter((o) =>
        (o.name || "").toLowerCase().includes(q) ||
        (o.short_name || "").toLowerCase().includes(q) ||
        (o.industry || "").toLowerCase().includes(q) ||
        (countryName(o.country) || "").toLowerCase().includes(q)
      );
    }
    return r;
  }, [orgs, kind, search]);

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <div>
          <h1 className="gx-h1">
            Organizations
          </h1>
          <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
            Universities, R&amp;D firms, institutes, NGOs and producers participating on the platform.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {user && (
            <Link
              href="/geocon/organizations/new"
              style={{ padding: "7px 12px", fontSize: 12, fontWeight: 600, background: "#0a4a3e", color: "#fff", borderRadius: 7, textDecoration: "none" }}
            >
              + Register organization
            </Link>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, industry, country…"
          style={{ padding: "7px 10px", fontSize: 12, border: "1px solid #e8e6e1", borderRadius: 7, minWidth: 260, flex: 1, background: "#fff" }}
        />
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          style={{ padding: "7px 10px", fontSize: 12, border: "1px solid #e8e6e1", borderRadius: 7, background: "#fff", cursor: "pointer" }}
        >
          <option value="all">All kinds</option>
          {Object.entries(KIND_LABEL).map(([k, label]) => (
            <option key={k} value={k}>{label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <Skeleton />
      ) : filtered.length === 0 ? (
        <EmptyState hasAny={orgs.length > 0} isSignedIn={!!user} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {filtered.map((o) => <OrgTile key={o.id} org={o} />)}
        </div>
      )}
    </div>
  );
}

function OrgTile({ org }) {
  const tint = KIND_TINT[org.kind] || "#888780";
  return (
    <Link
      href={`/geocon/organizations/${org.id}`}
      style={{
        display: "block",
        background: "#fff",
        border: "1px solid #ece9e2",
        borderRadius: 10,
        padding: "14px 16px",
        textDecoration: "none",
        color: "inherit",
        transition: "transform 0.12s, box-shadow 0.12s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.06)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: 6, background: tint + "1a", color: tint, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>
          {org.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img loading="lazy" decoding="async" src={org.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6 }} />
          ) : (
            (org.short_name || org.name || "?").trim().charAt(0).toUpperCase()
          )}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#2c2c2a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {org.name}
          </div>
          <div style={{ fontSize: 10, color: "#888", marginTop: 1 }}>
            {KIND_LABEL[org.kind] || org.kind}{org.industry && ` · ${org.industry}`}
          </div>
        </div>
        {org.verified_status === "verified" && (
          <span title="Verified" style={{ fontSize: 11, color: "#0F6E56" }}>✓</span>
        )}
      </div>

      {(org.country || org.website) && (
        <div style={{ fontSize: 10, color: "#888", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          {org.country && (
            <span>{flag(org.country)} {countryName(org.country) || org.country}</span>
          )}
          {org.website && org.country && <span>·</span>}
          {org.website && (
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {org.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </span>
          )}
        </div>
      )}

      {org.description && (
        <div style={{ fontSize: 11, color: "#555", lineHeight: 1.45, marginBottom: 6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {org.description}
        </div>
      )}

      {Array.isArray(org.capabilities) && org.capabilities.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
          {org.capabilities.slice(0, 4).map((cap) => (
            <span key={cap} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#f4f3ef", color: "#666" }}>
              {cap}
            </span>
          ))}
          {org.capabilities.length > 4 && (
            <span style={{ fontSize: 9, color: "#888" }}>+{org.capabilities.length - 4}</span>
          )}
        </div>
      )}
    </Link>
  );
}

function Skeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} style={{ height: 130, background: "#f4f3ef", borderRadius: 10 }} />
      ))}
    </div>
  );
}

function EmptyState({ hasAny, isSignedIn }) {
  if (hasAny) {
    return (
      <SharedEmptyState
        icon="🏢"
        title="No organizations match those filters"
        hint="Try clearing a filter or searching a broader name."
        cta={isSignedIn
          ? { label: "+ Register an organization", href: "/geocon/organizations/new" }
          : null}
      />
    );
  }
  return (
    <SharedEmptyState
      icon="🏢"
      title="No organizations registered yet"
      hint="Organizations are the universities, R&D firms, and producers that propose and accept collaborations. Be the first to register one."
      cta={isSignedIn
        ? { label: "+ Register the first organization", href: "/geocon/organizations/new" }
        : { label: "Sign in via BEE", href: "/" }
      }
    />
  );
}
