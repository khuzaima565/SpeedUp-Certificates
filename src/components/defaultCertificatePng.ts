import certificateTemplateUrl from "../certificate.png";

// Official bundled PNG template (13200x10060)
export function getDefaultCertificatePngUrl(): string {
  return certificateTemplateUrl;
}

// Generated 3300x2515 PNG used only if the official template fails to load
let cachedGeneratedPngUrl: string | null = null;

export function getGeneratedCertificatePngUrl(): string {
  if (cachedGeneratedPngUrl) return cachedGeneratedPngUrl;

  try {
    const canvas = document.createElement("canvas");
    canvas.width = 3300;
    canvas.height = 2515;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
    }

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 3300, 2515);

    ctx.strokeStyle = "#1c1c1e";
    ctx.lineWidth = 14;
    ctx.strokeRect(70, 70, 3160, 2375);

    ctx.strokeStyle = "#FB5700";
    ctx.lineWidth = 4;
    ctx.strokeRect(95, 95, 3110, 2325);

    cachedGeneratedPngUrl = canvas.toDataURL("image/png");
    return cachedGeneratedPngUrl;
  } catch (e) {
    console.error("Failed to generate fallback certificate PNG:", e);
    return "";
  }
}
