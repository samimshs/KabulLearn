/**
 * Stable, deterministic course artwork selection.
 *
 * Both the catalog cards and the dashboard derive their gradient from a hash
 * of the course ID, so a given course always wears the same art everywhere —
 * regardless of list order, filters, or which view renders it.
 */

export const COURSE_GRADIENTS = [
  "linear-gradient(135deg,#0057FF 0%,#0E7490 100%)",
  "linear-gradient(135deg,#18825C 0%,#0E7490 100%)",
  "linear-gradient(135deg,#7C3AED 0%,#0057FF 100%)",
  "linear-gradient(135deg,#B06C00 0%,#C42B2B 100%)",
  "linear-gradient(135deg,#0E7490 0%,#18825C 100%)",
  "linear-gradient(135deg,#C42B2B 0%,#7C3AED 100%)",
] as const;

export function courseArtIndex(courseId: string): number {
  let hash = 0;
  for (let i = 0; i < courseId.length; i++) {
    hash = (hash * 31 + courseId.charCodeAt(i)) >>> 0;
  }
  return hash % COURSE_GRADIENTS.length;
}

export function courseGradient(courseId: string): string {
  return COURSE_GRADIENTS[courseArtIndex(courseId)];
}
