import { redirect } from "next/navigation";

/** Narrative learning UI removed — redirect to dashboard. */
export default function NarrativasRemovedPage() {
  redirect("/dashboard");
}
