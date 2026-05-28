"use client";
import { useAuth, signOut } from "../../lib/auth";

/**
 * Top-right BEE auth indicator. Only renders when a user is signed in —
 * the central EntryPanel handles the login UX so we don't double up.
 */
export default function BEEAuthBar() {
  const { user, profile, researcher, loading } = useAuth();

  if (loading || !user) return null;

  const displayName =
    researcher?.name ||
    profile?.full_name ||
    user.email?.split("@")[0] ||
    "";

  return (
    <div
      style={{
        position: "absolute",
        top: 24,
        right: 28,
        zIndex: 5,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "6px 10px 6px 12px",
        borderRadius: 999,
        background: "rgba(28, 12, 44, 0.55)",
        border: "1px solid rgba(245, 166, 35, 0.22)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#FFD79B",
          letterSpacing: 0.3,
          fontWeight: 500,
          maxWidth: 200,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {displayName}
      </div>
      <button
        onClick={() => signOut()}
        style={{
          padding: "4px 10px",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 0.4,
          color: "#FFD15C",
          background: "transparent",
          border: "1px solid rgba(245, 166, 35, 0.3)",
          borderRadius: 999,
          cursor: "pointer",
        }}
      >
        Sign out
      </button>
    </div>
  );
}
