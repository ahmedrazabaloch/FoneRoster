import React, { useState, useRef, useCallback, useEffect } from "react";
import { X, RotateCw, ZoomIn, ZoomOut, Check, Move } from "lucide-react";

// Frame matches ID card photo ratio (148:162) at 1.5× scale
const FRAME_W = 222;
const FRAME_H = 243;
const DEFAULT_POS = { x: 50, y: 50, scale: 1 };

export const PhotoPositionModal = ({
  imageUrl,
  initialPosition,
  onSave,
  onCancel,
}) => {
  const [pos, setPos] = useState(initialPosition || DEFAULT_POS);
  const areaRef = useRef(null);

  // Auto-focus for keyboard support
  useEffect(() => {
    areaRef.current?.focus();
  }, []);

  // ── Drag to move ──────────────────────────────────────────────────
  const handleMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const start = { ...pos };

      const onMove = (ev) => {
        setPos({
          ...start,
          x: Math.max(
            0,
            Math.min(100, start.x + ((ev.clientX - startX) / FRAME_W) * 100),
          ),
          y: Math.max(
            0,
            Math.min(100, start.y + ((ev.clientY - startY) / FRAME_H) * 100),
          ),
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
      scale: Math.max(1, Math.min(3, p.scale + (e.deltaY > 0 ? -0.05 : 0.05))),
    }));
  }, []);

  // ── Keyboard controls ─────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e) => {
      const step = e.shiftKey ? 5 : 1;
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          setPos((p) => ({ ...p, x: Math.max(0, p.x - step) }));
          break;
        case "ArrowRight":
          e.preventDefault();
          setPos((p) => ({ ...p, x: Math.min(100, p.x + step) }));
          break;
        case "ArrowUp":
          e.preventDefault();
          setPos((p) => ({ ...p, y: Math.max(0, p.y - step) }));
          break;
        case "ArrowDown":
          e.preventDefault();
          setPos((p) => ({ ...p, y: Math.min(100, p.y + step) }));
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

  // ── Image positioning math ────────────────────────────────────────
  // Maps the {x, y, scale} values to pixel positions relative to the
  // preview area center, matching the card's CSS:
  //   left: x%; top: y%; transform: translate(-50%,-50%) scale(s)
  const imgStyle = {
    position: "absolute",
    height: `${pos.scale * FRAME_H}px`,
    width: "auto",
    left: `calc(50% + ${FRAME_W * (pos.x / 100 - 0.5)}px)`,
    top: `calc(50% + ${FRAME_H * (pos.y / 100 - 0.5)}px)`,
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
    userSelect: "none",
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
              <Move size={16} /> Position Photo
            </h3>
            <p
              className="text-[10px] text-gray-400 font-bold uppercase tracking-wider"
              style={{ marginTop: 2 }}
            >
              Drag to move · Scroll to zoom · Arrow keys for precision
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

        {/* ── Preview Area ── */}
        <div
          ref={areaRef}
          tabIndex={0}
          onMouseDown={handleMouseDown}
          onWheel={handleWheel}
          onKeyDown={handleKeyDown}
          style={{
            position: "relative",
            width: "100%",
            height: 360,
            background: "#111",
            overflow: "hidden",
            cursor: "move",
            outline: "none",
            borderRadius: 4,
            border: "2px solid #000",
          }}
        >
          {/* Image behind the overlay */}
          <img
            src={imageUrl}
            alt="Adjust position"
            draggable={false}
            style={imgStyle}
          />

          {/* Frame overlay — transparent cutout with dark surround */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: FRAME_W,
              height: FRAME_H,
              border: "2px solid rgba(255,255,255,0.8)",
              borderRadius: 6,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
              pointerEvents: "none",
              zIndex: 2,
            }}
          />
        </div>

        {/* ── Zoom Slider ── */}
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
            min="1"
            max="3"
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
            style={{ width: 40, textAlign: "right" }}
          >
            {Math.round(pos.scale * 100)}%
          </span>
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
            onClick={() => setPos(DEFAULT_POS)}
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
