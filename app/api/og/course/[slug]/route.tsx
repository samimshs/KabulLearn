import { ImageResponse } from "next/og";
import { courseArtIndex, COURSE_GRADIENTS } from "@/lib/course-art";

export const runtime = "nodejs";

const SIZE = { width: 1200, height: 630 };

function parseGradientColors(gradient: string): [string, string] {
  const matches = gradient.match(/#[0-9A-Fa-f]{6}/g);
  return matches && matches.length >= 2
    ? [matches[0], matches[1]]
    : ["#0057FF", "#0E7490"];
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(req.url);

  const title = searchParams.get("title") || "KabulLearn Course";
  const level = searchParams.get("level") || null;
  const instructorName = searchParams.get("instructor") || null;
  // `id` is the real course ID used for the deterministic gradient; fall back to slug
  const courseId = searchParams.get("id") || decodeURIComponent(slug);

  const gradientIndex = courseArtIndex(courseId);
  const gradient = COURSE_GRADIENTS[gradientIndex];
  const [colorStart, colorEnd] = parseGradientColors(gradient);

  const levelLabel =
    level === "BEGINNER"
      ? "Beginner"
      : level === "INTERMEDIATE"
      ? "Intermediate"
      : level === "ADVANCED"
      ? "Advanced"
      : null;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "1200px",
          height: "630px",
          background: `linear-gradient(135deg, ${colorStart} 0%, ${colorEnd} 100%)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Dot pattern overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            display: "flex",
          }}
        />

        {/* Top-right glow */}
        <div
          style={{
            position: "absolute",
            top: "-120px",
            right: "-120px",
            width: "480px",
            height: "480px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            display: "flex",
          }}
        />

        {/* Bottom-left glow */}
        <div
          style={{
            position: "absolute",
            bottom: "-80px",
            left: "-80px",
            width: "320px",
            height: "320px",
            borderRadius: "50%",
            background: "rgba(0,0,0,0.12)",
            display: "flex",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "64px 72px",
            width: "100%",
            height: "100%",
          }}
        >
          {/* Top: branding */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 6C9.5 4.3 5.5 4 3 4.7v13C5.5 17 9.5 17.3 12 19M12 6c2.5-1.7 6.5-2 9-1.3v13c-2.5-.7-6.5-.4-9 1.3M12 6v13"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span
              style={{
                color: "rgba(255,255,255,0.9)",
                fontSize: "20px",
                fontWeight: 700,
                letterSpacing: "-0.3px",
              }}
            >
              KabulLearn
            </span>
          </div>

          {/* Middle: title + level badge */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {levelLabel && (
              <div style={{ display: "flex" }}>
                <span
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    color: "white",
                    fontSize: "15px",
                    fontWeight: 600,
                    padding: "6px 16px",
                    borderRadius: "100px",
                    letterSpacing: "0.2px",
                  }}
                >
                  {levelLabel}
                </span>
              </div>
            )}
            <div
              style={{
                color: "white",
                fontSize: title.length > 40 ? "52px" : "62px",
                fontWeight: 800,
                lineHeight: 1.15,
                letterSpacing: "-1.5px",
                maxWidth: "900px",
              }}
            >
              {title}
            </div>
          </div>

          {/* Bottom: instructor + domain */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {instructorName ? (
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "white",
                  }}
                >
                  {instructorName.charAt(0).toUpperCase()}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span
                    style={{
                      color: "rgba(255,255,255,0.65)",
                      fontSize: "13px",
                      fontWeight: 500,
                    }}
                  >
                    Instructor
                  </span>
                  <span
                    style={{
                      color: "white",
                      fontSize: "17px",
                      fontWeight: 600,
                    }}
                  >
                    {instructorName}
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex" }} />
            )}

            <span
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: "15px",
                fontWeight: 500,
                letterSpacing: "0.3px",
              }}
            >
              kabullearn.com
            </span>
          </div>
        </div>
      </div>
    ),
    SIZE
  );
}
