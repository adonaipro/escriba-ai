const MINUTE_MS = 60_000;

/** Floor to minute precision (seconds/ms zeroed). */
export function floorToMinute(date: Date): Date {
  const d = new Date(date.getTime());
  d.setSeconds(0, 0);
  return d;
}

/**
 * Allocate `count` unique minute slots.
 * Starts at preferredStart; on collision advances +1 minute.
 * Preserves order: each slot is strictly after the previous.
 * Mutates `occupiedMs` so callers can chain allocations.
 */
export function allocateUniqueMinutes(
  preferredStart: Date,
  count: number,
  occupiedMs: Set<number>,
): Date[] {
  const slots: Date[] = [];
  let cursor = floorToMinute(preferredStart).getTime();

  for (let i = 0; i < count; i++) {
    while (occupiedMs.has(cursor)) {
      cursor += MINUTE_MS;
    }
    occupiedMs.add(cursor);
    slots.push(new Date(cursor));
    cursor += MINUTE_MS;
  }

  return slots;
}
