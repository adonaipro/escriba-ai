// ─────────────────────────────────────────────────────────────────
// Narrator context — passed into every generation
// ─────────────────────────────────────────────────────────────────

export interface NarratorContext {
  id?: string;
  name: string;
  sex: "female" | "male";
  ageRange: string;
  maritalStatus: string;
  hasChildren: boolean;
  livesAlone: boolean;
}

// ─────────────────────────────────────────────────────────────────
// Product insertion strategies
// ─────────────────────────────────────────────────────────────────

export type ProductStrategy = "clickbait" | "contextual" | "hybrid";

// ─────────────────────────────────────────────────────────────────
// Narrative generation input
// ─────────────────────────────────────────────────────────────────

export interface NarrativeInput {
  productName: string;
  productUrl: string;
  marketplace: string;
  targetNetwork: string;
  niche?: string;
  campaignId: string;
  learnings?: string[];
  topPatterns?: Array<{ type: string; value: string; winCount: number; usageCount: number }>;
  regenerationSeed?: number;
  // Narrator intelligence layer
  narrator?: NarratorContext;
  activeHypotheses?: Array<{ dimension: string; value: string }>;
  productStrategy?: ProductStrategy;
}

export interface NarrativePost {
  position: number;
  content: string;
  hasMedia: boolean;
}

export interface NarrativeElements {
  family: string;
  emotion: string;
  character: string;
  setting: string;
  object: string;
  conflict: string;
  twist: string;
  role?: string;
  conflictObject?: string;
  sceneMoment?: string;
  moralQuestion?: string;
}

export interface NarrativeOutput {
  hook: string;
  narrativeSummary: string;
  format: string;
  family: string;
  emotion: string;
  character: string;
  setting: string;
  object: string;
  conflict: string;
  twist: string;
  // Cinematic director fields
  role: string;
  conflictObject: string;
  sceneMoment: string;
  moralQuestion: string;
  productPosition: number;
  // Experiment dimension fields
  productStrategy: ProductStrategy;
  tone: string;
  rhythm: string;
  structureType: string;
  openingStyle: string;
  conflictType: string;
  questionType: string;
  posts: NarrativePost[];
}

export interface LlmProviderConfig {
  provider: string;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export interface LlmProvider {
  name: string;
  generateNarrative(input: NarrativeInput): Promise<NarrativeOutput>;
}
