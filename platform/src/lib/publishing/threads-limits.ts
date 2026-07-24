/** Threads text posts hard limit (Meta API). */
export const THREADS_TEXT_MAX_CHARS = 500;

export type ThreadsPostLike = {
  position?: number;
  content: string;
};

export type OversizedThreadsPost = {
  position: number;
  length: number;
};

/** Same metric used by the existing publisher check: JS string length. */
export function measureThreadsTextLength(content: string): number {
  return (content ?? "").length;
}

export function findOversizedThreadsPosts(
  posts: ThreadsPostLike[],
): OversizedThreadsPost[] {
  return posts
    .map((post, index) => ({
      position: post.position ?? index + 1,
      length: measureThreadsTextLength(post.content),
    }))
    .filter((post) => post.length > THREADS_TEXT_MAX_CHARS);
}

export function formatOversizedThreadsPostsError(
  oversized: OversizedThreadsPost[],
): string {
  const detail = oversized
    .map((post) => `post ${post.position} (${post.length} caracteres)`)
    .join(", ");
  return `Post(s) acima do limite de ${THREADS_TEXT_MAX_CHARS} caracteres do Threads: ${detail}. Encurte o texto e tente novamente.`;
}

export function assertThreadsPostsWithinLimit(posts: ThreadsPostLike[]): void {
  const oversized = findOversizedThreadsPosts(posts);
  if (oversized.length > 0) {
    throw new Error(formatOversizedThreadsPostsError(oversized));
  }
}

export function isWithinThreadsTextLimit(content: string): boolean {
  return measureThreadsTextLength(content) <= THREADS_TEXT_MAX_CHARS;
}
