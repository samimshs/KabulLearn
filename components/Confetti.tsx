"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number; y: number;
  vx: number; vy: number;
  color: string;
  w: number; h: number;
  rotation: number;
  rotSpeed: number;
};

const COLORS = ["#0057FF", "#4D84FF", "#18825C", "#C9A84C", "#7c3aed", "#E05555"];

export function Confetti({ onDone }: { onDone?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const originX = W / 2;
    const originY = H * 0.55;

    const particles: Particle[] = Array.from({ length: 90 }, () => {
      const angle = (Math.random() - 0.5) * Math.PI * 1.1;
      const speed = 5 + Math.random() * 9;
      return {
        x: originX,
        y: originY,
        vx: Math.sin(angle) * speed,
        vy: -(Math.cos(angle) * speed) - Math.random() * 3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        w: 7 + Math.random() * 7,
        h: 3 + Math.random() * 4,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.22,
      };
    });

    const DURATION = 2600;
    let start: number | null = null;
    let raf: number;

    function frame(ts: number) {
      if (!start) start = ts;
      const elapsed = ts - start;
      const t = elapsed / DURATION;

      ctx!.clearRect(0, 0, W, H);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22;
        p.vx *= 0.995;
        p.rotation += p.rotSpeed;

        const alpha = Math.max(0, 1 - t * 1.4);
        ctx!.save();
        ctx!.globalAlpha = alpha;
        ctx!.fillStyle = p.color;
        ctx!.translate(p.x, p.y);
        ctx!.rotate(p.rotation);
        ctx!.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx!.restore();
      }

      if (elapsed < DURATION) {
        raf = requestAnimationFrame(frame);
      } else {
        onDone?.();
      }
    }

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 9999 }}
    />
  );
}
