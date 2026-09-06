// Generates a high-resolution 3300x2515 PNG data URL so that the template is always 100% PNG (no SVG)
let cachedPngUrl: string | null = null;

export function getDefaultCertificatePngUrl(): string {
  if (cachedPngUrl) return cachedPngUrl;

  try {
    const canvas = document.createElement("canvas");
    canvas.width = 3300;
    canvas.height = 2515;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
    }

    // Solid clean background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 3300, 2515);

    // Warm elegant borders (SpeedUp signature styling)
    ctx.strokeStyle = "#1c1c1e";
    ctx.lineWidth = 14;
    ctx.strokeRect(70, 70, 3160, 2375);

    ctx.strokeStyle = "#FB5700";
    ctx.lineWidth = 4;
    ctx.strokeRect(95, 95, 3110, 2325);

    // Corner decorative accents
    const corners = [
      { x: 130, y: 130 },
      { x: 3170, y: 130 },
      { x: 130, y: 2385 },
      { x: 3170, y: 2385 },
    ];
    ctx.fillStyle = "#FB5700";
    corners.forEach((c) => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 16, 0, Math.PI * 2);
      ctx.fill();
    });

    // Header Badge / Monogram
    ctx.beginPath();
    ctx.arc(1650, 380, 70, 0, Math.PI * 2);
    ctx.fillStyle = "#FB5700";
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 56px 'Cinzel', Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SU", 1650, 382);

    // Header Title
    ctx.fillStyle = "#FB5700";
    ctx.font = "bold 42px 'Inter', sans-serif";
    ctx.letterSpacing = "10px";
    ctx.fillText("SPEEDUP GLOBAL EVENT", 1650, 520);

    ctx.fillStyle = "#1c1c1e";
    ctx.font = "800 108px 'Cinzel', Georgia, serif";
    ctx.letterSpacing = "8px";
    ctx.fillText("CERTIFICATE OF PARTICIPATION", 1650, 670);

    // Subtitle
    ctx.fillStyle = "#8e8e93";
    ctx.font = "38px 'Cinzel', Georgia, serif";
    ctx.letterSpacing = "6px";
    ctx.fillText("PROUDLY PRESENTED IN RECOGNITION TO", 1650, 890);

    // Recipient Name Underline / Placeholder Guide
    ctx.strokeStyle = "#e5e5ea";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(450, 1310);
    ctx.lineTo(2850, 1310);
    ctx.stroke();

    // Body description
    ctx.fillStyle = "#3a3a3c";
    ctx.font = "38px 'Inter', system-ui, sans-serif";
    ctx.letterSpacing = "1px";
    ctx.fillText(
      "for active participation, outstanding performance, and demonstrated excellence",
      1650,
      1490
    );
    ctx.fillText(
      "during the SpeedUp Developer & Creators Masterclass Conference.",
      1650,
      1555
    );

    // Signatures & Verification Section
    ctx.strokeStyle = "#1c1c1e";
    ctx.lineWidth = 3;

    // Left Signature
    ctx.beginPath();
    ctx.moveTo(500, 2050);
    ctx.lineTo(1050, 2050);
    ctx.stroke();

    ctx.fillStyle = "#1c1c1e";
    ctx.font = "bold 32px 'Inter', sans-serif";
    ctx.fillText("PROGRAM DIRECTOR", 775, 2100);
    ctx.fillStyle = "#8e8e93";
    ctx.font = "24px 'Inter', sans-serif";
    ctx.fillText("SpeedUp Global", 775, 2140);

    // Center Official Seal
    ctx.strokeStyle = "#FB5700";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(1650, 2030, 90, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#FB5700";
    ctx.font = "bold 24px 'Inter', sans-serif";
    ctx.fillText("VERIFIED", 1650, 2020);
    ctx.fillText("OFFICIAL", 1650, 2050);

    // Right Signature
    ctx.strokeStyle = "#1c1c1e";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(2250, 2050);
    ctx.lineTo(2800, 2050);
    ctx.stroke();

    ctx.fillStyle = "#1c1c1e";
    ctx.font = "bold 32px 'Inter', sans-serif";
    ctx.fillText("EVENT CHAIRPERSON", 2525, 2100);
    ctx.fillStyle = "#8e8e93";
    ctx.font = "24px 'Inter', sans-serif";
    ctx.fillText("Executive Board", 2525, 2140);

    cachedPngUrl = canvas.toDataURL("image/png");
    return cachedPngUrl;
  } catch (e) {
    console.error("Failed to generate default certificate PNG:", e);
    return "";
  }
}
