"use client";
import { createContext, useContext } from "react";
import { useAuth as useAuthHook } from "./auth";

/**
 * Shared auth context — one Supabase listener for the entire client tree.
 * Wrap the top of a route segment in <AuthProvider> and call useAuthContext()
 * anywhere below to read user / profile / researcher / loading / refreshProfile.
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const auth = useAuthHook();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used inside <AuthProvider>");
  }
  return ctx;
}
