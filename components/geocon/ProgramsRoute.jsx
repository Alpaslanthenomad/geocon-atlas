"use client";
import ProgramsIndexRoute from "./ProgramsIndexRoute";

/**
 * /geocon/programs — modern program directory backed by
 * list_programs_filtered. Replaces the legacy ProgramsView grid; that
 * component stays in the codebase for any future modal/embed use.
 */
export default function ProgramsRoute() {
  return <ProgramsIndexRoute />;
}
