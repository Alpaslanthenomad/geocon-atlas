#!/usr/bin/env node
// Generates a VAPID key pair for web push.
// Run with: node scripts/gen-vapid.js
//
// Paste output into Vercel env vars + Supabase vault.
import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();

console.log("Generated VAPID key pair.\n");
console.log("Vercel env vars (Project → Settings → Environment Variables):");
console.log("  NEXT_PUBLIC_VAPID_PUBLIC_KEY =", keys.publicKey);
console.log("  VAPID_PRIVATE_KEY            =", keys.privateKey);
console.log("  VAPID_SUBJECT                = mailto:alpaslansevket@gmail.com");
console.log("  PUSH_INTERNAL_SECRET         = <generate with: openssl rand -hex 32>\n");

console.log("Supabase vault (Dashboard → Project Settings → Vault → New Secret):");
console.log("  geocon_site_url        = https://geocon-atlas.vercel.app");
console.log("  push_internal_secret   = <same value as PUSH_INTERNAL_SECRET above>");
console.log("\nThe DB trigger pulls these from the vault to call /api/push/send.");
console.log("If vault secrets are not set, the trigger silently no-ops — pushes won't fire.\n");
