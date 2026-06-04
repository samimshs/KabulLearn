import { describe, expect, it } from "vitest";
import { isModuleUnlocked, quizProgressKey } from "@/lib/progress";

describe("progress helpers", () => {
  it("builds a normalized local storage key for module quiz progress", () => {
    expect(quizProgressKey("course-1", "module-2")).toBe("poharana:course-1:module-2:quizPassed");
  });

  it("always unlocks the first module", () => {
    expect(isModuleUnlocked(0, ["module-1", "module-2"], new Set())).toBe(true);
  });

  it("keeps modules navigable while server actions enforce prerequisite completion", () => {
    const passed = new Set<string>(["module-1"]);

    expect(isModuleUnlocked(1, ["module-1", "module-2"], passed)).toBe(true);
    expect(isModuleUnlocked(2, ["module-1", "module-2", "module-3"], passed)).toBe(true);
  });
});
