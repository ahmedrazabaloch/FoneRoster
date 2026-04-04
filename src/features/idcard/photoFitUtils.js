/**
 * Photo Fit Utilities
 *
 * Core logic for the "cover-fill with focus point" rendering model.
 * The photo ALWAYS fills the 76×82pt frame — no gray background visible.
 * User controls:
 *   - Focus point (x/y 0-100): what part of the image to center on
 *   - Scale (0.5-2.0): zoom level (1.0 = image just covers the frame)
 */

// ── Constants ────────────────────────────────────────────────────
export const FRAME_W = 76;
export const FRAME_H = 82;

export const DEFAULT_POSITION = { x: 50, y: 50, scale: 1.0 };

// ── Core Calculation ─────────────────────────────────────────────

/**
 * Calculate how to render/crop a photo to fill the frame exactly.
 *
 * @param {{ w: number, h: number }} photoMeta  Natural image dimensions
 * @param {number} frameW  Frame width in points/pixels
 * @param {number} frameH  Frame height in points/pixels
 * @param {{ x: number, y: number, scale: number }} photoPosition  User settings
 *
 * @returns {{
 *   displayWidth: number,
 *   displayHeight: number,
 *   offsetX: number,
 *   offsetY: number,
 *   sourceX: number,
 *   sourceY: number,
 *   sourceW: number,
 *   sourceH: number,
 *   needsCropping: boolean,
 * }}
 */
export function calculatePhotoFitInFrame(
  photoMeta,
  frameW = FRAME_W,
  frameH = FRAME_H,
  photoPosition = DEFAULT_POSITION,
) {
  const safeW = Math.max(1, photoMeta?.w || 1);
  const safeH = Math.max(1, photoMeta?.h || 1);

  // Validate position
  const pos = {
    x: clamp(photoPosition?.x ?? 50, 0, 100),
    y: clamp(photoPosition?.y ?? 50, 0, 100),
    scale: clamp(photoPosition?.scale ?? 1.0, 0.5, 2.0),
  };

  // Step 1: Aspect ratios
  const frameAspect = frameW / frameH; // ~0.927
  const photoAspect = safeW / safeH;

  // Step 2: Base scale — the minimum scale at which the image *covers* the frame
  // "Cover" means the image fills the frame entirely (like CSS object-fit: cover)
  let baseScale;
  if (photoAspect > frameAspect) {
    // Photo is wider than frame → fit by height (height fills, width overflows)
    baseScale = frameH / safeH;
  } else {
    // Photo is taller than frame → fit by width (width fills, height overflows)
    baseScale = frameW / safeW;
  }

  // Step 3: Apply user's zoom
  const finalScale = baseScale * pos.scale;

  // Step 4: Display size at this scale
  const displayWidth = safeW * finalScale;
  const displayHeight = safeH * finalScale;

  // Step 5: Focus point in original image pixel coordinates
  const focusX = (pos.x / 100) * safeW;
  const focusY = (pos.y / 100) * safeH;

  // Step 6 & 7: Determine crop boundaries
  if (displayWidth < frameW && displayHeight < frameH) {
    // Image too small to fill frame (only happens with scale < 1.0 on small images)
    // Center it and pad
    return {
      displayWidth,
      displayHeight,
      offsetX: (frameW - displayWidth) / 2,
      offsetY: (frameH - displayHeight) / 2,
      sourceX: 0,
      sourceY: 0,
      sourceW: safeW,
      sourceH: safeH,
      needsCropping: false,
    };
  }

  // Image fills frame — crop around focus point
  // How many source pixels fit in the frame at this scale?
  const sourceW = Math.min(frameW / finalScale, safeW);
  const sourceH = Math.min(frameH / finalScale, safeH);

  // Center the source rectangle on the focus point, then clamp
  let sourceX = focusX - sourceW / 2;
  let sourceY = focusY - sourceH / 2;

  sourceX = clamp(sourceX, 0, safeW - sourceW);
  sourceY = clamp(sourceY, 0, safeH - sourceH);

  return {
    displayWidth: frameW,
    displayHeight: frameH,
    offsetX: 0,
    offsetY: 0,
    sourceX,
    sourceY,
    sourceW,
    sourceH,
    needsCropping: true,
  };
}

// ── Canvas Crop for PDF ──────────────────────────────────────────

/**
 * Produce a base64 image that is exactly frameW×frameH pixels,
 * with the photo properly cropped/scaled according to the position.
 *
 * @param {string} photoDataUrl  Original image as data URL
 * @param {{ x: number, y: number, scale: number }} photoPosition
 * @param {number} frameW
 * @param {number} frameH
 * @param {number} exportScale  Multiplier for output resolution (4 = high-res PDF)
 * @returns {Promise<string>}  base64 JPEG data URL
 */
export async function cropAndResizePhotoForPdf(
  photoDataUrl,
  photoPosition,
  frameW = FRAME_W,
  frameH = FRAME_H,
  exportScale = 4,
) {
  if (!photoDataUrl) return photoDataUrl;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const photoMeta = { w: img.naturalWidth, h: img.naturalHeight };
      const fit = calculatePhotoFitInFrame(photoMeta, frameW, frameH, photoPosition);

      const canvas = document.createElement("canvas");
      canvas.width = frameW * exportScale;
      canvas.height = frameH * exportScale;
      const ctx = canvas.getContext("2d");

      // Fill with white just in case (only visible if image can't cover)
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (fit.needsCropping) {
        // Draw the cropped portion of the original image to fill the entire canvas
        ctx.drawImage(
          img,
          fit.sourceX,                  // source x
          fit.sourceY,                  // source y
          fit.sourceW,                  // source width
          fit.sourceH,                  // source height
          0,                            // dest x
          0,                            // dest y
          canvas.width,                 // dest width (fill frame)
          canvas.height,                // dest height (fill frame)
        );
      } else {
        // Image smaller than frame — center it
        const destX = fit.offsetX * exportScale;
        const destY = fit.offsetY * exportScale;
        const destW = fit.displayWidth * exportScale;
        const destH = fit.displayHeight * exportScale;
        ctx.drawImage(img, 0, 0, photoMeta.w, photoMeta.h, destX, destY, destW, destH);
      }

      resolve(canvas.toDataURL("image/jpeg", 0.95));
    };

    img.onerror = () => resolve(photoDataUrl);
    img.src = photoDataUrl;
  });
}

// ── Helpers ──────────────────────────────────────────────────────

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}
