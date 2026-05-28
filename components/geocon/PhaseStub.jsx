"use client";
import Link from "next/link";

/**
 * Placeholder for routes that haven't been migrated yet. Surfaces clearly
 * that the page exists in the legacy orchestrator and is awaiting its
 * own route + data fetch.
 */
export default function PhaseStub({ title, note }) {
  return (
    <div style={{ maxWidth: 640, margin: "60px auto 0", padding: "40px 32px", textAlign: "center", background: "#fff", border: "1px solid #ece9e2", borderRadius: 14 }}>
      <div style={{ fontSize: 11, color: "#b4b2a9", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 10 }}>Phase 2</div>
      <h1 style={{ fontFamily: "Georgia,serif", fontSize: 26, fontWeight: 700, color: "#2c2c2a", margin: "0 0 14px" }}>{title}</h1>
      <p style={{ fontSize: 13, color: "#6f6d66", lineHeight: 1.7, margin: 0 }}>
        {note || "This module is being moved into its own route. Until then, the legacy view will be re-wired here."}
      </p>
      <div style={{ marginTop: 22 }}>
        <Link href="/geocon" style={{ display: "inline-block", padding: "8px 14px", fontSize: 12, fontWeight: 600, color: "#1D9E75", border: "1px solid #1D9E75", borderRadius: 7, textDecoration: "none" }}>
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
