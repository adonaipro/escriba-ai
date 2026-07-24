export function isInsufficientQuotaError(errorText: string): boolean {
  try {
    const parsed = JSON.parse(errorText) as {
      error?: { code?: unknown; type?: unknown };
      code?: unknown;
      type?: unknown;
    };
    const code = parsed.error?.code ?? parsed.code;
    const type = parsed.error?.type ?? parsed.type;
    return code === "insufficient_quota" || type === "insufficient_quota";
  } catch {
    // Some compatible providers return plain text instead of JSON. Match only
    // the machine-readable quota code, never generic words such as "billing".
    return /\binsufficient_quota\b/i.test(errorText);
  }
}
