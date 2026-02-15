import { readFile } from "node:fs/promises";
import { join } from "node:path";

interface OgLayoutProps {
  title: string;
  subtitle: string;
}

export const OG_SIZE = { width: 1200, height: 630 };

export async function renderOgLayout({ title, subtitle }: OgLayoutProps) {
  let logoSvg = await readFile(
    join(process.cwd(), "public", "logo.svg"),
    "utf-8"
  );

  // Adapt logo colors for dark background
  logoSvg = logoSvg.replace(/#c7f1ff/g, "#3d2a1a"); // blue bg → dark brown
  logoSvg = logoSvg.replace(/#000000/g, "#e8d5c0"); // black strokes → light tan

  const logoSrc = `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString("base64")}`;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background:
          "linear-gradient(135deg, #1c0f06 0%, #2d1810 40%, #3d2317 100%)",
        padding: "60px 80px",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={72} height={72} alt="" />
      </div>

      {/* Content */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            color: "#ffffff",
            fontSize: 60,
            fontWeight: 700,
            lineHeight: 1.15,
          }}
        >
          {title}
        </div>
        <div
          style={{
            color: "#c89b6e",
            fontSize: 28,
            marginTop: 20,
          }}
        >
          {subtitle}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          color: "#7a6148",
          fontSize: 22,
        }}
      >
        artisanroast.app
      </div>
    </div>
  );
}
