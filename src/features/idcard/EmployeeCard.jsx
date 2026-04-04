import { useState, useEffect, useRef, useCallback } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { User } from "lucide-react";
import logoAsset from "../../assets/logo.png";
import CardFrontBg from "../../assets/card-front.png";
import CardBackBg from "../../assets/card-back.png";
import {
  ADDRESS_LINES,
  EMERGENCY_CONTACT,
  buildIdCardQrPayload,
  getCardDetails,
} from "./idCardConstants";
import { calculatePhotoFitInFrame } from "./photoFitUtils";

// ─── Shared ────────────────────────────────────────────────────────

const baseCardStyle = {
  position: "relative",
  width: "300px",
  height: "480px",
  borderRadius: "18px",
  overflow: "hidden",
  boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
  fontFamily: "Barlow, sans-serif",
};

// ─── Cover-Fill Photo Canvas ────────────────────────────────────────

/** Renders the photo with cover-fill using a canvas, matching PDF output exactly */
const CoverFillPhoto = ({ src, name, photoPosition }) => {
  const canvasRef = useRef(null);
  const DISPLAY_W = 148;
  const DISPLAY_H = 162;

  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = DISPLAY_W * dpr;
      canvas.height = DISPLAY_H * dpr;
      const ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);

      const photoMeta = { w: img.naturalWidth, h: img.naturalHeight };
      // Use 76x82 (the PDF frame) for calculation, then draw at display scale
      const fit = calculatePhotoFitInFrame(photoMeta, 76, 82, photoPosition);

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, DISPLAY_W, DISPLAY_H);

      if (fit.needsCropping) {
        ctx.drawImage(
          img,
          fit.sourceX, fit.sourceY, fit.sourceW, fit.sourceH,
          0, 0, DISPLAY_W, DISPLAY_H,
        );
      } else {
        const scaleX = DISPLAY_W / 76;
        const scaleY = DISPLAY_H / 82;
        ctx.drawImage(
          img,
          0, 0, photoMeta.w, photoMeta.h,
          fit.offsetX * scaleX, fit.offsetY * scaleY,
          fit.displayWidth * scaleX, fit.displayHeight * scaleY,
        );
      }
    };
    img.src = src;
  }, [src, photoPosition]);

  if (!src) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#B8B8B8",
          background: "#fff",
        }}
      >
        <User size={52} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ width: DISPLAY_W, height: DISPLAY_H, display: "block" }}
    />
  );
};

// ─── Front Signature ───────────────────────────────────────────────

const FrontSignatureBlock = () => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "4px",
    }}
  >
    <div
      style={{
        fontFamily: "monospace, cursive",
        fontWeight: 600,
        fontSize: "18px",
        color: "#2a2a2a",
        lineHeight: 1,
      }}
    >
      Formula One
    </div>
    <div style={{ width: "90px", borderTop: "1px solid #ccc" }} />
    <div
      style={{
        fontFamily: "Barlow, sans-serif",
        fontWeight: 400,
        fontSize: "9px",
        color: "#999",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
      }}
    >
      Authorized By
    </div>
  </div>
);

// ─── Front Side ────────────────────────────────────────────────────

const CardFront = ({ employee }) => {
  const details = getCardDetails(employee);
  const qrValue = buildIdCardQrPayload(employee);

  return (
    <div style={baseCardStyle}>
      {/* Background image */}
      <img
        src={CardFrontBg}
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          userSelect: "none",
        }}
      />

      {/* Card Content — flex column */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "20px 18px 14px",
        }}
      >
        {/* Logo */}
        <img
          src={logoAsset}
          alt="Formula One"
          style={{
            width: "150px",
            height: "46px",
            objectFit: "contain",
            flexShrink: 0,
          }}
        />

        {/* Photo */}
        <div
          style={{
            marginTop: "14px",
            width: "148px",
            height: "162px",
            borderRadius: "9px",
            border: "3px solid #fff",
            boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
            overflow: "hidden",
            flexShrink: 0,
            position: "relative",
          }}
        >
          <CoverFillPhoto
            src={details.photoUrl}
            name={details.name}
            photoPosition={details.photoPosition}
          />
        </div>

        {/* Name / Designation / Employee ID */}
        <div
          style={{
            marginTop: "14px",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "3px",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: "20px",
              color: "#1a1a1a",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "100%",
            }}
            title={details.name}
          >
            {details.name}
          </div>

          <div
            style={{
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: "15px",
              color: "#666",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "100%",
            }}
            title={details.designation}
          >
            {details.designation}
          </div>

          <div
            style={{
              fontWeight: 600,
              fontSize: "14px",
              color: "#444",
              letterSpacing: "0.04em",
              lineHeight: 1.2,
            }}
          >
            Employee ID: {details.employeeId}
          </div>
        </div>

        {/* Project Banner */}
        <div
          style={{
            marginTop: "14px",
            padding: "6px 18px",
            fontWeight: 700,
            fontSize: "11px",
            color: "#fff",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            background: "linear-gradient(135deg, #ff3b4d, #d91e36)",
            borderRadius: "6px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
            flexShrink: 0,
          }}
        >
          ZONG FUEL LOGISTICS PROJECT
        </div>

        {/* QR + Signature row — pushed to bottom */}
        <div
          style={{
            marginTop: "auto",
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          {/* QR Code */}
          <div
            style={{
              background: "#fff",
              padding: "4px",
              borderRadius: "4px",
              lineHeight: 0,
            }}
          >
            <QRCodeCanvas
              value={qrValue}
              size={54}
              level="H"
              includeMargin={false}
              bgColor="transparent"
            />
          </div>

          {/* Signature */}
          <FrontSignatureBlock />
        </div>
      </div>
    </div>
  );
};

// ─── Back Side ─────────────────────────────────────────────────────

const CardBack = ({ employee }) => {
  const details = getCardDetails(employee);
  const fields = [
    { label: "Father Name", value: details.fatherName },
    { label: "CNIC", value: details.cnic },
    { label: "License", value: details.license },
    { label: "Blood Group", value: details.bloodGroup },
    { label: "Emergency Contact", value: EMERGENCY_CONTACT },
  ];

  return (
    <div style={baseCardStyle}>
      {/* Background image */}
      <img
        src={CardBackBg}
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          userSelect: "none",
        }}
      />

      {/* Tower Watermark — right side, like the reference image */}
      <div
        style={{
          position: "absolute",
          top: "47px",
          right: "36%",
          width: "45%",
          height: "65%",
          opacity: 0.3,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      ></div>

      {/* Card Content — flex column */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* "Personal Details" Red Header Banner */}
        <div
          style={{
            background: "linear-gradient(135deg, #ff3b4d, #d91e36)",
            padding: "10px 22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "Barlow, sans-serif",
              fontWeight: 700,
              fontSize: "14px",
              color: "#fff",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Personal Details
          </span>
        </div>

        {/* Fields */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "flex-start",
            padding: "14px 22px 10px",
            gap: "10px",
          }}
        >
          {fields.map((field) => (
            <div
              key={field.label}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1px",
                alignItems: "flex-start",
              }}
            >
              <span
                style={{
                  fontFamily: "Barlow, sans-serif",
                  fontWeight: 700,
                  fontSize: "16px",
                  color: "#1a1a1a",
                  lineHeight: 1.3,
                }}
              >
                {field.label}:
              </span>
              <span
                style={{
                  fontFamily: "Barlow, sans-serif",
                  fontWeight: 400,
                  fontSize: "17px",
                  color: "#333",
                  lineHeight: 1.3,
                  wordBreak: "break-word",
                }}
              >
                {field.value}
              </span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div
          style={{
            margin: "0 22px",
            borderTop: "0.5px solid rgba(0,0,0,0.15)",
            flexShrink: 0,
          }}
        />

        {/* Logo + Address footer */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "10px 18px 14px",
            gap: "6px",
            flexShrink: 0,
          }}
        >
          <img
            src={logoAsset}
            alt="Formula One"
            style={{
              width: "120px",
              height: "36px",
              objectFit: "contain",
            }}
          />
          <div
            style={{
              fontFamily: "Barlow, sans-serif",
              fontWeight: 700,
              fontSize: "12px",
              color: "#333",
              lineHeight: 1.6,
              textAlign: "center",
            }}
          >
            {ADDRESS_LINES.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Combined Export ───────────────────────────────────────────────

export const EmployeeCard = ({
  employee,
  side = "front",
}) => {
  if (side === "back") return <CardBack employee={employee} />;
  return <CardFront employee={employee} />;
};
