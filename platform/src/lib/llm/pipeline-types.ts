// ─── Pipeline types for the multi-stage narrative engine ─────────────────────
//
// Stage flow:
//   ExplorationStage → BeatPlanStage → DraftWriterStage
//   → [SpecificityFixStage?] → [ProductFixStage?]
//
// Product is determined BEFORE the story is written.
// This inverts the old flow and makes the product connection causal, not decorative.

export type ConflictFamily =
  | "invasão_de_espaço"
  | "decided_for_me"
  | "desgaste_silencioso"
  | "combinados_quebrados"
  | "surpresa_de_gratidão"
  | "limite_não_visto";

export interface ProductBridgeSituation {
  scene: string;
  character: string;
  productEntry: string;
  conflictFamily: ConflictFamily | string;
}

export interface StoryOpportunity {
  character: string;
  specificSituation: string;
  conflictFamily: string;
  conflictObject: string;
  productEntry: string;
  productCausality: "direct" | "contextual" | "received";
}

export interface ExplorationResult {
  situations: ProductBridgeSituation[];
  chosenOpportunity: StoryOpportunity;
  hooks: string[];
}

export interface PlannedBeat {
  postIndex: number;
  event: string;
  dialogue: string[] | null;
  reveal: string;
  withhold: string;
  isProductPost: boolean;
}

export interface BeatPlanResult {
  beats: PlannedBeat[];
}

export interface PipelineDraftPost {
  position: number;
  content: string;
}

export interface DraftResult {
  posts: PipelineDraftPost[];
}

export interface NarrativeScore {
  hookDensity: number;
  eventProgression: number;
  specificity: number;
  dialogueQuality: number;
  productIntegration: number;
  total: number;
  issues: string[];
  bannedFound: string[];
}

export interface PipelineNarratorData {
  name: string;
  sex: string;
  ageRange: string;
  maritalStatus: string;
  hasChildren: boolean;
  livesAlone: boolean;
  conflictStyle: "avoids" | "confronts" | "deflects" | "internalizes";
  shareStyle: "tells_friends" | "keeps_private" | "reflects_alone";
  expressionStyle: "emotional" | "dry" | "reflective" | "direct";
}

export interface PipelineDebugData {
  stage: "exploration" | "beatplan" | "draft" | "specificity_fix" | "product_fix" | "done";
  situations: Array<{ scene: string; character: string; conflictFamily: string }>;
  chosenOpportunity: StoryOpportunity;
  hooksConsidered: string[];
  selectedHook: string;
  beatPlan: PlannedBeat[];
  draftPosts: PipelineDraftPost[];
  score: NarrativeScore;
  specificityFixed: boolean;
  productFixed: boolean;
  callCount: number;
  totalTokens: number;
  durationMs: number;
  provider: string;
  model: string;
}

export interface PipelineResult {
  posts: PipelineDraftPost[];
  opportunity: StoryOpportunity;
  score: NarrativeScore;
  selectedHook: string;
  debug: PipelineDebugData;
}

// ─── Story Engine types (RAG architecture) ────────────────────────────────────

export interface StoryScore {
  humanness: number;           // 0-25: sounds like a real person?
  conflictClarity: number;     // 0-25: human conflict clear and compelling?
  productNaturalness: number;  // 0-25: product appears naturally?
  discussionPotential: number; // 0-25: will people comment?
  total: number;               // 0-100
  issues: string[];
}

export interface StoryDebugData {
  kind: "story";
  withLink: boolean;
  examplesUsed: number;
  posts: Array<{ position: number; content: string }>;
  score: StoryScore;
  callCount: number;
  totalTokens: number;
  durationMs: number;
  provider: string;
  model: string;
}
