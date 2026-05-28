"use client";
import { useState } from "react";
import { useAuth, signOut } from "../../lib/auth";
import BEESignInFlow from "./SignInFlow";

export default function BEEAuthBar() {
  const { user, profile, researcher, loading } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  const displayName =
    researcher?.name ||
    profile?.full_name ||
    user?.email?.split("@")[0] ||
    "";

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 28,
          right: 32,
          zIndex: 5,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        {loading ? (
          <div
            style={{
              height: 32,
              width: 90,
              borderRadius: 8,
              background: "rgba(245, 166, 35, 0.06)",
              border: "1px solid rgba(245, 166, 35, 0.15)",
            }}
          />
        ) : user ? (
          <>
            <div
              style={{
                fontSize: 11,
                color: "#FFD79B",
                letterSpacing: 0.4,
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
              onClick={async () => {
                await signOut();
              }}
              style={{
                padding: "6px 12px",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 0.4,
                color: "#FFD15C",
                background: "transparent",
                border: "1px solid rgba(245, 166, 35, 0.3)",
                borderRadius: 8,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(245, 166, 35, 0.1)";
                e.currentTarget.style.borderColor = "rgba(245, 166, 35, 0.55)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "rgba(245, 166, 35, 0.3)";
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <button
            onClick={() => setModalOpen(true)}
            style={{
              padding: "8px 16px",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 0.5,
              color: "#1a0d2e",
              background:
                "linear-gradient(140deg, #FFD15C 0%, #F5A623 50%, #E5722B 100%)",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              transition: "filter 0.15s, transform 0.15s",
              boxShadow: "0 2px 12px rgba(245, 166, 35, 0.25)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = "brightness(1.08)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = "brightness(1)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Sign in
          </button>
        )}
      </div>

      {modalOpen && (
        <BEESignInFlow
          user={user}
          profile={profile}
          researcher={researcher}
          loading={loading}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
