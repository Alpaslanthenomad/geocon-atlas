"use client";
import ProgramsView from "../programs/ProgramsView";

/**
 * /geocon/programs — list view only. Clicking a program now navigates to
 * /geocon/programs/[id] (handled inside ProgramsView via next/link).
 */
export default function ProgramsRoute() {
  return <ProgramsView />;
}
