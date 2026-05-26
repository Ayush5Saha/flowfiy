import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Flowfiy — Find leads, write emails, close deals automatically";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#030305",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -60%)",
            width: 900,
            height: 600,
            background:
              "radial-gradient(ellipse, rgba(109,40,217,0.18) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -100,
            left: "20%",
            width: 500,
            height: 400,
            background:
              "radial-gradient(ellipse, rgba(79,70,229,0.12) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Logo mark + wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            marginBottom: 36,
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
              fontWeight: 900,
              color: "white",
              boxShadow: "0 0 40px rgba(124,58,237,0.4)",
            }}
          >
            F
          </div>
          <span
            style={{
              fontSize: 46,
              fontWeight: 800,
              color: "white",
              letterSpacing: -1.5,
            }}
          >
            Flowfiy
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 58,
            fontWeight: 900,
            color: "white",
            textAlign: "center",
            lineHeight: 1.1,
            maxWidth: 960,
            marginBottom: 20,
            letterSpacing: -1.5,
          }}
        >
          Find leads, write emails,{" "}
          <span style={{ color: "#a78bfa" }}>close deals</span>
          {" — automatically."}
        </div>

        {/* Subtext */}
        <div
          style={{
            fontSize: 24,
            color: "#71717a",
            textAlign: "center",
            maxWidth: 680,
            marginBottom: 44,
            lineHeight: 1.5,
          }}
        >
          AI-powered outbound sales platform. 100 free leads to start.
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", gap: 14 }}>
          {[
            "5 AI Agents",
            "275M+ Contacts",
            "Sends from Gmail",
            "Free to Start",
          ].map((text) => (
            <div
              key={text}
              style={{
                padding: "10px 22px",
                borderRadius: 100,
                border: "1px solid rgba(139,92,246,0.35)",
                background: "rgba(139,92,246,0.1)",
                color: "#c4b5fd",
                fontSize: 17,
                fontWeight: 500,
              }}
            >
              {text}
            </div>
          ))}
        </div>

        {/* Bottom domain */}
        <div
          style={{
            position: "absolute",
            bottom: 28,
            color: "#3f3f46",
            fontSize: 16,
            letterSpacing: 0.5,
          }}
        >
          flowfiy.com
        </div>
      </div>
    ),
    { ...size }
  );
}
