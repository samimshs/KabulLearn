"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

export function ConfettiEffect() {
  useEffect(() => {
    const end = Date.now() + 2200;
    const colors = ["#0057FF", "#18825C", "#F2C879", "#fff"];

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, []);

  return null;
}
