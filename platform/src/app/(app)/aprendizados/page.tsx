import { redirect } from "next/navigation";

/** Aprendizados UI removed — redirect to dashboard. */
export default function AprendizadosRemovedPage() {
  redirect("/dashboard");
}
