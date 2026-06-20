export const VIDEO_KEYS = {
  intro:                   "video:intro",
  studentWalkthrough:      "video:student-walkthrough",
  creatorWalkthrough:      "video:creator-walkthrough",
  manualCourseCreation:    "video:manual-course-creation",
  aiCourseCreation:        "video:ai-course-creation",
  certificateVerification: "video:certificate-verification",
} as const;

export type VideoKey = typeof VIDEO_KEYS[keyof typeof VIDEO_KEYS];
