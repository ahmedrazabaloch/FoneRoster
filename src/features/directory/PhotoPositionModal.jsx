import React, { useState, useRef, useCallback, useEffect } from "react";
import { X, RotateCw, ZoomIn, ZoomOut, Check, Move, Crosshair } from "lucide-react";
import { calculatePhotoFitInFrame } from "../idcard/photoFitUtils";

// Preview frame — scaled up version of 76×82pt for comfortable editing
const PREVIEW_SCALE = 2.8;
const FRAME_W = 76;
const FRAME_H = 82;
const PREVIEW_W = Math.round(FRAME_W * PREVIEW_SCALE); // ~213
const PREVIEW_H = Math.round(FRAME_H * PREVIEW_SCALE); // ~230

const DEFAULT_POS = { x: 50, y: 50, scale: 1.0 };

export const PhotoPositionModal = ({
  imageUrl,
  initialPosition,
  onSave,
  onCancel,
}) => {
  const [pos, setPos] = useState(() => ({
    x: initialPosition?.x ?? 50,
    y: initialPosition?.y ?? 50,
    scale: initialPosition?.scale ?? 1.0,
  }));
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Load the image once
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // ── Draw preview canvas ───────────────────────────────────────────
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    canvas.width = PREVIEW_W * dpr;
    canvas.height = PREVIEW_H * dpr;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = "#2a2a2a";
    ctx.fillRect(0, 0, PREVIEW_W, PREVIEW_H);

    const photoMeta = { w: img.naturalWidth, h: img.naturalHeight };
    const fit = calculatePhotoFitInFrame(photoMeta, FRAME_W, FRAME_H, pos);

    if (fit.needsCropping) {
      // Draw the cropped portion to fill the preview
      ctx.drawImage(
        img,
        fit.sourceX,
        fit.sourceY,
        fit.sourceW,
        fit.sourceH,
        0,
        0,
        PREVIEW_W,
        PREVIEW_H,
      );
    } else {
      // Image too small — center with padding
      const destX = fit.offsetX * PREVIEW_SCALE;
      const destY = fit.offsetY * PREVIEW_SCALE;
      const destW = fit.displayWidth * PREVIEW_SCALE;
      const destH = fit.displayHeight * PREVIEW_SCALE;
      ctx.drawImage(img, 0, 0, photoMeta.w, photoMeta.h, destX, destY, destW, destH);
    }

    // Draw frame border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, PREVIEW_W - 2, PREVIEW_H - 2);

    // Draw focus crosshair indicator
    // Map the focus point to preview coordinates
    const focusPreviewX = (pos.x / 100) * PREVIEW_W;
    const focusPreviewY = (pos.y / 100) * PREVIEW_H;

    // Only draw crosshair if it would be within the visible area
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = "#ffcc00";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(0, focusPreviewY);
    ctx.lineTo(PREVIEW_W, focusPreviewY);
    ctx.stroke();

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(focusPreviewX, 0);
    ctx.lineTo(focusPreviewX, PREVIEW_H);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.globalAlpha = 0.7;

    // Small circle at center
    ctx.beginPath();
    ctx.arc(focusPreviewX, focusPreviewY, 6, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffcc00";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }, [pos, imgLoaded]);

  // Redraw on every position/scale change
  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  // ── Drag to reposition (changes focus point) ──────────────────────
  const handleMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const startPos = { ...pos };

      const onMove = (ev) => {
        // Moving the mouse LEFT should increase x (show more of the right side)
        // because we're dragging the "window" over the image
        const dx = ((ev.clientX - startX) / PREVIEW_W) * 100;
        const dy = ((ev.clientY - startY) / PREVIEW_H) * 100;

        setPos({
          ...startPos,
          // Invert: dragging left → focus moves right
          x: clamp(startPos.x - dx, 0, 100),
          y: clamp(startPos.y - dy, 0, 100),
        });
      };

      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [pos],
  );

  // ── Scroll to zoom ────────────────────────────────────────────────
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    setPos((p) => ({
      ...p,
      scale: clamp(p.scale + (e.deltaY > 0 ? -0.05 : 0.05), 0.5, 2.0),
    }));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (el) el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      if (el) el.removeEventListener("wheel", handleWheel);
    };
  }, [handleWheel]);

  // ── Keyboard controls ─────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e) => {
      const step = e.shiftKey ? 5 : 1;
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          setPos((p) => ({ ...p, x: clamp(p.x - step, 0, 100) }));
          break;
        case "ArrowRight":
          e.preventDefault();
          setPos((p) => ({ ...p, x: clamp(p.x + step, 0, 100) }));
          break;
        case "ArrowUp":
          e.preventDefault();
          setPos((p) => ({ ...p, y: clamp(p.y - step, 0, 100) }));
          break;
        case "ArrowDown":
          e.preventDefault();
          setPos((p) => ({ ...p, y: clamp(p.y + step, 0, 100) }));
          break;
        case "Escape":
          onCancel();
          break;
        default:
          break;
      }
    },
    [onCancel],
  );

  // Auto-focus for keyboard support
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // Scale label helper
  const scaleLabel = () => {
    if (pos.scale < 0.8) return "Zoomed Out";
    if (pos.scale < 1.15) return "Fit";
    if (pos.scale < 1.6) return "Close-up";
    return "Very Close";
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white border-4 border-black shadow-brutal-lg w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: 20 }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div>
            <h3 className="font-black text-base uppercase tracking-wide flex items-center gap-2">
              <Move size={16} /> Frame Photo
            </h3>
            <p
              className="text-[10px] text-gray-400 font-bold uppercase tracking-wider"
              style={{ marginTop: 2 }}
            >
              Drag to pan · Scroll to zoom · Arrow keys for precision
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 bg-gray-100 border-2 border-black shadow-brutal-sm hover:translate-y-0.5 hover:shadow-none transition-all"
            title="Cancel"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Canvas Preview ── */}
        <div
          ref={containerRef}
          tabIndex={0}
          onMouseDown={handleMouseDown}
          onKeyDown={handleKeyDown}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            background: "#111",
            overflow: "hidden",
            cursor: "move",
            outline: "none",
            borderRadius: 4,
            border: "2px solid #000",
            padding: "24px 0",
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: PREVIEW_W,
              height: PREVIEW_H,
              borderRadius: 4,
              boxShadow: "0 0 0 1px rgba(255,255,255,0.2)",
            }}
          />

          {/* Focus point indicator label */}
          <div
            style={{
              position: "absolute",
              bottom: 6,
              left: 8,
              fontSize: 9,
              color: "rgba(255,255,255,0.5)",
              fontFamily: "monospace",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Crosshair size={10} />
            Focus: {Math.round(pos.x)}, {Math.round(pos.y)}
          </div>
        </div>

        {/* ── Scale Slider ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: 16,
            padding: "0 4px",
          }}
        >
          <ZoomOut size={14} className="text-gray-400 shrink-0" />
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.05"
            value={pos.scale}
            onChange={(e) =>
              setPos((p) => ({ ...p, scale: parseFloat(e.target.value) }))
            }
            style={{ flex: 1 }}
            className="accent-blue-500"
          />
          <ZoomIn size={14} className="text-gray-400 shrink-0" />
          <span
            className="text-xs font-bold text-gray-500"
            style={{ width: 80, textAlign: "right" }}
          >
            {pos.scale.toFixed(1)}× {scaleLabel()}
          </span>
        </div>

        {/* ── Position Sliders ── */}
        <div style={{ display: "flex", gap: 16, marginTop: 12, padding: "0 4px" }}>
          <div style={{ flex: 1 }}>
            <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
              Horizontal Focus
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={pos.x}
              onChange={(e) =>
                setPos((p) => ({ ...p, x: parseFloat(e.target.value) }))
              }
              style={{ width: "100%" }}
              className="accent-blue-500"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
              Vertical Focus
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={pos.y}
              onChange={(e) =>
                setPos((p) => ({ ...p, y: parseFloat(e.target.value) }))
              }
              style={{ width: "100%" }}
              className="accent-blue-500"
            />
          </div>
        </div>

        {/* ── Actions ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 16,
          }}
        >
          <button
            type="button"
            onClick={() => setPos({ ...DEFAULT_POS })}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-black uppercase tracking-wide text-gray-500 hover:text-gray-700 transition-colors"
          >
            <RotateCw size={12} /> Reset
          </button>
          <button
            type="button"
            onClick={() => onSave(pos)}
            className="flex items-center gap-2 px-5 py-2 font-black text-xs uppercase tracking-wide border-2 border-black bg-green-500 text-white shadow-brutal-sm hover:translate-y-0.5 hover:shadow-none transition-all"
          >
            <Check size={14} /> Apply Position
          </button>
        </div>
      </div>
    </div>
  );
};

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}
