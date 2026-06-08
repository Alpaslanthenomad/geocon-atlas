import { redirect } from "next/navigation";

// "Bench" was renamed to "Workspace" — keep the old URL alive.
export default function BenchRedirect() {
  redirect("/geocon/workspace");
}
