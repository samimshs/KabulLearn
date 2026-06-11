import { ImageResponse } from "next/og";

// Node runtime (not edge): the OG rendering engine + font exceed the 1 MB
// edge function limit on the current Vercel plan.
export const alt = "KabulLearn — Learn Without Limits";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  // Vazirmatn covers both Latin and Arabic script (Pashto/Dari pills below)
  const { readFile } = await import("node:fs/promises");
  const { join } = await import("node:path");
  const vazirmatn = await readFile(
    join(process.cwd(), "font", "Vazirmatn", "static", "Vazirmatn-Bold.ttf")
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #021533 0%, #00255f 55%, #0057FF 100%)",
          color: "white",
          fontFamily: "Vazirmatn",
          position: "relative"
        }}
      >
        {/* Decorative ring */}
        <div
          style={{
            position: "absolute",
            right: -160,
            top: -160,
            width: 480,
            height: 480,
            borderRadius: 480,
            border: "56px solid rgba(255,255,255,0.07)"
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 80,
            bottom: -120,
            width: 280,
            height: 280,
            borderRadius: 280,
            border: "36px solid rgba(255,255,255,0.05)"
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#9DC0FF"
          }}
        >
          KabulLearn
        </div>

        <div style={{ display: "flex", marginTop: 28, fontSize: 84, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
          Learn Without Limits
        </div>

        <div style={{ display: "flex", marginTop: 32, fontSize: 32, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>
          Free structured courses, guided quizzes, and verified certificates
        </div>

        <div style={{ display: "flex", marginTop: 44, gap: 16 }}>
          {["English", "پښتو", "دری"].map((lang) => (
            <div
              key={lang}
              style={{
                display: "flex",
                padding: "12px 32px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.12)",
                border: "2px solid rgba(255,255,255,0.25)",
                fontSize: 28,
                fontWeight: 700
              }}
            >
              {lang}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", position: "absolute", bottom: 48, left: 80, fontSize: 26, color: "#9DC0FF", fontWeight: 600 }}>
          kabullearn.com
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Vazirmatn", data: vazirmatn.buffer as ArrayBuffer, weight: 700, style: "normal" }]
    }
  );
}
