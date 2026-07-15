import { LlmProvider, NarrativeInput, NarrativeOutput } from "../types";
import { buildNarrativeStaircase, type NarratorFilter, type ProductStrategy } from "../narrative-engine";

export class SimulatedProvider implements LlmProvider {
  name = "simulated";

  async generateNarrative(input: NarrativeInput): Promise<NarrativeOutput> {
    const seed = input.regenerationSeed ?? Math.floor(Date.now() / 1000);

    // Use winning patterns as preferred elements if available
    const winningPatterns = (input.topPatterns ?? []).filter((p) => p.winCount > 0);
    const preferredRole = winningPatterns.find((p) => p.type === "role")?.value;
    const preferredEmotion = winningPatterns.find((p) => p.type === "emotion")?.value;
    const preferredConflictObject = winningPatterns.find((p) => p.type === "conflictObject")?.value;

    // Build narrator filter from narrator context
    const narratorFilter: NarratorFilter | undefined = input.narrator
      ? {
          sex: input.narrator.sex,
          ageRange: input.narrator.ageRange,
          maritalStatus: input.narrator.maritalStatus,
          hasChildren: input.narrator.hasChildren,
          livesAlone: input.narrator.livesAlone,
        }
      : undefined;

    const productStrategy: ProductStrategy | undefined =
      input.productStrategy as ProductStrategy | undefined;

    const narrative = buildNarrativeStaircase(
      input.productName,
      input.productUrl,
      seed,
      preferredEmotion,
      preferredRole,
      preferredConflictObject,
      narratorFilter,
      productStrategy,
      input.activeHypotheses
    );

    return {
      hook: narrative.hook,
      narrativeSummary: narrative.narrativeSummary,
      format: "narrative_staircase",
      family: narrative.family,
      emotion: narrative.emotion,
      character: narrative.role,
      setting: narrative.setting,
      object: narrative.conflictObject,
      conflict: narrative.twist,
      twist: narrative.twist,
      // Cinematic fields
      role: narrative.role,
      conflictObject: narrative.conflictObject,
      sceneMoment: narrative.sceneMoment,
      moralQuestion: narrative.moralQuestion,
      productPosition: narrative.productPosition,
      // Experiment dimension fields
      productStrategy: narrative.productStrategy,
      tone: narrative.tone,
      rhythm: narrative.rhythm,
      structureType: narrative.structureType,
      openingStyle: narrative.openingStyle,
      conflictType: narrative.conflictType,
      questionType: narrative.questionType,
      posts: narrative.posts,
    };
  }
}
