export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const enableLocal = process.env.NODE_ENV !== "production" || process.env.ENABLE_LOCAL_PUBLISHER === "true";
  if (!enableLocal) return;
  const state = globalThis as typeof globalThis & { __escribaPublisherTimer?: ReturnType<typeof setInterval> };
  if (state.__escribaPublisherTimer) return;
  const tick = async () => {
    try {
      const { runDueThreadsPublications } = await import("@/lib/publishing/runner");
      const { runCampaignRecurrence } = await import("@/lib/scheduling/recurrence");
      const { runThreadsInsightsSync } = await import("@/lib/publishing/insights-runner");
      await runCampaignRecurrence();
      await runDueThreadsPublications();
      await runThreadsInsightsSync();
    } catch (error) {
      console.error("[local-publisher]", error instanceof Error ? error.message : error);
    }
  };
  setTimeout(() => void tick(), 10_000);
  state.__escribaPublisherTimer = setInterval(() => void tick(), 60_000);
}
