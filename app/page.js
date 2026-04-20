04:56:30.834 Running build in Washington, D.C., USA (East) – iad1
04:56:30.835 Build machine configuration: 2 cores, 8 GB
04:56:30.943 Cloning github.com/Alpaslanthenomad/geocon-atlas (Branch: main, Commit: 5d8dd58)
04:56:31.548 Cloning completed: 605.000ms
04:56:31.642 Restored build cache from previous deployment (Bq18JaSELizKdnWsvtdauHuLndMR)
04:56:31.903 Running "vercel build"
04:56:32.779 Vercel CLI 51.6.1
04:56:33.062 Installing dependencies...
04:56:35.331 
04:56:35.331 up to date in 2s
04:56:35.332 
04:56:35.333 3 packages are looking for funding
04:56:35.333   run `npm fund` for details
04:56:35.365 Detected Next.js version: 14.2.18
04:56:35.369 Running "npm run build"
04:56:35.472 
04:56:35.473 > geocon-atlas@2.3.0 build
04:56:35.473 > next build
04:56:35.473 
04:56:36.177   ▲ Next.js 14.2.18
04:56:36.178 
04:56:36.195    Creating an optimized production build ...
04:56:38.234 Failed to compile.
04:56:38.234 
04:56:38.234 ./app/page.js
04:56:38.235 Error: 
04:56:38.235   [31mx[0m Expected ',', got ';'
04:56:38.235      ,-[[36;1;4m/vercel/path0/app/page.js[0m:107:1]
04:56:38.235  [2m107[0m |   const navItems = [
04:56:38.235  [2m108[0m |     { key: "home",        label: "Home",         icon: "🏠" },
04:56:38.235  [2m109[0m |     { key: "programs",    label: "Programs",      icon: "📋" },
04:56:38.235  [2m110[0m |     { key: "species",     label: "Species",       icon: "🌿" },"use client";
04:56:38.235      : [31;1m                                                                             ^[0m
04:56:38.235  [2m111[0m | 
04:56:38.235  [2m112[0m | import { useState, useEffect } from "react";
04:56:38.235  [2m113[0m | import { supabase } from "../lib/supabase";
04:56:38.235      `----
04:56:38.235 
04:56:38.235 Caused by:
04:56:38.235     Syntax Error
04:56:38.235 
04:56:38.235 Import trace for requested module:
04:56:38.236 ./app/page.js
04:56:38.236 
04:56:38.247 
04:56:38.247 > Build failed because of webpack errors
04:56:38.275 Error: Command "npm run build" exited with 1
