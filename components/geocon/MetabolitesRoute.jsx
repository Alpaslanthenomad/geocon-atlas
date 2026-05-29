"use client";
import MetabolitesIndexRoute from "./MetabolitesIndexRoute";

/**
 * /geocon/metabolites — modern metabolite directory backed by
 * list_metabolites_filtered. Replaces the legacy MetaboliteExplorer.
 */
export default function MetabolitesRoute() {
  return <MetabolitesIndexRoute />;
}
