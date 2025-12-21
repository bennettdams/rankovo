import { ImageResponse } from "next/og";

// Image metadata
export const alt = "Rankovo";
export const size = {
  width: 800,
  height: 400,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        height: "100%",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        backgroundImage: "linear-gradient(to bottom, #fffcf9, #fed7aa)",
        textAlign: "center",
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="80"
        height="80"
        viewBox="0 0 24 24"
        style={{ transform: "rotate(10deg)" }}
        fill="none"
        stroke="#eb8c21"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"></path>
        <path d="M5 21h14"></path>
      </svg>
      <div
        style={{
          backgroundImage: "linear-gradient(90deg, #eb8c21, #6c3e6e)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
          fontSize: 80,
          letterSpacing: -2,
          fontWeight: 700,
        }}
      >
        Rankovo
      </div>
      <div
        style={{
          backgroundImage: "linear-gradient(90deg, #629496, #629496)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
          fontSize: 50,
          letterSpacing: -2,
          fontWeight: 700,
        }}
      >
        Die besten Gerichte in deiner Nähe
      </div>
    </div>,
    // ImageResponse options
    {
      // For convenience, we can re-use the exported opengraph-image
      // size config to also set the ImageResponse's width and height.
      ...size,
    },
  );
}
