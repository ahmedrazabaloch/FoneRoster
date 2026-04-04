import React from "react";
import { pdf } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { EmployeeCardPDF } from "./EmployeeCardPDF";
import { buildIdCardQrPayload } from "./idCardConstants";
import logoAsset from "../../assets/logo.png";
import CardFrontBg from "../../assets/card-front.png";
import CardBackBg from "../../assets/card-back.png";

// ── Helpers ───────────────────────────────────────────────────────

/**
 * Resolve a Vite-imported asset to a plain URL string.
 * Vite may return either `"string"` or `{ default: "string" }`.
 */
function resolveAsset(imported) {
  if (typeof imported === "string") return imported;
  if (imported && typeof imported.default === "string") return imported.default;
  return imported;
}

/**
 * Convert a relative asset path to an absolute URL so that
 * @react-pdf/renderer can fetch it in its own context.
 */
function toAbsoluteUrl(assetPath) {
  const resolved = resolveAsset(assetPath);
  if (!resolved) return null;
  // Already absolute — data URLs, https://, http://
  if (
    resolved.startsWith("data:") ||
    resolved.startsWith("http://") ||
    resolved.startsWith("https://")
  ) {
    return resolved;
  }
  // Relative path from Vite — prepend origin
  return `${window.location.origin}${resolved.startsWith("/") ? "" : "/"}${resolved}`;
}

/**
 * Generate a QR code as a base64 PNG data URL.
 * Uses the `qrcode` npm package (already a dependency).
 */
async function generateQrDataUrl(employee) {
  const payload = buildIdCardQrPayload(employee);
  return QRCode.toDataURL(payload, {
    width: 200,
    margin: 0,
    errorCorrectionLevel: "H",
    color: { dark: "#000000", light: "#ffffff" },
  });
}

/**
 * Convert a remote image URL to a base64 data URL.
 * This is needed because @react-pdf/renderer may have CORS issues
 * with Firebase Storage URLs in some environments.
 */
async function imageUrlToDataUrl(url) {
  if (!url) return null;
  // Already a data URL
  if (url.startsWith("data:")) return url;

  try {
    const response = await fetch(url, { mode: "cors" });
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    console.warn("[IdCard PDF] Could not fetch image:", url);
    return null;
  }
}

// ── Public API ────────────────────────────────────────────────────

/**
 * Generate and download an ID card PDF for the given employee.
 *
 * Pipeline:  employee data → QR data URL → <EmployeeCardPDF /> → blob → download
 *
 * No DOM refs, no html2canvas, no rasterization.
 * Fully deterministic output.
 */
export async function generateIdCardPdf(employee, options = {}) {
  const { photoPosition } = options;
  // 1. Prepare assets concurrently
  const [qrDataUrl, photoDataUrl] = await Promise.all([
    generateQrDataUrl(employee),
    imageUrlToDataUrl(employee?.photoUrl || ""),
  ]);

  // Resolve static assets to absolute URLs
  const logoSrc = toAbsoluteUrl(logoAsset);
  const frontBgSrc = toAbsoluteUrl(CardFrontBg);
  const backBgSrc = toAbsoluteUrl(CardBackBg);

  // Patch photoUrl with the fetched data URL (avoids CORS in PDF context)
  const employeeForPdf = {
    ...employee,
    photoUrl: photoDataUrl || "",
  };

  const blob = await pdf(
    <EmployeeCardPDF
      employee={employeeForPdf}
      qrDataUrl={qrDataUrl}
      logoSrc={logoSrc}
      frontBgSrc={frontBgSrc}
      backBgSrc={backBgSrc}
      photoPosition={photoPosition}
    />,
  ).toBlob();

  // 3. Trigger download — use employee name for filename
  const name = employee?.name || "card";
  const safeName = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "_");

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${safeName}_id_card.pdf`;
  document.body.appendChild(anchor);
  anchor.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 100);
}
