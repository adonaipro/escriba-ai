import type { LlmProviderConfig } from "./types";
import { resolveEffectiveLlmConfig } from "./index";

export const MAX_GENERATION_COUNT = 20;

const DEFAULT_ITEM_RETRIES = 6;
const DEFAULT_TIMEOUT_MS = 120_000;
const BASE_BACKOFF_MS = 1_500;

export function clampGenerationCount(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(MAX_GENERATION_COUNT, Math.floor(n)));
}

export function assertGenerationCount(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n) || n < 1) {
    throw new GenerationBatchError("Informe a quantidade de narrativas (mínimo 1).", 400);
  }
  if (n > MAX_GENERATION_COUNT) {
    throw new GenerationBatchError(
      `Máximo de ${MAX_GENERATION_COUNT} narrativas por geração.`,
      400,
    );
  }
  return Math.floor(n);
}

export class GenerationBatchError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = "GenerationBatchError";
    this.status = status;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /429|rate limit|timeout|ECONNRESET|ETIMEDOUT|fetch failed|socket|503|502|504|temporár|try again|overloaded|capacity/i.test(
    message,
  );
}

function isPermanentQuotaError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /créditos|esgotad|billing|insufficient_quota|tokens per day|limite diário/i.test(message);
}

export async function withTimeout<T>(promise: Promise<T>, ms: number, label = "geração"): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Timeout na ${label} (${Math.round(ms / 1000)}s)`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Platform Groq fallback when BYOK/primary fails. */
export function resolveFallbackLlmConfig(
  primary: LlmProviderConfig | null,
): LlmProviderConfig | null {
  const platformKey = process.env.ESCRIBA_GROQ_API_KEY;
  if (!platformKey) return null;
  if (primary?.provider === "groq" && primary.apiKey === platformKey) return null;
  return { provider: "groq", apiKey: platformKey, model: "llama-3.3-70b-versatile" };
}

export type RetryOptions = {
  maxAttempts?: number;
  timeoutMs?: number;
  label?: string;
  fallbackConfig?: LlmProviderConfig | null;
};

/**
 * Run one generation with retries, timeout, exponential backoff and optional provider fallback.
 * Failures are not surfaced as partial results — either returns a value or throws after exhaustion.
 */
export async function withGenerationRetry<T>(
  run: (config: LlmProviderConfig | null, attempt: number) => Promise<T>,
  primaryConfig: LlmProviderConfig | null,
  options: RetryOptions = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? DEFAULT_ITEM_RETRIES;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const label = options.label ?? "geração";
  const fallback = options.fallbackConfig ?? resolveFallbackLlmConfig(primaryConfig);

  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const useFallback = attempt >= 2 && fallback != null;
    const config = useFallback ? fallback : primaryConfig;
    try {
      return await withTimeout(run(config, attempt), timeoutMs, label);
    } catch (error) {
      lastError = error;
      if (isPermanentQuotaError(error) && !fallback) throw error;
      if (isPermanentQuotaError(error) && useFallback) {
        // primary quota dead — keep trying fallback only
      } else if (!isTransientError(error) && attempt >= 2 && !fallback) {
        // non-transient without fallback: still retry a couple times then throw
        if (attempt >= maxAttempts - 1) throw error;
      }
      const backoff = Math.min(30_000, BASE_BACKOFF_MS * Math.pow(2, attempt));
      const jitter = Math.floor(Math.random() * 400);
      await sleep(backoff + jitter);
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error(`Falha na ${label} após ${maxAttempts} tentativas`);
}

export type CompleteBatchOptions<T> = {
  count: number;
  primaryConfig: LlmProviderConfig | null;
  /** Produce one candidate. Throw on failure — never return partial junk. */
  generateOne: (config: LlmProviderConfig | null, index: number, attempt: number) => Promise<T>;
  /** Optional: reject duplicates / invalid outputs (return false to retry). */
  isValid?: (item: T, accepted: T[]) => boolean;
  maxAttemptsPerItem?: number;
  timeoutMs?: number;
  concurrency?: number;
};

/**
 * Complete exactly `count` valid items. Failed attempts are discarded and retried.
 * Never returns a shorter array — throws if the batch cannot be completed.
 */
export async function completeGenerationBatch<T>(
  options: CompleteBatchOptions<T>,
): Promise<T[]> {
  const count = clampGenerationCount(options.count);
  const accepted: T[] = [];
  const maxAttemptsPerItem = options.maxAttemptsPerItem ?? DEFAULT_ITEM_RETRIES;
  const fallback = resolveFallbackLlmConfig(options.primaryConfig);
  // Global safety: don't spin forever (count * retries * 3)
  const hardCap = count * maxAttemptsPerItem * 3;
  let totalAttempts = 0;
  let nextIndex = 0;

  const concurrency = Math.max(1, Math.min(options.concurrency ?? 2, count));

  async function produceOne(slotIndex: number): Promise<T> {
    return withGenerationRetry(
      async (config, attempt) => {
        totalAttempts++;
        if (totalAttempts > hardCap) {
          throw new GenerationBatchError(
            "Não foi possível completar o lote de narrativas. Tente novamente em instantes.",
            503,
          );
        }
        const item = await options.generateOne(config, slotIndex, attempt);
        if (options.isValid && !options.isValid(item, accepted)) {
          throw new Error("Saída inválida ou duplicada — regenerando");
        }
        return item;
      },
      options.primaryConfig,
      {
        maxAttempts: maxAttemptsPerItem,
        timeoutMs: options.timeoutMs,
        label: `narrativa ${slotIndex + 1}`,
        fallbackConfig: fallback,
      },
    );
  }

  // Fill accepted until exactly count
  while (accepted.length < count) {
    const remaining = count - accepted.length;
    const batchSize = Math.min(concurrency, remaining);
    const indices = Array.from({ length: batchSize }, () => nextIndex++);
    const results = await Promise.all(
      indices.map(async (slotIndex) => {
        try {
          return { ok: true as const, value: await produceOne(slotIndex) };
        } catch (error) {
          return { ok: false as const, error };
        }
      }),
    );

    for (const result of results) {
      if (result.ok) {
        if (options.isValid && !options.isValid(result.value, accepted)) {
          // rare race: discard and continue loop
          continue;
        }
        accepted.push(result.value);
      }
    }

    // If nothing accepted in this round and we hit hard errors, throw last
    if (accepted.length < count) {
      const failures = results.filter((r) => !r.ok);
      if (failures.length === batchSize && totalAttempts >= hardCap) {
        const err = failures[0] && !failures[0].ok ? failures[0].error : null;
        throw err instanceof Error
          ? err
          : new GenerationBatchError("Não foi possível completar o lote de narrativas.", 503);
      }
      // brief pause before refilling remaining slots
      await sleep(400);
    }
  }

  return accepted.slice(0, count);
}

/** Re-export for callers that only have a DB llm row. */
export function effectiveConfigFromRow(
  row: { provider: string; apiKey: string; model: string; baseUrl: string } | null,
): LlmProviderConfig | null {
  return resolveEffectiveLlmConfig(row);
}
