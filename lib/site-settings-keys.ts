export const VIDEO_KEYS = {
  learnerSupport:           "video:learner-support",
  educatorResources:        "video:educator-resources",
  certificateVerification:  "video:certificate-verification",
  catalog:                  "video:catalog",
  educatorGuidelines:       "video:educator-guidelines",
} as const;

export type VideoKey = typeof VIDEO_KEYS[keyof typeof VIDEO_KEYS];
