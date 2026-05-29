export function quizProgressKey(courseId: string, moduleId: string) {
  return `poharana:${courseId}:${moduleId}:quizPassed`;
}

export function getPassedQuizzes(courseId: string, moduleIds: string[]) {
  if (typeof window === "undefined") {
    return new Set<string>();
  }

  return new Set(
    moduleIds.filter((moduleId) => window.localStorage.getItem(quizProgressKey(courseId, moduleId)) === "true")
  );
}

export function isModuleUnlocked(moduleIndex: number, moduleIds: string[], passedQuizzes: Set<string>) {
  if (moduleIndex === 0) {
    return true;
  }

  return passedQuizzes.has(moduleIds[moduleIndex - 1]);
}
