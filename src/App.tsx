import React, { useState, useRef, useEffect, useCallback } from "react";
import { toPng } from "html-to-image";
import {
  User,
  Download,
  RefreshCw,
  Check,
  Award,
  Maximize2,
  FileImage
} from "lucide-react";
import { CertificateCard } from "./components/CertificateCard";
import {
  getDefaultCertificatePngUrl,
  getGeneratedCertificatePngUrl,
} from "./components/defaultCertificatePng";

export default function App() {
  // Participant Name
  const [name, setName] = useState("");

  // Primary certificate template (bundled PNG if present, otherwise generated fallback)
  const [activeTemplateUrl, setActiveTemplateUrl] = useState<string>(() =>
    getDefaultCertificatePngUrl()
  );
  
  // Natural dimensions detected from the image for accurate canvas rendering
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number }>({
    width: 13200,
    height: 10060,
  });

  // Base preview dimensions to prevent excessive DOM memory while preserving exact 1.3121272 aspect ratio
  const previewBaseWidth = 3300;
  const previewBaseHeight = 2515;

  // Export Settings
  const [certFormat, setCertFormat] = useState<"png" | "jpeg">("png");
  const [exportResolution, setExportResolution] = useState<"native" | "print">("native");
  const [certNameYPercent, setCertNameYPercent] = useState<number>(48.5); // Baseline recipient line
  const [certNameOffsetY, setCertNameOffsetY] = useState<number>(46); // +46px down from top by default

  const certNameColor = "#000000"; // Pure solid black
  const [isDownloadingCert, setIsDownloadingCert] = useState(false);
  const [certDownloadSuccess, setCertDownloadSuccess] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.18);

  // Refs for preview and canvas rendering
  const previewParentRef = useRef<HTMLDivElement>(null);
  const highResCertContainerRef = useRef<HTMLDivElement>(null);

  // Update preview scaling dynamically to preserve exact aspect ratio without cropping
  const updateScale = useCallback(() => {
    if (previewParentRef.current) {
      const parentWidth = previewParentRef.current.clientWidth;
      const horizontalPadding = window.innerWidth < 640 ? 24 : 48;
      const availableWidth = Math.max(200, parentWidth - horizontalPadding);

      const computedScale = Math.min(availableWidth / previewBaseWidth, 0.28);
      setPreviewScale(computedScale > 0 ? computedScale : 0.15);
    }
  }, [previewBaseWidth]);

  useEffect(() => {
    updateScale();
    const handleResize = () => updateScale();
    window.addEventListener("resize", handleResize);
    const timer = setTimeout(updateScale, 100);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, [updateScale]);

  // Inspect the loaded template image to read its natural width & height for canvas
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setNaturalDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      }
    };
    img.src = activeTemplateUrl;
  }, [activeTemplateUrl]);

  const handleReset = () => {
    setName("");
    setCertFormat("png");
    setCertNameYPercent(48.5);
    setCertNameOffsetY(46);
  };

  // --- Export Certificate: Exact same dimensions as certificate.png with ZERO cropping ---
  const exportCertificate = async () => {
    if (!name.trim()) {
      alert("Please enter your full name to download your certificate.");
      const nameInput = document.getElementById("name-input");
      if (nameInput) nameInput.focus();
      return;
    }

    try {
      setIsDownloadingCert(true);
      setCertDownloadSuccess(false);

      // Load background PNG template directly from imported asset
      const img = new Image();
      img.crossOrigin = "anonymous";

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => {
          img.onload = () => resolve();
          img.onerror = (e2) => reject(e2);
          img.src = getGeneratedCertificatePngUrl();
        };
        img.src = activeTemplateUrl;
      });

      // Target resolution based on user choice or browser limits
      const nativeWidth = img.naturalWidth || naturalDimensions.width;
      const nativeHeight = img.naturalHeight || naturalDimensions.height;

      let targetWidth = exportResolution === "native" ? nativeWidth : 3300;
      let targetHeight = exportResolution === "native" ? nativeHeight : 2515;

      // Render on HTML5 Canvas at exact dimensions (zero cropping)
      let canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      let ctx = canvas.getContext("2d");

      // Memory safeguard: if browser cannot allocate extreme canvas sizes, gracefully fallback
      if (!ctx) {
        targetWidth = Math.round(targetWidth / 2);
        targetHeight = Math.round(targetHeight / 2);
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        ctx = canvas.getContext("2d");
      }
      if (!ctx) {
        targetWidth = 3300;
        targetHeight = 2515;
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        ctx = canvas.getContext("2d");
      }
      if (!ctx) throw new Error("Could not initialize 2D canvas");

      // For JPEG format, fill solid white background first
      if (certFormat === "jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }

      // Draw ENTIRE PNG template from top-left (0,0) to full width and height
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Print Participant Name: Centered horizontally, exact recipient line vertically + 30px offset for spacing
      const displayName = name.trim().toUpperCase();
      const nameX = targetWidth / 2;
      const scaledOffsetY = Math.round(certNameOffsetY * (targetHeight / 2515));
      const nameY = targetHeight * (certNameYPercent / 100) + scaledOffsetY;

      // Proportional font sizing matching the template's exact resolution
      const proportionalFontSize = Math.max(24, Math.round(targetHeight * 0.0417));
      const letterSpacing = Math.max(1, Math.round(proportionalFontSize * 0.038));

      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `800 ${proportionalFontSize}px 'Cinzel', 'Playfair Display', Georgia, 'Inter', serif, sans-serif`;
      ctx.fillStyle = certNameColor; // Pure solid black #000000
      ctx.shadowColor = "transparent"; // Strictly zero drop shadow
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.letterSpacing = `${letterSpacing}px`;

      ctx.fillText(displayName, nameX, nameY);
      ctx.restore();

      const mimeType = certFormat === "jpeg" ? "image/jpeg" : "image/png";
      const quality = certFormat === "jpeg" ? 1.0 : undefined;
      const dataUrl = canvas.toDataURL(mimeType, quality);

      const ext = certFormat === "jpeg" ? "jpg" : "png";
      const link = document.createElement("a");
      const sanitizedName = name.trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
      link.download = `certificate_${sanitizedName}.${ext}`;
      link.href = dataUrl;
      link.click();

      setCertDownloadSuccess(true);
      setTimeout(() => setCertDownloadSuccess(false), 5000);
    } catch (canvasErr) {
      console.warn("Canvas export fallback:", canvasErr);
      if (highResCertContainerRef.current) {
        try {
          const ext = certFormat === "jpeg" ? "jpg" : "png";
          const dataUrl = await toPng(highResCertContainerRef.current, {
            width: previewBaseWidth,
            height: previewBaseHeight,
            cacheBust: true,
            style: {
              transform: "none",
            },
          });
          const link = document.createElement("a");
          const sanitizedName = name.trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
          link.download = `certificate_${sanitizedName}.${ext}`;
          link.href = dataUrl;
          link.click();
          setCertDownloadSuccess(true);
          setTimeout(() => setCertDownloadSuccess(false), 5000);
        } catch (domErr) {
          console.error("DOM export failed:", domErr);
          alert("Error exporting certificate. Please check your browser download permissions.");
        }
      }
    } finally {
      setIsDownloadingCert(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    exportCertificate();
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-[#1c1c1e] flex flex-col antialiased selection:bg-[#FB5700]/15 selection:text-[#FB5700]">
      {/* Top Navigation Bar */}
      <header className="border-b border-[#e5e5ea] bg-white sticky top-0 z-40 backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#FB5700] text-white p-2.5 rounded-xl shadow-lg shadow-[#FB5700]/15">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#1c1c1e]">
                SpeedUp Certificate Portal
              </h1>
              <p className="text-xs text-[#8e8e93]">
                Official Certificate Generator
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              <FileImage className="w-3.5 h-3.5 text-emerald-600" />
              <span>Official Template</span>
            </span>

            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-[#3a3a3c] hover:bg-[#f2f2f7] transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Clear
            </button>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-1.5"></span>
                Event Closed
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span>
                Ready to Download
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* Left Column - Clean Participant Name Input & Download Action */}
        <section className="lg:col-span-5 flex flex-col gap-6">

          {/* Participant Credentials Form Container */}
          <div className="bg-white rounded-2xl border border-[#e5e5ea] p-5 sm:p-6 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#f2f2f7]">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#1c1c1e] flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#FB5700]" /> Participant Credentials
                </h2>
                <p className="text-[11px] sm:text-xs text-[#8e8e93] mt-0.5">
                  Enter your name to generate your high-resolution certificate.
                </p>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-5">
              {/* Full Name Input */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="name-input"
                  className="text-xs font-bold text-[#3a3a3c] uppercase tracking-wider flex items-center gap-1"
                >
                  Full Name <span className="text-[#e51a24] font-bold">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8e8e93]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="name-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Khuzaima Aurangzeb"
                    className="w-full pl-10 pr-4 py-3 bg-[#f2f2f7]/50 rounded-xl border border-[#e5e5ea] focus:outline-none focus:border-[#FB5700] focus:ring-4 focus:ring-[#FB5700]/10 text-sm font-medium text-[#1c1c1e] transition-all"
                    required
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-[#8e8e93] mt-0.5">
                  Printed centered on the signature line in solid black with zero drop shadow.
                </p>
              </div>

              {/* Download Format Option: PNG or JPEG */}
              <div className="flex flex-col gap-2 pt-2 border-t border-[#f2f2f7]">
                <label className="text-xs font-bold text-[#3a3a3c] uppercase tracking-wider">
                  Download Format
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCertFormat("png")}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border cursor-pointer ${
                      certFormat === "png"
                        ? "bg-[#1c1c1e] text-white border-[#1c1c1e] shadow-sm"
                        : "bg-[#f2f2f7] text-[#3a3a3c] border-[#e5e5ea] hover:bg-[#e5e5ea]"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${certFormat === "png" ? "bg-[#FB5700]" : "bg-[#8e8e93]"}`}></span>
                    PNG Format
                  </button>
                  <button
                    type="button"
                    onClick={() => setCertFormat("jpeg")}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border cursor-pointer ${
                      certFormat === "jpeg"
                        ? "bg-[#1c1c1e] text-white border-[#1c1c1e] shadow-sm"
                        : "bg-[#f2f2f7] text-[#3a3a3c] border-[#e5e5ea] hover:bg-[#e5e5ea]"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${certFormat === "jpeg" ? "bg-[#FB5700]" : "bg-[#8e8e93]"}`}></span>
                    JPEG Format
                  </button>
                </div>
              </div>

              {/* Resolution Options */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-[#3a3a3c] uppercase tracking-wider">
                  Export Quality
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setExportResolution("native")}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition border flex flex-col items-center justify-center cursor-pointer ${
                      exportResolution === "native"
                        ? "bg-orange-50 border-[#FB5700] text-[#FB5700] font-bold"
                        : "bg-[#f2f2f7] border-[#e5e5ea] text-[#3a3a3c]"
                    }`}
                  >
                    <span>Full Ultra HD</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportResolution("print")}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition border flex flex-col items-center justify-center cursor-pointer ${
                      exportResolution === "print"
                        ? "bg-orange-50 border-[#FB5700] text-[#FB5700] font-bold"
                        : "bg-[#f2f2f7] border-[#e5e5ea] text-[#3a3a3c]"
                    }`}
                  >
                    <span>Standard Print</span>
                  </button>
                </div>
              </div>

              {/* Download Certificate Action Button */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={isDownloadingCert}
                  className="w-full bg-[#FB5700] hover:bg-[#FB5700]/95 text-white py-3.5 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#FB5700]/25 text-sm sm:text-base"
                >
                  {isDownloadingCert ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin flex-shrink-0" />
                      <span className="truncate">Generating Certificate ({certFormat.toUpperCase()})...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 flex-shrink-0" />
                      <span className="truncate">Download Certificate ({certFormat.toUpperCase()})</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Right Column - Live Certificate Preview Window */}
        <section className="lg:col-span-7 flex flex-col" ref={previewParentRef}>
          <div className="bg-white rounded-2xl border border-[#e5e5ea] p-4 sm:p-6 shadow-sm flex-1 flex flex-col gap-3 sm:gap-4">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#f2f2f7] gap-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#1c1c1e] flex items-center gap-2">
                  <Award className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#FB5700]" /> Live Certificate Preview
                </h2>
                <p className="text-[10px] sm:text-xs text-[#8e8e93] mt-0.5">
                  Real-time preview with zero cropping and solid black typography.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-1 bg-[#f2f2f7] text-[#3a3a3c] rounded-md font-mono flex items-center gap-1">
                  <Maximize2 className="w-3 h-3 text-[#8e8e93]" />
                  {Math.round(previewScale * 100)}%
                </span>
              </div>
            </div>

            {certDownloadSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <p className="text-[10px] sm:text-xs font-bold">
                  Congratulations! Your certificate has been downloaded with zero cropping!
                </p>
              </div>
            )}

            {/* Showcase Stand - Scaled smoothly to fit container width while retaining 100% full aspect ratio */}
            <div 
              className="flex-1 bg-[#1c1c1e]/5 rounded-xl border border-[#e5e5ea]/50 flex items-center justify-center p-3 sm:p-6 relative overflow-hidden transition-all duration-300 min-h-[300px]"
            >
              {/* Certificate Preview Container with Exact Proportional Dimensions */}
              <div
                style={{
                  width: `${Math.round(previewBaseWidth * previewScale)}px`,
                  height: `${Math.round(previewBaseHeight * previewScale)}px`,
                  overflow: "hidden",
                  borderRadius: "12px",
                  boxShadow: "0 20px 45px -10px rgba(0, 0, 0, 0.45)",
                  backgroundColor: "#ffffff",
                }}
                className="relative select-none transition-all duration-200"
              >
                <CertificateCard
                  name={name}
                  bgImageUrl={activeTemplateUrl}
                  width={previewBaseWidth}
                  height={previewBaseHeight}
                  nameYPercent={certNameYPercent}
                  nameOffsetY={certNameOffsetY}
                  nameColor={certNameColor}
                  scale={previewScale}
                />
              </div>
            </div>

          </div>
        </section>
      </main>

      {/* Out-Of-Sight Absolute Element for High-Precision 1:1 painting fallback */}
      <div
        style={{
          position: "absolute",
          top: "-9999px",
          left: "-9999px",
          width: `${previewBaseWidth}px`,
          height: `${previewBaseHeight}px`,
          overflow: "hidden",
        }}
      >
        <CertificateCard
          ref={highResCertContainerRef}
          name={name}
          bgImageUrl={activeTemplateUrl}
          width={previewBaseWidth}
          height={previewBaseHeight}
          nameYPercent={certNameYPercent}
          nameOffsetY={certNameOffsetY}
          nameColor={certNameColor}
          scale={1}
        />
      </div>

      {/* Footer bar */}
      <footer className="border-t border-[#e5e5ea] bg-white py-6 mt-12 text-center text-xs text-[#8e8e93] font-medium">
        <p>© 2026 SpeedUp. Official Event Certificate Portal.</p>
      </footer>
    </div>
  );
}
