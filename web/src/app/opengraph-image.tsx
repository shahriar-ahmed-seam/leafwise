import { ImageResponse } from "next/og";

export const alt = "Leafwise — crop disease detection that works offline";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#fbfaf7",
          padding: "64px 72px",
          fontFamily: "sans-serif",
          color: "#14181a",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 999,
              background: "#2f9e64",
              display: "flex",
            }}
          />
          <div style={{ fontSize: 30, fontWeight: 600 }}>Leafwise</div>
          <div style={{ fontSize: 20, color: "#8c979d", marginLeft: 6 }}>on-device crop diagnosis</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 66, fontWeight: 700, lineHeight: 1.04, letterSpacing: -2 }}>
            <div>Diagnose a leaf</div>
            <div style={{ color: "#1c6b45" }}>without a signal.</div>
          </div>
          <div style={{ fontSize: 25, color: "#5f6a70", maxWidth: 900, lineHeight: 1.35 }}>
            A 9 MB classifier runs entirely in the browser — 38 disease classes, 14 crops, no upload, no server,
            works with the radio off.
          </div>
        </div>

        <div style={{ display: "flex", gap: 44, fontSize: 21 }}>
          {[
            ["94.0%", "PlantVillage top-1"],
            ["9.25 MB", "model, cached once"],
            ["~6 ms", "inference on CPU"],
          ].map(([value, label]) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ color: "#1c6b45", fontWeight: 700, fontSize: 30 }}>{value}</div>
              <div style={{ color: "#8c979d", fontSize: 18 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
