export function quizProgressKey(courseId: string, moduleId: string) {
  return `poharana:${courseId}:${moduleId}:quizPassed`;
}

export function getPassedQuizzes(courseId: string, moduleIds: string[]) {
  if (typeof window === "undefined") return new Set<string>();
  return new Set(
    moduleIds.filter((moduleId) => window.localStorage.getItem(quizProgressKey(courseId, moduleId)) === "true")
  );
}

export function isModuleUnlocked(moduleIndex: number, moduleIds: string[], passedQuizzes: Set<string>) {
  return true;
}

/* ── Lesson visit tracking ──────────────────────────────────── */

export function lessonVisitedKey(courseId: string, lessonId: string) {
  return `poharana:${courseId}:lesson:${lessonId}`;
}

export function markLessonVisited(courseId: string, lessonId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(lessonVisitedKey(courseId, lessonId), "true");
}

export function getVisitedLessons(courseId: string, lessonIds: string[]): Set<string> {
  if (typeof window === "undefined") return new Set();
  return new Set(
    lessonIds.filter((id) => window.localStorage.getItem(lessonVisitedKey(courseId, id)) === "true")
  );
}

/** Returns the ID of the next unvisited lesson after the furthest visited one,
 *  or the last lesson if everything has been visited. Returns null if nothing visited. */
export function getResumeLessonId(courseId: string, lessonIds: string[]): string | null {
  if (typeof window === "undefined") return null;
  let furthest = -1;
  for (let i = 0; i < lessonIds.length; i++) {
    if (window.localStorage.getItem(lessonVisitedKey(courseId, lessonIds[i])) === "true") {
      furthest = i;
    }
  }
  if (furthest === -1) return null;
  // Resume at the next unvisited lesson, or the last lesson if all visited
  return lessonIds[Math.min(furthest + 1, lessonIds.length - 1)];
}
